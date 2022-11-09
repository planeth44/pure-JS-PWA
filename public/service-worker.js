/*jshint esversion: 8 */
/* jshint undef: false */
importScripts('js/vendor/workbox-v6.5.1/workbox-sw.js');
importScripts('sw/syncController.js')

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}

const SW_VERSION = '0.0.1';
let syncInProgress = false

workbox.setConfig({
  modulePathPrefix: 'js/vendor/workbox-v6.5.1/',
  debug: true, // set to false for prod build 
  cleanupOutdatedCaches: true
})

const {
  strategies,
  routing,
  precaching,
  backgroundSync
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


self.addEventListener('message', async (event) => {

  console.log(event.data)
  const handler = event.data.type

  if (handler === 'GET_VERSION') {
    event.ports[0].postMessage(SW_VERSION);
    return
  }
  if (handler === 'IS_SYNC_IN_PROGRESS') {
    event.ports[0].postMessage(self.syncInProgress)
    return
  }

  if (!handler || !syncHandlers[handler]) {
    console.error(`no ${handler} or no syncHandlers[${handler}]`)
    return;
  }

  try {
    event.waitUntil(syncHandlers[handler]())
  } catch (error) {
    postMessage({
      type: 'user.notify',
      text: error.toString()
    })
  }
});

if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    console.log(`sync event was received. Event : ${event.tag}`)

    if (event.tag.startsWith('sync-data')) { // tag form sync-data-<uts>

      event.waitUntil(
        syncHandlers.transmitText()
        .then(() => {
            postMessage({
              type: 'model.container.update',
              text: `Sync completed`,
              class: 'success'
            })
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
              type: 'model.container.update',
              text: `${syncError.toString()}<br>
                Sync failed<br>
                Give it a try later`,
              class: 'info'
            })
          } else {
            postMessage({
              type: 'model.container.update',
              text: `${syncError.toString()}<br>
                We’ll try a sync later`,
              class: 'info'
            })
          }

        })
      )
    }
  })
} else {

  syncHandlers.transmitText()

}

function postMessage(message)
{
    return self.clients.matchAll().then(function (clients) {
        clients.forEach(function (client) {
            client.postMessage(message)
        });
    });
}
