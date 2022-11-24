/*jshint esversion: 8 */
/* jshint undef: false */
importScripts('js/vendor/workbox-v6.5.1/workbox-sw.js');
importScripts('sw/syncController.js')
importScripts('sw/renderController.js')

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}

const SW_VERSION = '0.1.0'; //2022-11-24 first release
let syncInProgress = false

workbox.setConfig({
  modulePathPrefix: 'js/vendor/workbox-v6.5.1/',
  debug: false, // set to false for prod build 
  cleanupOutdatedCaches: true
})

const {
  strategies,
  routing,
  precaching
} = workbox;

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', async (event) => {
  skipWaiting();
})

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim())
})

new routing.registerRoute(new routing.NavigationRoute(
  new precaching.createHandlerBoundToURL('/edit'), {
    allowlist: [new RegExp('/edit/[a-z0-9-]+')]
  }
))
new routing.registerRoute(new routing.NavigationRoute(
  new precaching.createHandlerBoundToURL('/show'), {
    allowlist: [new RegExp('/show/[a-z0-9-]+')]
  }
))
new routing.registerRoute(({url }) => url.pathname == '/list',
  new strategies.CacheOnly({
    cacheName: 'lists',
    plugins: [{
      handlerDidError: () => renderHandlers.noThings()
    }]
  })
);

self.addEventListener('message', async (event) => {

  console.log(event.data)
  const method = event.data.type

  if (method === 'GET_VERSION') {
    event.ports[0].postMessage(SW_VERSION);
    return
  }
  if (method === 'IS_SYNC_IN_PROGRESS') {
    event.ports[0].postMessage(self.syncInProgress)
    return
  }
  if (method === 'RENDER_LIST') {
    await renderHandlers.thingsList()
  }


  if (!method) {
    console.error(`no ${method}`)
    return;
  } else {
    const handlerMethod = syncHandlers[method] || renderHandlers[handler]
  }
  if (handlerMethod === undefined){
    console.log(`nosyncHandlers[${method}] and no renderHandlers[${method}]`)
    return;
  }

  if (method == 'transmitText'){
    event.waitUntil(
      syncHandlers[method]()
        .then(async (sync) => {
          console.log(sync)
          postMessage({
            event: 'sync.ended',
            text: `${sync == 'complete' ?'Sync completed':'Sync is not completed' }`,
            sync: sync,
            class: 'success'
          })
          await setKey('needSync', 0)
        })
      .catch((syncError) => {
        if (syncError.message == "Failed to fetch") { // server is unreachable
          postMessage({
            type: 'user.notify',
            text: `We’re offline, sailor ⛵: ${syncError.toString()}<br>
                  Give it a try later`,
            class: 'info'
          })
        } else { // thrown by syncController@postFile|@postModels
          postMessage({
            type: 'user.notify',
            text: `Sync failed because<br>
                ${syncError.toString()}<br>
                ${syncError.stack}`,
            class: 'failure'
          })
        }
      })
      .finally(async () => {
        await setKey('lastSyncTimestamp', now())
        await renderHandlers.thingsList()
      })
    )
  }
  else {
    event.waitUntil(handlerMethod())
  }
});

if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    console.log(`sync event was received. Event : ${event.tag}`)

    if (event.tag.startsWith('sync-data')) { // tag form sync-data-<uts>

      event.waitUntil(
        syncHandlers.transmitText()
        .then(async (sync) => {
          console.log(sync)
          postMessage({
            event: 'sync.ended',
            text: `${sync == 'complete' ?'Sync completed':'Sync is not completed' }`,
            sync: sync,
            class: 'success'
          })
          await setKey('needSync', 0)
        })
       .catch((syncError) => {
          // @TODO consider using Web Notification as the app may be in background
          if (event.lastChance) {
            postMessage({
              type: 'user.notify',
              text: `Sync failed<br>
                Try later`,
              class: 'failure'
            })

          } else if (syncError.message == "Failed to fetch") { // server is unreachable
            postMessage({
              type: 'user.notify',
              text: `Cannot reach the server<br>
                Give it a try later`,
              class: 'info'
            })
          } else { // thrown by syncController@postFile|@postModels
            postMessage({
              type: 'user.notify',
              text: `Sync failed because<br>
                ${syncError.toString()}<br>
                ${syncError.stack}`,
              class: 'failure'
            })
          }
        })
        .finally(async () => {
          await setKey('lastSyncTimestamp', now())
          await renderHandlers.thingsList()
        })
    )
  }
})
}

function now(){
  return Math.floor(new Date().getTime() / 1000)
}
function postMessage(message)
{
    return self.clients.matchAll().then(function (clients) {
        clients.forEach(function (client) {
            client.postMessage(message)
        });
    });
}
