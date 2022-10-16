/* jshint esversion: 8 */

import {dbPromise} from '../db.js'

const thingContainer = document.querySelector('[data-thing-container]')
const instanceId = Number(location.pathname.split('/').pop())

/*
* Templates
 */
function thingCardTmpl(t) {
  return `
    <header>
      <h3>${t.title}</h3>
      <h4>${t.meta.date.toLocaleString()} at ${t.meta.place}</h4>
    </header>
      <div class="thing-description">
        ${t.description}
      </div>
      <div>
        <span class="label warning">${t.category}</span>
        ${t['multiChoice[]']
          .map((choice) => `<span class="label">${choice}</span>`)
          .join('\n ')}
      </div>
      ${(t.peopleInvolved) ? `${consequenceTmpl(t)}` : ''}
    <footer class="thing-card_footer">
      <a href="/edit/${t.id}" class="button">Edit</a>
      <span class="label thing-status muted">${t.syncStatus} sync</span>
    </footer> `
}
function consequenceTmpl(t) {
  return `
  <div>
   People were involved, during ${t.numbreHoursDowntime} hours<br>
    with ${t.computedValueFromNbrHours}€ consequence
  </div> `
}

getFromStore('theModel', instanceId).then((instance) => {

  const content = thingCardTmpl(instance)

  thingContainer.insertAdjacentHTML('afterbegin', content)
})

async function getFromStore(store, key) {

    const db = await dbPromise
    const thing = await db.get(store, key)

    return thing
}
