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

workbox.precaching.precacheAndRoute([{"revision":"73b705f25c666fdf42c431ab9834aaad","url":"css/picnic.min.css"},{"revision":"888d992c0aed5088c13a4bbd6891afdb","url":"css/style.css"},{"revision":"8795fce0193a4ec9893d558c8db6061d","url":"js/app.js"},{"revision":"766ab9de012480447223956b48f2e9b5","url":"js/db.js"},{"revision":"32b03d39778ee35217958d53cf5cb64f","url":"js/edit/changeHandlers.js"},{"revision":"036840bf8b942ae13c36961cd5dd48b3","url":"js/edit/fileController.js"},{"revision":"a0b0b5a85025a95892ebe9f095cc8586","url":"js/edit/modelController.js"},{"revision":"cf9383d7827bed1602dd4c275b14c785","url":"js/edit/updateFormControl.js"},{"revision":"0a3452453d478477661e55b4169bb01b","url":"js/libs/fileRemover.js"},{"revision":"04ac66c9c511ddc7a7f2a20e83f11b43","url":"js/libs/localISODateTime.js"},{"revision":"19acd423890fe1e0c006cfe84b601a0e","url":"js/libs/objectByPath.js"},{"revision":"30e6cb9f980ddcc9f107c5aff6cf32d2","url":"js/libs/query.js"},{"revision":"9cd44618418ab6499260f96085bb24b2","url":"js/libs/readableFileSize.js"},{"revision":"433c93df58534ef453ff1448e7894326","url":"js/libs/user-notification.js"},{"revision":"91af5a288cfa81e6611ac900934e095b","url":"js/list/listController.js"},{"revision":"87d739325d769f1ddcd371c4851f4838","url":"js/show/showController.js"},{"revision":"e770e4391fc53a450b9d70e34e9151e6","url":"js/vendor/idb/index.js"},{"revision":"6d723fa30fbc39411ae7d62943811177","url":"js/vendor/idb/umd.js"},{"revision":"5ee54b5c281506b51bc54d62fa13fb0b","url":"js/vendor/workbox-v6.5.1/workbox-core.prod.js"},{"revision":"6cc0a223bd4c52afae9913872485d938","url":"js/vendor/workbox-v6.5.1/workbox-expiration.prod.js"},{"revision":"ac77467d534fd96ede278d675da686dd","url":"js/vendor/workbox-v6.5.1/workbox-precaching.prod.js"},{"revision":"ea5c1dfd0956c0045770828adfb22e24","url":"js/vendor/workbox-v6.5.1/workbox-routing.prod.js"},{"revision":"131e46f3f783ce9bd607ef33d4761165","url":"js/vendor/workbox-v6.5.1/workbox-strategies.prod.js"},{"revision":"3d88ff23ab8a64f34ca0bdf10b96c883","url":"js/vendor/workbox-v6.5.1/workbox-streams.prod.js"},{"revision":"0c4030a5acd484abab575ed6fe0d4c5c","url":"js/vendor/workbox-v6.5.1/workbox-sw.js"},{"revision":"c5b6fbdc8e605b6e5cd0d1ae6c504ef9","url":"js/vendor/workbox-v6.5.1/workbox-window.prod.es5.mjs"},{"revision":"41a313eaeeece5d4789d79bb2aa7f892","url":"js/vendor/workbox-v6.5.1/workbox-window.prod.mjs"},{"revision":"ae8d954f5e2afd0d1ddaad9c19071f12","url":"js/vendor/workbox-v6.5.1/workbox-window.prod.umd.js"},{"revision":"d7b6fbae310eb80b79b45cb70df86175","url":"sw/db.js"},{"revision":"919ce548a1f2982b57a94e9cbad4008d","url":"sw/syncController.js"},{"revision":"17d71d4c40b9794958eb8c29fe03777d","url":"/"},{"revision":"ffc70d70db1dc295e7aced61e1ec6bf7","url":"/edit"},{"revision":"7ff03a038bd07350cd0771fa1a20a0a6","url":"/list"},{"revision":"9988a89977a21fa24fb0594756a8975a","url":"/show"}])

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
  if (handler === 'DO_SYNC') {
    try{
      self.syncInProgress = true
      event.waitUntil(startSync())
      return
    } catch (syncError){
      postMessage({
        type: 'user.notify',
        text: syncError.toString()
      })
    }
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

function postMessage(message)
{
    return self.clients.matchAll().then(function (clients) {
        clients.forEach(function (client) {
            client.postMessage(message)
        });
    });
}

// new routing.registerRoute(
//   ({url, request }) => {
//     return (url.pathname === '/result');
//   },
//   resultHandler
// )

// new routing.registerRoute(
//   ({url, request }) => {
//     return (url.pathname === '/status');
//   },
//   queueStatusHandler
// )