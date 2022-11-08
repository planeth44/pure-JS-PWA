/*jshint esversion: 8 */
self.importScripts('js/vendor/idb/umd.js');

let _db;

const dbPromise = (async() => {
    if (_db) {
        return Promise.resolve(_db);
    }

    const db = await idb.openDB('pure-js-pwa')

    _db = db;
    return db;
})();

async function getAllPendingModels() {
  const db = await dbPromise
  return await db.getAllFromIndex('theModel', 'syncIdx', 'pending')
}

async function getPendingFile() {
  const db = await dbPromise;
  return await db.getFromIndex('document', 'syncIdx', 'pending')
}

async function getFailedFile() {
  const db = await dbPromise;
  return await db.getFromIndex('document', 'syncIdx', 'failed')
}

async function deleteFromStore(store, key) {
  const db = await dbPromise;
  return await db.delete(store, key)
}

async function updateObjectStatus(store, key, status, htmlError=null)
{
    const db = await dbPromise;
    const range  = IDBKeyRange.only(key)
    const cursor = await db
        .transaction(store, 'readwrite')
        .store
        .openCursor(range);

    const object  = cursor.value
    object.syncStatus = status

    if(htmlError){
        object.htmlError = htmlError
    }

    await cursor.update(object) // otherwise iOS may finish the transaction
    return 
}

async function putToStore(store, record, key=null)
{
    const db = await dbPromise
    const args = [store, record]
    if (key) args.push(key)
    return await db.put(...args);
}
