/*jshint esversion: 9 */
import _d from './query.js'
import {dbPromise} from '../db.js'
// import {putToStore, deleteFromStore} from './db.js'

const fileInput = _d.qs('input[name^=documents')

const eventHandlers = {
    removeFile: async function (evt) {
        const btn = evt.target,
            uuid = btn.dataset.fileUuid;

        btn.parentElement.remove()

        await deleteDocument(uuid)

        fileInput.disabled = false
    }
};

document.addEventListener('click', function (evt) {

    let handler = evt.target.getAttribute('data-click');

    if (!handler || !eventHandlers[handler]) {
        return;
    }

    eventHandlers[handler](evt);

});

function removePhotoBtnTmpl(uuid)
{
    const removeButton = document.createElement('button')
    removeButton.type = 'button'
    removeButton.dataset.click = 'removeFile'
    removeButton.dataset.fileUuid = uuid
    removeButton.insertAdjacentHTML('beforeend',`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-trash svg-icon-dark" pointer-events="none"><path class="primary" d="M5 5h14l-.89 15.12a2 2 0 0 1-2 1.88H7.9a2 2 0 0 1-2-1.88L5 5zm5 5a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-1-1zm4 0a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v-6a1 1 0 0 0-1-1z"></path><path class="secondary" d="M8.59 4l1.7-1.7A1 1 0 0 1 11 2h2a1 1 0 0 1 .7.3L15.42 4H19a1 1 0 0 1 0 2H5a1 1 0 1 1 0-2h3.59z"></path></svg>
        `)
    return removeButton
}

function addRemoveFileBtns()
{
    _d.qsa('.result-img').forEach(fileResult => {
        if (fileResult.querySelector('button') !== null) {
            return
        }

        const fileUuid = fileResult.children[0].dataset.uuid
        fileResult.appendChild(removePhotoBtnTmpl(fileUuid))
    })
}

async function deleteDocument(uuid) {
    const db = await dbPromise

    return await db.delete('document', uuid);
}

export {addRemoveFileBtns}
