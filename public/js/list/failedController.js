/* jshint esversion: 8 */

import {dbPromise} from '../db.js'

const listContainer = document.querySelector('[data-list-container]')

/*
* TEMPLATES
 */
function thingCardTmpl(m, store) {
  return `<li class="card">
        <header>
          ${(m.name) ? `${m.name}` : `${m.title}`}<br>
          <span class="label -muted">from ${store}</span>
          ${(m.parentUuid) ? `
            <a href="${ROUTES.SHOW}/${m.parentUuid}" class="button -link">Show parent Thing</a>` : ''}
        </header>
        <section>
          <pre>
            ${m.htmlError}
          </pre>
        </section>
        <footer class="list-footer">
          ${(!m.blob) ? 
          `<a href="${ROUTES.EDIT}/${m.uuid}" class="button -link">Edit the thing</a>
          <a href="${ROUTES.SHOW}/${m.uuid}" class="button -link">Show the thing</a>`
            : ''}
        </footer>
      </li> `
}

/*
  CONTENT
 */

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

/*
    DB OPERATIONS
 */

async function getAllFailedFromStore(store, syncIdx) {
  const db = await dbPromise
  const list = await db.getAllFromIndex(store, syncIdx, SYNC_STATUS.FAILED)

  if (list.length == 0) {
    throw new Error(list)
  }

  return {store: store, list:list}
}
