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
const {queueObjects} = config
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

new routing.registerRoute(
  ({url, request }) => {
    return (url.pathname === '/result');
  },
  resultHandler
)

new routing.registerRoute(
  ({url, request }) => {
    return (url.pathname === '/status');
  },
  queueStatusHandler
)

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