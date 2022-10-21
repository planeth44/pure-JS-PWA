/*jshint esversion: 9 */
import _d from '../libs/query.js'
import {addRemoveFileBtns } from '../libs/fileRemover.js'
import {readableFileSize } from '../libs/readableFileSize.js'
import {dbPromise } from '../db.js'
import {APP} from '../app.js'

const fileModel = {
        uuid: null, // primaryKey
        parentUuid: '', // theModel uuid
        timestamp: Math.floor(new Date().getTime() / 1000),
        mime: '',
        name: '',
        blob: null,
        byteLength: 0,
        size: '',
        syncStatus: 'pending'
    },
    fileInput = _d.qs('input[name^=documents'),
    filesWrapper = _d.qs('[data-file-wrapper]'),
    eventHandlers = {
        removeFile: async function(evt) {
            const btn = evt.target,
                uuid = btn.dataset.fileUuid;

            btn.parentElement.remove()

            await deleteDocument(uuid)

            fileInput.disabled = false
        }
    };

navigator.serviceWorker.addEventListener('message', processFile); // incoming share target

document.addEventListener('DOMContentLoaded', displayAttachedFiles);

document.addEventListener('click', function (evt) {

    let handler = evt.target.getAttribute('data-click');

    if (!handler || !eventHandlers[handler]) {
        return;
    }

    eventHandlers[handler](evt);
});

fileInput.addEventListener('change', processFile, true)

filesWrapper.addEventListener('remove.files.display', (event) => {
    event.currentTarget.innerHTML = ''
})

async function displayAttachedFiles() {

    if (location.pathname.endsWith('edit')) return

    const parentUuid = location.pathname.split('/').pop()
    const files = await findFilesByModelUuid(parentUuid)

    Promise.allSettled(files.map(async (file) => {
        const div = document.createElement('div')
        div.classList.add('result-img')

        if (file.mime.startsWith('image/')) {
            const blob = new Blob([file.blob], {
                type: file.mime
            })
            await showImage(blob, file.uuid, div)
        } else {
            div.insertAdjacentHTML(
                'afterbegin', `
                        <p data-uuid="${file.uuid}">${file.name}</p> `
            )

            filesWrapper.insertAdjacentElement('beforeend', div)
        }

    })).then(() => addRemoveFileBtns())
}


async function processFile(event) {
    event.preventDefault()
    console.log(event)
    let fileList

    /*
        photos can come from file input or share target
         event.target => <input ... /> in case of file input / ServiceWorkerContainer in case of share target
     */
    if (event.target.files !== undefined) { // undefined in case of file input
        fileList = [...event.target.files]
    } else if (event.data.hasOwnProperty('photos')){
        fileList = [...event.data.photos]
    } else {
        return
    }

    fileInput.disabled = true

    Promise.allSettled(fileList.map(async file => {

        return displayFile(file).then(uuid => {
            return storeCurrentFile(file, uuid)
        }).then(uuid => {
            addRemoveFileBtns()
        })
    })).then(values => {
        values.forEach(value => {
            if ("rejected" == value.status) {
                console.log(value.reason)
                document.dispatchEvent(new CustomEvent('message', {
                    detail: {
                        type: 'user.notify',
                        text: value.reason.message
                    }
                }))
                event.target.disabled = false
            }
        })
    }).finally(() => {

        fileInput.disabled = false
    })
}

async function displayFile(file) {

    const
        div = document.createElement('div'),
        fileUuid = crypto.randomUUID();
    div.classList.add('result-img')

    if (file && file.type.match('image.*')) {
        return showImage(file, fileUuid, div)
    } else {
        /*
          Or We could filter out photos only
          throw new NotImageError(`Le fichier sélectionné ${file.name} n’est pas une image. Choisissez en un autre.`)
         */

        div.insertAdjacentHTML(
            'afterbegin', `
            <p data-uuid="${fileUuid}">${file.name}</p>
            `
        )
        filesWrapper.insertAdjacentElement('beforeend', div)

        return fileUuid
    }
}

function showImage(file, fileUuid, div) {
    const image = new Image()
    image.dataset.uuid = fileUuid
    div.appendChild(image)

    return readtheFile('readAsDataURL', file).then(result => {
        image.src = result
        filesWrapper.insertAdjacentElement('beforeend', div)

        return fileUuid
    })
}


async function storeCurrentFile(theFile, fileUuid) {

    const currentFile = Object.assign({}, fileModel, {
        parentUuid: APP.theModel.uuid,
        uuid: fileUuid, // primaryKey
        mime: theFile.type,
        name: theFile.name,
    })

    return readtheFile('readAsArrayBuffer', theFile).then(async arrayBuffer => {
        currentFile.blob = arrayBuffer
        currentFile.byteLength = arrayBuffer.byteLength
        currentFile.size = readableFileSize(arrayBuffer.byteLength)

        return await putToDocumentStore(currentFile) // will return fileUuid

    })
}

function readtheFile(method, object) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.addEventListener('loadend', (e) => {
            resolve(reader.result)
        });

        reader.addEventListener('error', reject);
        reader[method](object);
    })
}

class NotImageError extends Error {}

async function putToDocumentStore(currentFile) {
    const db = await dbPromise

    return await db.put('document', currentFile);
}
async function deleteDocument(uuid) {
    const db = await dbPromise

    return await db.delete('document', uuid);
}

async function findFilesByModelUuid(parentUuid) {
    const files = []

    const db = await dbPromise;
    const tx = db.transaction('document');
    const range = IDBKeyRange.only(parentUuid)

    let cursor = await tx.store.index('parentUuidIdx').openCursor(range);

    while (cursor) {
        files.push(cursor.value)
        cursor = await cursor.continue();
    }
    await tx.done

    return files
}
