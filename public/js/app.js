/*jshint esversion: 8 */
import {Workbox} from './vendor/workbox-v6.5.1/workbox-window.prod.mjs';
import notifyUser from '../js/libs/user-notification.js'
import {getKey} from './db.js'

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

/*
  Registering service worker
 */
if ('serviceWorker' in navigator) {

  wb = new Workbox('/sw.js', {
    scope: '/'
  });
  wb.register();
}

/*
 * Event listeners
 */

navigator.serviceWorker.addEventListener("controllerchange", (evt) => {
  console.log("controller changed");
  // this.controller = navigator.serviceWorker.controller;
})

navigator.serviceWorker.addEventListener('message', (event) => {
  const message = event.data

  setMessageType(message)

  if (message.type === 'user.notify') {

    notifyUser(message)

  } else if (message.type === 'home.update') {

    document.dispatchEvent(new CustomEvent('message', {
      detail: message
    }))
  }
})

document.addEventListener('message', (event) => {
  if (event.detail.type === 'user.notify') {
    notifyUser(event.detail)
  }
})

/*
 Functions
 */

function registerSyncEvent(tag, backupSwMsg) {
  navigator.serviceWorker.getRegistration().then(async registration => {

    if ('sync' in registration) {

      try {

        const uts = Math.floor(new Date().getTime() / 1000)

        await registration.sync.register(`${tag}:${uts}`)

        /*
          Using navigator.onLine in this case
          Background-sync event will not fire if offline
          Let the user know what’s happening.

          If using isOnline helper (checking if server is reachable)
          background-sync event will be dispatched & will fail
          and no retry will be attempted
         */
        if (!navigator.onLine && tag.includes('sync-data')) {
          notifyUser({
            text: `
            We’re offline, sailor ⛵<br>
            Sync will be taken care of <br>
            when we get back online`,
            class: 'info'
          })
        }
      } catch (syncError) {

        wb.messageSW({
          type: backupSwMsg
        });
      }
    } else {

      // iOS| Firefox case
      wb.messageSW({
        type: backupSwMsg
      });
    }
  })

}

async function shouldSync(){

  const lastSyncTimestamp = await getKey('lastSyncTimestamp')
  const needSync = await getKey('needSync')

  if (now() - lastSyncTimestamp > 5 * 60 && needSync) {
    registerSyncEvent('sync-data', 'transmitText')
  }   
}

function setMessageType(message) {

  if (message.type) return

  // no type set, message could be shown as notification or replace some content in home page 
  if (location.pathname == '/') { 

    message.type = 'home.update'

  } else {

    message.type = 'user.notify'
  }
}

export {APP, wb, registerSyncEvent}
