/* jshint esversion: 8 */

import {dbPromise} from '../db.js'

const listContainer = document.querySelector('[data-list-container]')

/*
* Templates
 */
function thingCardTmpl(m, store) {
  return `<li class="card">
        <header>
          ${(m.name) ? `${m.name}` : `${m.title}`}<br>
          <span class="label -muted">from ${store}</span>
        </header>
        <section>
          ${m.htmlError}
        </section>
        <footer class="list-footer">
          ${(!m.blob) ? 
          `<a href="${ROUTES.EDIT}/${m.uuid}" class="button -link">Edit the thing</a>
          <a href="${ROUTES.SHOW}/${m.uuid}" class="button -link">Show the thing</a>`
            : ''}
        </footer>
      </li> `
}

Promise.allSettled([
  getAllFailedFromStore('theModel', 'syncIdx'),
  getAllFailedFromStore('document', 'syncIdx')
]).then((values) => {

  const cards = []

  values.forEach((value) => {

    if (value.status == 'fulfilled') {

      value.value.list.forEach(instance => {
        const card = thingCardTmpl(instance, value.value.store)
        cards.push(card)
      })
    }
  })

  listContainer.insertAdjacentHTML('beforeEnd', cards.join(''))
})


// getAllFailedThings('theModel').then((list) => {
//     console.log(list)
//   const cards = []
//   list.forEach((instance) => {
//     // const m = {}
//     // m.uuid = instance.uuid
//     // m.title = instance.title
//     // m.date = instance.meta.date.toLocaleString()
//     // m.syncStatus = instance.syncStatus
//     const card = thingCardTmpl(instance)
//     cards.push(card)
//   })
//   return cards
// }).then((cards) => {
//   getAllFailedThings('document').then((list) => {

//   })
// })


async function getAllFailedFromStore(store, syncIdx) {
  const db = await dbPromise
  const list = await db.getAllFromIndex(store, syncIdx, SYNC_STATUS.FAILED)

  if (list.length == 0) {
    throw new Error(list)
  }

  return {store: store, list:list}
}