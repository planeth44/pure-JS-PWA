/*jshint esversion: 9 */
import _d from '../libs/query.js'
import {addRemoveFileBtns} from '../libs/fileRemover.js'
import{displayFile, storeCurrentFile} from '../libs/fileHelper.js'
import{APP} from '../app.js'

const fileInput = _d.qs('input[name^=documents'),
    filesWrapper = _d.qs('[data-file-wrapper]')
;


navigator.serviceWorker.addEventListener('message', processFile); // incoming share target
fileInput.addEventListener('change', processFile, true)

async function processFile(event)
{
     event.preventDefault()
   let fileList

    // photos can come from file input or share target
    //  event.target => <input ... /> in case of file input / ServiceWorkerContainer in case of share target
    if (undefined === event.data) { // undefined in case of file input
        fileList = [...event.target.files]
    } else {
        fileList = [...event.data.photos]
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
