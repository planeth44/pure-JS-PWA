/* jshint esversion: 8 */

import {dbPromise} from '../db.js'

const listContainer = document.querySelector('[data-list-container]')

/*
* Templates
 */
function thingCardTmpl(m) {
  return `<li class="card">
        <header>${m.title}</header>
        <div>
          Added the : <span>${m.date}</span>
        </div>
        <footer>
          <a href="/edit/${m.uuid}" class="button">Edit the thing</a>
          <a href="/show/${m.uuid}" class="button">Show the thing</a>
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
