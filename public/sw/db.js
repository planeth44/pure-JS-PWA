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

async function getAllNotes() {
  const db = await dbPromise;
  return await db.getAll('post')
}

async function getPendingPhoto() {
  const db = await dbPromise;
  return await db.getFromIndex('photo', 'photoStatus', 'transmission_pending')
}

async function getFailedPhoto() {
  const db = await dbPromise;
  return await db.getFromIndex('photo', 'photoStatus', 'transmission_failed')
}

async function deleteFromStore(store, key) {
  const db = await dbPromise;
  return await db.delete(store, key)
}

async function updateObjectStatus(store, key, status, error=null)
{
    const db = await dbPromise;
console.log(key)
    const range  = IDBKeyRange.only(key)
    const cursor = await db
        .transaction(store, 'readwrite')
        .store
        .openCursor(range);

    const object  = cursor.value
    object.syncStatus = status
console.log(object)
    if(error){
        object.error = error
    }

    return await cursor.update(object) // otherwise iOS may finish the transaction
}

async function putToStore(store, record, key=null)
{
    const db = await dbPromise
    const args = [store, record]
    if (key) args.push(key)
    return await db.put(...args);
}

async function getAllPendingModels() {
  const db = await dbPromise
  return await db.getAllFromIndex('theModel', 'syncIdx', 'pending')
}


