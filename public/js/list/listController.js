/* jshint esversion: 8 */

import {dbPromise} from '../db.js'

const listContainer = document.querySelector('[data-list-container]')

/*
* Templates
 */
function thingCardTmpl(m) {
  return `<li class="card">
        <header>${m.title}</header>
        <section>
          Added the : <span>${m.date}</span>
        </section>
        <section class="list-card_status">
          <span class="label -status ${m.syncStatus}">${m.syncStatus}</span>
        </section>
        <footer class="list-footer">
          <a href="${ROUTES.EDIT}/${m.uuid}" class="button -link">Edit the thing</a>
          <a href="${ROUTES.SHOW}/${m.uuid}" class="button -link">Show the thing</a>
        </footer>
      </li> `
}

getAllThings().then((list) => {
    console.log(list)
  const cards = []
  list.forEach((instance) => {
    const m = {}
    m.uuid = instance.uuid
    m.title = instance.title
    m.date = instance.meta.date.toLocaleString()
    m.syncStatus = instance.syncStatus
    const card = thingCardTmpl(m)
    cards.push(card)
  })
  listContainer.insertAdjacentHTML('afterbegin', cards.join(''))
})


async function getAllThings() {
    const db = await dbPromise
    const list = await db.getAll('theModel')
    return list
}
