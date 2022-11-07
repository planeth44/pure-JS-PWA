/* jshint esversion: 8 */
import {dbPromise } from '../db.js'
import {registerSyncEvent } from '../app.js'

const modelsContainer = document.querySelector('[data-models-container]'),
  eventHandlers = {
    sync: function(event) {
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

/*
 * Functions
 */

Promise.allSettled([
  getAllPendingFromStore('theModel', 'syncIdx'),
  getAllPendingFromStore('document', 'syncIdx')
]).then((values) => {

  let shouldSync = false

  values.forEach((value) => {
    if (value.status == 'fulfilled') {
      modelsContainer.insertAdjacentHTML('afterbegin', `<p>${value.value}</p>`)
      shouldSync = true
    }
  })
  if (shouldSync) {
    modelsContainer.insertAdjacentHTML('beforeend', `
      <button data-click="sync">Sync</button>`)
  }
})


async function getAllPendingFromStore(store, syncIdx) {
  const db = await dbPromise
  const statusRange = IDBKeyRange.bound(SYNC_STATUS.PENDING, SYNC_STATUS.UPDATE)
  const count = await db.countFromIndex(store, syncIdx, statusRange)

  if (count == 0) {
    throw new Error(count)
  }

  return `${count} object pending from ${store}`
}