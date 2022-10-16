/* jshint esversion: 8 */
import {openDB } from '../../js/vendor/idb/index.js';

let _db;
const DB_VERSION = 3;
console.log('APP.DB_VERSION : ', DB_VERSION)

// _db will cache an open IndexedDB connection.
export const dbPromise = (async () => {
    if (_db) {
        return Promise.resolve(_db);
    }

    const db = await openDB('pure-js-pwa', DB_VERSION, {
        // https://developers.google.com/web/ilt/pwa/working-with-indexeddb#defining_indexes
        async upgrade(db, oldVersion, newVersion, transaction) {
            console.log('oldVersion', oldVersion)
            console.log("upgraded. New version", newVersion)

            const v1Db = db
            console.log(v1Db.objectStoreNames)
            if (!v1Db.objectStoreNames.contains('theModel')) {
                const theModel = v1Db.createObjectStore('theModel', {
                    keyPath: 'id',
                    autoIncrement: true,
                })
                theModel.createIndex('objectAddedAt', 'addedAt')
            }
            if (!v1Db.objectStoreNames.contains('document')) {
                const documentStore = v1Db.createObjectStore('document', {
                    keyPath: 'uuid',
                    unique: true,
                })
                documentStore.createIndex('statuIdx', 'syncStatus')
            } else{
                const documentStore = transaction.objectStore('document')
                if(!documentStore.indexNames.contains('parentUuidIdx')){
                    documentStore.createIndex('parentUuidIdx', 'parentUuid')
                }

            }
            if (v1Db.objectStoreNames.contains('theModel')) {
                const theModelStore = transaction.objectStore('theModel')
                if(!theModelStore.indexNames.contains('updateTsIdx')){
                    theModelStore.createIndex('statuIdx', 'syncStatus')
                }
                if(!theModelStore.indexNames.contains('uuidIdx')){
                    theModelStore.createIndex('uuidIdx', 'uuid')
                }
                if(!theModelStore.indexNames.contains('updateTsIdx')){
                    theModelStore.createIndex('updateTsIdx', 'updatedTs')
                }
            }

        },
        blocked(event) {
            console.error('blocked', event);
            console.log('Your database version can’t be upgraded because the app is open somewhere else');
        },
        blocking(event) {
            console.error('blocking', event)
            event.target.close()
        }
    })
    _db = db;
    return db;
})();