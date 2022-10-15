/*jshint esversion: 8 */
/* jshint undef: false */
importScripts('js/vendor/workbox-v6.5.1/workbox-sw.js');
// importScripts('sw/uploadController.js')
// importScripts('sw/resultController.js')
// importScripts('sw/queueStatusController.js')
// importScripts('libs/config.js')

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

workbox.precaching.precacheAndRoute([{"revision":"73b705f25c666fdf42c431ab9834aaad","url":"css/picnic.min.css"},{"revision":"454bfe6a84ed3cc58114204dd6c6920a","url":"css/style.css"},{"revision":"048b1444dc29da29b4ab0f149babdab3","url":"js/app.js"},{"revision":"c16920262ee904e5d773e51d233b273e","url":"js/db.js"},{"revision":"32b03d39778ee35217958d53cf5cb64f","url":"js/edit/changeHandlers.js"},{"revision":"bedd293e76eb43bf620783b34ebb70ff","url":"js/edit/modelController.js"},{"revision":"be7891fa48eccf7383cefa7ff0d7757d","url":"js/edit/updateFormControl.js"},{"revision":"04ac66c9c511ddc7a7f2a20e83f11b43","url":"js/libs/localISODateTime.js"},{"revision":"19acd423890fe1e0c006cfe84b601a0e","url":"js/libs/objectByPath.js"},{"revision":"31918090a5b6710510c788a69acac79e","url":"js/libs/user-notification.js"},{"revision":"c7437b488a02e5953daca661203c93d8","url":"js/list/listController.js"},{"revision":"fca1a7a5ab72106f75c182c3bbed8f9c","url":"js/show/showController.js"},{"revision":"e770e4391fc53a450b9d70e34e9151e6","url":"js/vendor/idb/index.js"},{"revision":"35b499fe32cc82d1b26d05b35bd829b9","url":"js/vendor/workbox-v6.5.1/workbox-background-sync.prod.js"},{"revision":"5ee54b5c281506b51bc54d62fa13fb0b","url":"js/vendor/workbox-v6.5.1/workbox-core.prod.js"},{"revision":"6cc0a223bd4c52afae9913872485d938","url":"js/vendor/workbox-v6.5.1/workbox-expiration.prod.js"},{"revision":"ac77467d534fd96ede278d675da686dd","url":"js/vendor/workbox-v6.5.1/workbox-precaching.prod.js"},{"revision":"43702b61aaccf2aabf1da711d6fcab50","url":"js/vendor/workbox-v6.5.1/workbox-recipes.prod.js"},{"revision":"ea5c1dfd0956c0045770828adfb22e24","url":"js/vendor/workbox-v6.5.1/workbox-routing.prod.js"},{"revision":"131e46f3f783ce9bd607ef33d4761165","url":"js/vendor/workbox-v6.5.1/workbox-strategies.prod.js"},{"revision":"3d88ff23ab8a64f34ca0bdf10b96c883","url":"js/vendor/workbox-v6.5.1/workbox-streams.prod.js"},{"revision":"0c4030a5acd484abab575ed6fe0d4c5c","url":"js/vendor/workbox-v6.5.1/workbox-sw.js"},{"revision":"c7e0cc6e6a65a02975a3548449b8f2a8","url":"js/vendor/workbox-v6.5.1/workbox-window.dev.es5.mjs"},{"revision":"f9d82ec1fb61d8325b231f809e644a1e","url":"js/vendor/workbox-v6.5.1/workbox-window.dev.mjs"},{"revision":"57d57c49fb73ae4b1fe8bc981c6a6ba2","url":"js/vendor/workbox-v6.5.1/workbox-window.dev.umd.js"},{"revision":"c5b6fbdc8e605b6e5cd0d1ae6c504ef9","url":"js/vendor/workbox-v6.5.1/workbox-window.prod.es5.mjs"},{"revision":"41a313eaeeece5d4789d79bb2aa7f892","url":"js/vendor/workbox-v6.5.1/workbox-window.prod.mjs"},{"revision":"ae8d954f5e2afd0d1ddaad9c19071f12","url":"js/vendor/workbox-v6.5.1/workbox-window.prod.umd.js"},{"revision":"3ebe0e98a7e456679fc73b113d8e0c65","url":"/"},{"revision":"647cfda5ef9b4352d1baf083bb5d3a72","url":"/edit"},{"revision":"5f69cf468d6bba8b0fa8ab745ead31b1","url":"/list"},{"revision":"6261e88ea835b8fef9de2db67be50442","url":"/show"}])

self.addEventListener('install', async (event) => {
  skipWaiting();
})

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim())
})

  new routing.registerRoute(new routing.NavigationRoute(
      new precaching.createHandlerBoundToURL('/edit'), {
          allowlist: [new RegExp('/edit/[0-9]+')]
      }
  ))
  new routing.registerRoute(new routing.NavigationRoute(
      new precaching.createHandlerBoundToURL('/show'), {
          allowlist: [new RegExp('/show/[0-9]+')]
      }
  ))

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

self.addEventListener("message", o => {
  if(o.data && "SKIP_WAITING" === o.data.type){
    self.skipWaiting()
  }
  else{
    console.log(o.data)
  }
})

function postMsg(message) {
  return self.clients.matchAll().then(function(clients) {
    clients.forEach(function(client) {
      client.postMessage(message)
    });
  });
}