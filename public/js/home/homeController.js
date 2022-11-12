/* jshint esversion: 8 */
import {dbPromise } from '../db.js'
import {registerSyncEvent } from '../app.js'

const modelsContainer = document.querySelector('[data-models-container]'),
  eventHandlers = {
    sync: function(event) {
      event.target.innerHTML= 'Syncing in progress.<br>You can go on with your life'
      registerSyncEvent('sync-data', 'transmitText')
    }
  }

/*
 * Event listeners
 */

modelsContainer.addEventListener('click', (event) => {
  let handler = event.target.getAttribute('data-click');

  if (!handler || !eventHandlers[handler]) {
    return;
  }

  eventHandlers[handler](event);
})

document.addEventListener('message', async (event) => {
  const message = event.detail

  if (message.type === 'home.update' && message.event == 'sync.ended') {

    modelsContainer.innerHTML = `
      <p class="user-notification ${message.class}">
      ${message.text}
      </p>`
  }

  if (message.sync == 'to complete'){
    content().then((shouldSync) => {
      if(!shouldSync){
        document.querySelector('.user-notification').innerText = 'Sync completed'
      }
    })
  }
})

content()

/*
 * CONTENT
 */

async function content() {
  return Promise.allSettled([
    getAllPendingFromStore('theModel', 'syncIdx'),
    getAllPendingFromStore('document', 'syncIdx'),
    getAllFailedFromStore('theModel', 'syncIdx'),
    getAllFailedFromStore('document', 'syncIdx')
  ]).then((values) => {

    let shouldSync = false
    let hasFailed = false

    values.forEach((value) => {
      if (value.status == 'fulfilled') {

        if(value.value.includes('failed')){
          hasFailed = true
        }

        modelsContainer.insertAdjacentHTML('afterbegin', `<p>${value.value}</p>`)
        shouldSync = true
      }

    })
    if (shouldSync) {
      modelsContainer.insertAdjacentHTML('beforeend', `
        <button data-click="sync">Sync</button>`)
    }
    if (hasFailed){
      modelsContainer.insertAdjacentHTML('beforeend', `
        <a class="button -link" href="${ROUTES.FAILED}">See failed</a>`)
    }

    return shouldSync
  })
}

/*
    DB OPERATIONS
 */

async function getAllPendingFromStore(store, syncIdx) {
  const db = await dbPromise
  const statusRange = IDBKeyRange.bound(SYNC_STATUS.PENDING, SYNC_STATUS.UPDATE)
  const count = await db.countFromIndex(store, syncIdx, statusRange)

  if (count == 0) {
    throw new Error(count)
  }

  return `${count} object pending from ${store}`
}

async function getAllFailedFromStore(store, syncIdx) {
  const db = await dbPromise
  const count = await db.countFromIndex(store, syncIdx, SYNC_STATUS.FAILED)

  if (count == 0) {
    throw new Error(count)
  }

  return `${count} object failed from ${store}`
}