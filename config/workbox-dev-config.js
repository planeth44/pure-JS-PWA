module.exports = {
  "globDirectory": "public/",
  "globPatterns": [
    "**/*.{css,js,mjs,html,png,json}"
  ],
   "globIgnores": [
    "js/vendor/workbox*/workbox-broadcast-update.*",
    "js/vendor/workbox*/workbox-offline-ga.*",
    "js/vendor/workbox*/workbox-cacheable-response.*",
    "js/vendor/workbox*/workbox-range-requests.*",
    "js/vendor/workbox*/workbox-navigation-preload.*",
    "js/vendor/workbox*/*.dev.js.map",
    "js/vendor/workbox*/*.dev.js",
  ],
  "templatedURLs":{
    '/': [
      '../templates/pages/index.html.twig',
      '../templates/base.html.twig',
    ],
    '/edit': [
      '../templates/pages/edit.html.twig',
      '../templates/base.html.twig',
    ],
    '/list': [
      '../templates/pages/list.html.twig',
      '../templates/base.html.twig',
    ],
    '/show': [
      '../templates/pages/show.html.twig',
      '../templates/base.html.twig',
    ],
  },
  "globFollow": false,
  "swDest": "public/sw.js",
  "swSrc": "public/service-worker.js"
};