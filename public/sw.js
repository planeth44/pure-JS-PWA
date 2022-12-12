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

workbox.precaching.precacheAndRoute([{"revision":"73b705f25c666fdf42c431ab9834aaad","url":"css/picnic.min.css"},{"revision":"21d6945cf3228fc131e001807175ac5b","url":"css/style.css"},{"revision":"bb65f434eab9b14fd9c6297b0cca9a6a","url":"js/app.js"},{"revision":"8cbbdd986d4a022a24f8c366afea43e6","url":"js/Constants.js"},{"revision":"f4a39f085e606355a170f5ad38ac0ba2","url":"js/db.js"},{"revision":"32b03d39778ee35217958d53cf5cb64f","url":"js/edit/changeHandlers.js"},{"revision":"4d919899447dcca6217ec29263592d32","url":"js/edit/fileController.js"},{"revision":"cf9383d7827bed1602dd4c275b14c785","url":"js/edit/formControlUpdater.js"},{"revision":"459ad3176bcaafbeb938cb1717174ae2","url":"js/edit/modelController.js"},{"revision":"6e9f1460fe3e250d308813ebc8d0bbd5","url":"js/home/homeController.js"},{"revision":"0a3452453d478477661e55b4169bb01b","url":"js/libs/fileRemover.js"},{"revision":"32a362a294db9bf36a3a4afaf1ae7caa","url":"js/libs/isOnline.js"},{"revision":"04ac66c9c511ddc7a7f2a20e83f11b43","url":"js/libs/localISODateTime.js"},{"revision":"19acd423890fe1e0c006cfe84b601a0e","url":"js/libs/objectByPath.js"},{"revision":"30e6cb9f980ddcc9f107c5aff6cf32d2","url":"js/libs/query.js"},{"revision":"9cd44618418ab6499260f96085bb24b2","url":"js/libs/readableFileSize.js"},{"revision":"65429a967c4abea8a0737b89f9f6f89d","url":"js/libs/user-notification.js"},{"revision":"2e75655ef5194750089cc92a3e7a6ace","url":"js/list/failedController.js"},{"revision":"d58a9c680774a79f73f51ef4e9728107","url":"js/ops.js"},{"revision":"a76f12fcf79905e16253f543a64de589","url":"js/show/showController.js"},{"revision":"e770e4391fc53a450b9d70e34e9151e6","url":"js/vendor/idb/index.js"},{"revision":"6d723fa30fbc39411ae7d62943811177","url":"js/vendor/idb/umd.js"},{"revision":"5ee54b5c281506b51bc54d62fa13fb0b","url":"js/vendor/workbox-v6.5.1/workbox-core.prod.js"},{"revision":"6cc0a223bd4c52afae9913872485d938","url":"js/vendor/workbox-v6.5.1/workbox-expiration.prod.js"},{"revision":"ac77467d534fd96ede278d675da686dd","url":"js/vendor/workbox-v6.5.1/workbox-precaching.prod.js"},{"revision":"ea5c1dfd0956c0045770828adfb22e24","url":"js/vendor/workbox-v6.5.1/workbox-routing.prod.js"},{"revision":"0c4030a5acd484abab575ed6fe0d4c5c","url":"js/vendor/workbox-v6.5.1/workbox-sw.js"},{"revision":"c5b6fbdc8e605b6e5cd0d1ae6c504ef9","url":"js/vendor/workbox-v6.5.1/workbox-window.prod.es5.mjs"},{"revision":"41a313eaeeece5d4789d79bb2aa7f892","url":"js/vendor/workbox-v6.5.1/workbox-window.prod.mjs"},{"revision":"ae8d954f5e2afd0d1ddaad9c19071f12","url":"js/vendor/workbox-v6.5.1/workbox-window.prod.umd.js"},{"revision":"5ff50df293ede6c0f96382438f488d54","url":"sw/db.js"},{"revision":"2738d5bf7cd65a66422a7eda70866125","url":"sw/renderController.js"},{"revision":"3da62143819f7dbbebb6651590b73ad4","url":"sw/syncController.js"},{"revision":"643d01778edc88dc41758520ced8bf3a","url":"/"},{"revision":"74be9c0ee3d278a642421bce79f973c2","url":"/header"},{"revision":"c7acce8a8899a4e52639fe1b9865e9c3","url":"/footer"},{"revision":"1ddaac164675472f3ef8494077bcc229","url":"/edit"},{"revision":"0e9db2ad665cb1951294151a3381eff5","url":"/failed"},{"revision":"e4c4a856500c9eafcf48eb13ea53108e","url":"/show"}])

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
    return
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
