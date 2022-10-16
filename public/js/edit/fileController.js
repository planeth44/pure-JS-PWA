/*jshint esversion: 9 */
import _d from '../libs/query.js'
import {addRemoveFileBtns } from '../libs/fileRemover.js'
import {readableFileSize } from '../libs/readableFileSize.js'
import {dbPromise } from '../db.js'
import {APP} from '../app.js'

const fileInput = _d.qs('input[name^=documents'),
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

document.addEventListener('click', function (evt) {

    let handler = evt.target.getAttribute('data-click');

    if (!handler || !eventHandlers[handler]) {
        return;
    }

    eventHandlers[handler](evt);
});

fileInput.addEventListener('change', processFile, true)

async function processFile(event) {
    event.preventDefault()
    let fileList

    /*
        photos can come from file input or share target
         event.target => <input ... /> in case of file input / ServiceWorkerContainer in case of share target
     */
    if (event.data.hasOwnProperty('photos')) { // undefined in case of file input
        fileList = [...event.data.photos]
    } else if (event.target.files !== undefined){
        fileList = [...event.target.files]
    } else {
        return
    }

    fileInput.disabled = true

    Promise.allSettled(fileList.map(async file => {

        return displayFile(file, filesWrapper).then(uuid => {
            return storeCurrentFile(file, uuid, APP.theModel.uuid)
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

async function displayFile(file, filesWrapper) {

    const
        div = document.createElement('div'),
        fileUuid = crypto.randomUUID();
    div.classList.add('result-img')

    if (file && file.type.match('image.*')) {
        const image = new Image()
        image.dataset.uuid = fileUuid
        div.appendChild(image)

        return readtheFile('readAsDataURL', file).then(result => {
            image.src = result
            filesWrapper.insertAdjacentElement('beforeend', div)

            return fileUuid
        })

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

async function storeCurrentFile(theFile, fileUuid, parentUuid) {
    const currentFile = {
        uuid: fileUuid, // primaryKey
        parentUuid: parentUuid, // theModel uuid
        timestamp: Math.floor(new Date().getTime() / 1000),
        mime: theFile.type,
        name: theFile.name,
        syncStatus: 'pending'
    }

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

