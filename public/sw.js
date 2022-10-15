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

workbox.precaching.precacheAndRoute([{"revision":"73b705f25c666fdf42c431ab9834aaad","url":"css/picnic.min.css"},{"revision":"c291d0e39cb7e8754f8529533f5a9ed9","url":"css/style.css"},{"revision":"6353c2a09e043b2e5d8ef5fa0e4aee59","url":"js/app.js"},{"revision":"c16920262ee904e5d773e51d233b273e","url":"js/db.js"},{"revision":"df91007aee8ff06bfa5349f1c4107113","url":"js/edit/changeHandlers.js"},{"revision":"1b47292064072cf2f40ab1e9010126f7","url":"js/edit/modelController.js"},{"revision":"be7891fa48eccf7383cefa7ff0d7757d","url":"js/edit/updateFormControl.js"},{"revision":"04ac66c9c511ddc7a7f2a20e83f11b43","url":"js/libs/localISODateTime.js"},{"revision":"19acd423890fe1e0c006cfe84b601a0e","url":"js/libs/objectByPath.js"},{"revision":"31918090a5b6710510c788a69acac79e","url":"js/libs/user-notification.js"},{"revision":"e770e4391fc53a450b9d70e34e9151e6","url":"js/vendor/idb/index.js"},{"revision":"35b499fe32cc82d1b26d05b35bd829b9","url":"js/vendor/workbox-v6.5.1/workbox-background-sync.prod.js"},{"revision":"5ee54b5c281506b51bc54d62fa13fb0b","url":"js/vendor/workbox-v6.5.1/workbox-core.prod.js"},{"revision":"6cc0a223bd4c52afae9913872485d938","url":"js/vendor/workbox-v6.5.1/workbox-expiration.prod.js"},{"revision":"ac77467d534fd96ede278d675da686dd","url":"js/vendor/workbox-v6.5.1/workbox-precaching.prod.js"},{"revision":"43702b61aaccf2aabf1da711d6fcab50","url":"js/vendor/workbox-v6.5.1/workbox-recipes.prod.js"},{"revision":"ea5c1dfd0956c0045770828adfb22e24","url":"js/vendor/workbox-v6.5.1/workbox-routing.prod.js"},{"revision":"131e46f3f783ce9bd607ef33d4761165","url":"js/vendor/workbox-v6.5.1/workbox-strategies.prod.js"},{"revision":"3d88ff23ab8a64f34ca0bdf10b96c883","url":"js/vendor/workbox-v6.5.1/workbox-streams.prod.js"},{"revision":"0c4030a5acd484abab575ed6fe0d4c5c","url":"js/vendor/workbox-v6.5.1/workbox-sw.js"},{"revision":"c7e0cc6e6a65a02975a3548449b8f2a8","url":"js/vendor/workbox-v6.5.1/workbox-window.dev.es5.mjs"},{"revision":"f9d82ec1fb61d8325b231f809e644a1e","url":"js/vendor/workbox-v6.5.1/workbox-window.dev.mjs"},{"revision":"57d57c49fb73ae4b1fe8bc981c6a6ba2","url":"js/vendor/workbox-v6.5.1/workbox-window.dev.umd.js"},{"revision":"c5b6fbdc8e605b6e5cd0d1ae6c504ef9","url":"js/vendor/workbox-v6.5.1/workbox-window.prod.es5.mjs"},{"revision":"41a313eaeeece5d4789d79bb2aa7f892","url":"js/vendor/workbox-v6.5.1/workbox-window.prod.mjs"},{"revision":"ae8d954f5e2afd0d1ddaad9c19071f12","url":"js/vendor/workbox-v6.5.1/workbox-window.prod.umd.js"},{"revision":"5b255d5563fac4e2b938c683966b385c","url":"/"},{"revision":"17775d0c6ace029ed0b5e175325f3c2b","url":"/edit"}])

self.addEventListener('install', async (event) => {
  skipWaiting();
})

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim())
})

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