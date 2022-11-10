/* jshint esversion: 8 */

import {dbPromise} from '../db.js'

const thingContainer = document.querySelector('[data-thing-container]')
const instanceUuid = location.pathname.split('/').pop()

/*
* TEMPLATES
*/

async function thingCardTmpl(t, docs) {
  return `
    <header>
      <h3>${t.title}</h3>
      <h5>${t.meta.date.toLocaleString()} at ${t.meta.place}</h5>
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
      <div class="files-wrapper">${docs}</div>
    <footer class="thing-card_footer">
      <a href="/edit/${t.uuid}" class="button">Edit</a>
    </footer> `
}

function consequenceTmpl(t) {
  return `
  <div>
   People were involved, during ${t.numbreHoursDowntime} hours<br>
    with ${t.computedValueFromNbrHours}€ consequence
  </div> `
}

/*
  CONTENT
 */
getTheModel(instanceUuid).then(async(instance) => {

  const docs = await addDocuments(instance.uuid)
  const content = await thingCardTmpl(instance, docs)

  thingContainer.insertAdjacentHTML('afterbegin', content)
})

async function addDocuments(uuid) {
  return getDocsFromModel(uuid).then((docs) => {
    if (docs.length > 0) {
        return docs.map(doc => {
            if (doc.mime.startsWith('image')
              && doc.hasOwnProperty('blob')) {
                return `<div class="result-img"> <img src="${makeImgUrl(doc)}" /></div> `
            } else {
              return `<p class="result-img">${doc.name || 'no name'}, ${doc.mime}</p>`
            }
        }).join('\n ')
    } else {
      return ''
    }

  })
}

/*
    UTILITIES
 */

function makeImgUrl(doc)
{
    const blob = new Blob([doc.blob], {type: doc.mime})
  // console.log(blob)
    const urlCreator = window.URL || window.webkitURL;
    return urlCreator.createObjectURL(blob);
}

/*
    DB OPERATIONS
 */

async function getTheModel(key) {

    const db = await dbPromise
    const instance = await db.get('theModel', key)

    return instance
}

async function getDocsFromModel(uuid){

    const db = await dbPromise;
    const tx = db.transaction('document');
    const range = IDBKeyRange.only(uuid)

    let cursor = await tx.store.index('parentUuidIdx').openCursor(range);
    let docs = []

    while (cursor) {
        docs.push(cursor.value)
        cursor = await cursor.continue();
    }
    await tx.done

    return docs
}
