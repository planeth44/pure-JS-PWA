/*jshint esversion: 8 */
// "use strict";

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

const renderHandlers = {
  thingsList: function() {
    return Promise.all([
        precaching.matchPrecache('/header').then((response) => {
          return response.text()
        }),
        new Promise((resolve) => setTimeout(() => resolve(buildThingsList()), 0)),
        precaching.matchPrecache('/footer').then((response) => {
          return response.text()
        })
      ])
      .then((responses) => {
        const response =  new Response(responses.join(''), {
          headers: {
            'Content-Type': 'text/html'
          }
        });
        caches.open('lists').then((cache) => {
          cache.put('/list', response)
        })
      })
  }
}

async function buildThingsList() {

  return getAllThings().then((list) => {
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
    return`
      <h3>List the things</h3>
      <ol class="list-container" data-list-container>
        ${cards.join("\n")}
      </ol>`
    })
}


/*
    DB OPERATIONS
 */

async function getAllThings() {
    const db = await dbPromise
    const list = await db.getAll('theModel')
    return list
}
