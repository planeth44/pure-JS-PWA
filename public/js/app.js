/*jshint esversion: 8 */
import notifyUser from '../js/libs/user-notification.js'


// <!-- register your service Worker -->
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => {
        // registration worked
        console.log('Registration succeeded.');
      }).catch((error) => {
        // registration failed
        console.log('Registration failed with ' + error);
      });
  });
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