/*jshint esversion: 8 */
// "use strict";

/*
* Templates
 */
function thingCardTmpl(m) {
  return `<li class="card">
        <header>${m.title}</header>
        <section>
          Added the : <span>${m.meta.date.toLocaleString()}</span>
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

function listTmpl(list) {
  return`
    <h3>List the things</h3>
    <ol class="list-container" data-list-container>
      ${list.map((instance) => `${thingCardTmpl(instance)}`)}
    </ol>`
}

const renderHandlers = {
  thingsList: function() {
    return Promise.all([
        precaching.matchPrecache('/header').then((response) => {
          return response.text()
        }),
        getAllThings().then((list) => {
          if (list.length == 0) {
            list[0] = 'No Thing added yet 🙄️'
          }
          return listTmpl(list)
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
        return caches.open('lists').then((cache) => {
          return cache.put('/list', response)
        })
      })
  },
  noThings: function() {
    return renderHandlers.thingsList().then(() => {
      return caches.open('lists')
      .then((cache) => cache.match('/list'))
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
