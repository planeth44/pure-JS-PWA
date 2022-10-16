/*jshint esversion: 8 */
import {Workbox} from './vendor/workbox-v6.5.1/workbox-window.prod.mjs';
import notifyUser from '../js/libs/user-notification.js'

if (!('randomUUID' in crypto)) {
  // https://stackoverflow.com/a/2117523/2800218
  // LICENSE: https://creativecommons.org/licenses/by-sa/4.0/legalcode
    crypto.randomUUID = function randomUUID()
    {
        return (
        [1e7]+-1e3+-4e3+-8e3+-1e11).replace(
            /[018]/g,
            c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
};

var APP = {
  uuid : crypto.randomUUID(),

  /*
    file type pre-selection list
    see available mime in public/libs/input-accept-mime-type.md
  */
  acceptedFileTypes: []
}

var wb;

// <!-- register your service Worker -->

if ('serviceWorker' in navigator) {

  wb = new Workbox('/sw.js', {
    scope: '/'
  });
  wb.register();
}

navigator.serviceWorker.addEventListener("controllerchange", (evt) => {
  console.log("controller changed");
  // this.controller = navigator.serviceWorker.controller;
})

/*
  User notification
*/

navigator.serviceWorker.onmessage = function(evt) {
  const message = evt.data

  if (message.type === 'user.notify') {
    notifyUser(message)
  }
}

document.addEventListener('message', (event) => {
  if (event.detail.type === 'user.notify') {
    notifyUser(event.detail)
  }
})

document.addEventListener('click', (event) => {
  if (event.target.closest('.flpwa-notification-close')) {
    dismiss(event.target.closest('.flpwa-notification-close'))
  }
})

function dismiss(elt) {
  elt.parentElement.remove()
}

export {APP, wb}
