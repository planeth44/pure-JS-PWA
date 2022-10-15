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
      '../templates/head.html.twig',
      '../templates/footer.html.twig',
      '../templates/nav.html.twig'
    ],
    '/create': [
      '../templates/pages/objectForm.html.twig',
      '../templates/base.html.twig',
      '../templates/head.html.twig',
      '../templates/footer.html.twig',
      '../templates/nav.html.twig'
    ],
    '/add': [
      '../templates/pages/objectAdd.html.twig',
      '../templates/base.html.twig',
      '../templates/head.html.twig',
      '../templates/footer.html.twig',
      '../templates/nav.html.twig'
    ],
    '/statusTmpl': [
      '../templates/pages/statusTmpl.html.twig',
      '../templates/base.html.twig',
      '../templates/head.html.twig',
      '../templates/footer.html.twig',
      '../templates/nav.html.twig'
    ],
    '/head':[
      '../templates/head.html.twig'
    ],
    '/footer':[
      '../templates/footer.html.twig'
    ],
    '/nav':[
      '../templates/nav.html.twig'
    ],
  },
  "globFollow": false,
  "swDest": "public/sw.js",
  "swSrc": "public/service-worker.js"
};