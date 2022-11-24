/*jshint esversion: 8 */
// "use strict";

/*
* Templates
 */
function thingCardTmpl(m) {
  return `<li class="card">
        <header>${m.title}</header>
        <section>
          Added the : <span>${m.localDate}</span>
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

function listTmpl(cards) {
  return`
    <h3>List the things</h3>
    <ol class="list-container" data-list-container>
      ${cards}
    </ol>`
}

const renderHandlers = {
  thingsList: function() {
    return Promise.all([
        precaching.matchPrecache('/header').then((response) => {
          return response.text()
        }),
        getAllThings().then((list) => {
          const cards = list.reduce((cards, instance) => {
            instance.localDate = instance.meta.date.toLocaleString()
            return `${cards} ${thingCardTmpl(instance)}`
          }, '')

          return listTmpl(cards)
        }),
        precaching.matchPrecache('/footer').then((response) => {
          return response.text()
        })
      ])
      .then((responses) => {
        const response = new Response(responses.join(''), {
          headers: {
            'Content-Type': 'text/html'
          }
        });
        caches.open('lists').then((cache) => {
          cache.put('/list', response)
        })
      })
  },
  noThings: function() {
      return Promise.all([
        precaching.matchPrecache('/header').then((response) => {
          return response.text()
        }),
        new Promise((resolve) => {
          setTimeout(() => resolve(
            listTmpl('<li>No Thing added yet 🙄️</li>')), 0)
        }),
        precaching.matchPrecache('/footer').then((response) => {
          return response.text()
        })
      ])
      .then((responses) => {
        return new Response(responses.join(''), {
          headers: {
            'Content-Type': 'text/html'
          }
        });
      })
    }
}

/*
    DB OPERATIONS
 */

async function getAllThings() {
    const db = await dbPromise
    const list = await db.getAll('theModel')
    return list
}
