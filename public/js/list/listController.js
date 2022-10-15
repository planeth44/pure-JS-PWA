/* jshint esversion: 8 */

import {dbPromise} from '../db.js'

const listContainer = document.querySelector('[data-list-container]')

/*
* Templates
 */
function thingCardTmpl(thing) {
  return `<li class="card">
        <header>${thing.title}</header>
        <div>
          Added the : <span>${thing.date}</span>
        </div>
        <footer>
          <a href="/edit/${thing.id}" class="button">Edit the thing</a>
          <a href="/show/${thing.id}" class="button">Show the thing</a>
        </footer>
      </li> `
}

getAllThings().then((list) => {
    console.log(list)
  const cards = []
  list.forEach((thing) => {
    const m = {}
    m.id = thing.id
    m.title = thing.title
    m.date = thing.meta.date.toLocaleString()
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
