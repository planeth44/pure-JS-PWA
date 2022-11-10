/* jshint esversion: 8 */
import localISODateTime from '../libs/localISODateTime.js'
import updateControl from './formControlUpdater.js'
import {getByPath, setByPath} from '../libs/objectByPath.js'
import changeHandlers from './changeHandlers.js'
import {dbPromise} from '../db.js'
import {APP, wb, registerSyncEvent} from '../app.js'

const now = new Date()

const theModel = {
        meta: {
            date: now,
            place: ''
        },
        title: '',
        description: '',
        category: '',
        'multiChoice[]': [],
        peopleInvolved: false,
        numbreHoursDowntime: 0,
        computedValueFromNbrHours: 0,
        documents: [],
        addedAt: now,
        updatedAt: null,
        syncStatus: SYNC_STATUS.PENDING , //@TODO should be 'empty'
        updatedTs: Math.floor(now.getTime() / 1000),
        uuid: APP.uuid,
        version: 0 
    },
    formEl = document.forms.editTheThingForm,
    confirmResetForm = document.getElementById('confirmReset'),
    formErrors = document.querySelector('[data-form-errors]')
;
let formControls = [],
formControlsErrors = new Map(),
instanceUuid =  null,
create = true
;
if(!location.pathname.endsWith('edit')){
    instanceUuid = location.pathname.split('/').pop()
    create = false
}


/*
 * Event listeners
 */

document.addEventListener('DOMContentLoaded', init);

formEl.addEventListener('change', updateObject)
formEl.addEventListener('submit', done)
formEl.addEventListener('reset', removeModel)

/*
 * Functions
 */

async function init(){
    if (!create){
        const instance = await getFromStore('theModel', instanceUuid)
        Object.assign(theModel, instance)
        Object.assign(APP, {
            theModel: {
                uuid: instance.uuid
            }
        })
    } else {
        // case of adding document at the same time as creating the Thing 

        instanceUuid = APP.uuid
        
        Object.assign(APP, {
            theModel: {
                uuid: APP.uuid
            }
        })
    }
    updateControlsFromModel()
}

function updateControlsFromModel() {

    /*
    console.log(...formdata.keys())
    textOnlyWithValue textOnlyWithoutValue textareaWithValue textareaWithoutValue multipleCheckBoxesCheckedAndNotChecked[value1] multipleCheckBoxesCheckedAndNotChecked[value3] radioCheckedAndNotChecked slectSimple selectMultiple selectMultiple
    
    @CONSEQUENCE : not using formdata.keys()
     - Multiple select shows up multiple times
     - checkBox will not show if not checked
     */

    // makes sense to use name attribute since it’s mapping to theModel 
    formControls = formEl.querySelectorAll('[name]')
    formControls.forEach(element => {

        const type = camelCaseFormat(element.type)

        try {
            updateControl[type](element, theModel)
        } catch (e) {
            // no updateControl defined for this type
            // defaulting to text
            updateControl['text'](element, theModel)
        }
    })
}

async function updateObject(event) {

    if (event.target.name == 'documents') {
        return // change event has bubbled upthere. Do nothing, handled in fileController.js
    }

    resetErrorSpan(event.target)

    let handler = event.target.getAttribute('data-change');

    if (handler && changeHandlers[handler]){
        changeHandlers[handler](event, theModel);
    }
    else {
        updateObjectFromControl(event)
    }

    if(!create && theModel.syncStatus == SYNC_STATUS.DONE){ // we’re updating a Thing which is already synced
        theModel.syncStatus = SYNC_STATUS.UPDATE
    }

    await updateStore()
}

function updateObjectFromControl(event) {

    /*
    @CONSEQUENCE
    Dropping formData to update theModel :
    there is no way without jumping through hoops 
    to know if a value for a key should be an array or a string
    You get either an array for any key when calling formData.getAll(key)
    or a succession of string when calling formData.get(key)
    when cycling through formdata.entries()

    See https://jakearchibald.com/2021/encoding-data-for-post-requests/#bonus-round-converting-formdata-to-json

    const data = Object.fromEntries(
      // Get a de-duped set of keys
      [...new Set(formData.keys())].map((key) =>
        key.endsWith('[]')
          ? // Remove [] from the end and get an array of values
            [key.slice(0, -2), formData.getAll(key)]
          : // Use the key as-is and get a single value
            [key, formData.get(key)],
      ),
    );
    */
    const formdata = new FormData(formEl)
    const path = event.target.name
    let value = null

    const expected = getByPath(theModel, path)

    if (Array.isArray(expected)) {
        value = formdata.getAll(path) // will always retuen an array

    } else if (expected instanceof Date) {

        let date = formdata.get(path)
        date = new Date(date).getTime() / 1000
        date = localISODateTime(date)

        value = date

    } else {
        value = formdata.get(path)
    }

    setByPath(theModel, path, value)
    console.log(theModel)
}

async function done(event) {

    event.preventDefault()

    const isValid = validateFields()

    /* @TO CONSIDER
    We mark the data as invalid to prevent sync w/ incorrect data
    Though, you could consider to sync anyway
    and let the app server side decide what to do (sensible default value where needed)
     */
    if (!isValid) {
        theModel.syncStatus = SYNC_STATUS.INVALID_DATA
    } else {
        theModel.syncStatus = SYNC_STATUS.PENDING
    }

    await updateStore()

    if (!isValid) {
        formErrors.innerHTML = ''
        formErrors.insertAdjacentHTML(
            'afterBegin', `
            Some data is missing or is incorrect
            ${Array.from(formControlsErrors.entries()).map(entry => `<li>${entry[0]}: ${entry[1]}`).join('')} `
        )

        window.scrollTo(0, 0)

        return // not transmitting
    }

    registerSyncEvent('sync-data', 'transmitText')

    document.dispatchEvent(new CustomEvent('message', {
        detail: {
            type: 'user.notify',
            text: `Thing stored and ready to sync<br>
            <a href="${location.origin }/show/${instanceUuid}">Go to page</a>`,
            class: 'info'
        }
    }))

}

function removeModel(event) {

    /*
        By default the form will reset
        As we’re using a confirm dialog, we can’t event.preventDefault
        because a call to formEl.reset() in the case of confirm
        will not work
     */

    confirmResetForm.showModal()

    confirmResetForm.addEventListener('close', async (event) => {

        if (confirmResetForm.returnValue == 'yes') {

            // formEl.reset() wont’t work (will prevent dialog to close)

            const modelUuid = theModel.uuid

            const db = await dbPromise

            const docUuids = await db.getAllKeysFromIndex('document', 'parentUuidIdx', modelUuid)

            Promise.allSettled(docUuids.map(async (fileUuid) => {
                await db.delete('document', fileUuid)
            }))
            await db.delete('theModel', modelUuid);

            document
                .querySelector('[data-file-wrapper]')
                .dispatchEvent(
                    new Event('remove.files.display'))
        } else {
            /*
            Since we've just reset the form, we need to revert ^^
             */
            updateControlsFromModel()
        }
    }, {once: true })

}

function camelCaseFormat(type) {
    if (type.includes('-')) { // datetime-local | select-one | select-multiple
        type = type.split('-') 
        type[1] = `${type[1].charAt(0).toUpperCase()}${type[1].slice(1)}`
        type = type.join('')
    }

    return type
}
function validateFields() {

    let isValid = true

    formControlsErrors.clear()

    formControls.forEach(element => {

        const errorSpan = findErrorSpan(element)

        if (!element.checkValidity()) {

            isValid = false

            errorSpan.textContent = element.validationMessage
            errorSpan.classList.add('active')

            const labelText = findLabelText(element)

            formControlsErrors.set(labelText.innerText, element.validationMessage)


        } else if (errorSpan) {
            errorSpan.textContent = ''
            errorSpan.classList.remove('active')
        }
    })

    return isValid
}

function findErrorSpan(element) {
    let errorSpan = element.nextElementSibling

    if (errorSpan && !errorSpan.classList.contains('error')) {
        errorSpan = element.parentElement.parentElement.querySelector('legend+.error')
    }
    return errorSpan
}

function findLabelText(element) {
    let labelText = element.closest('label').querySelector('.label-text')
    if (!labelText) {
        labelText = element.parentElement.parentElement.querySelector('legend.label-text')
    }
    return labelText
}

function resetErrorSpan(element) {
    const errorSpan = findErrorSpan(element)

    if(errorSpan){
        errorSpan.textContent = ''
        errorSpan.classList.remove('active')
    }
}

async function updateStore() {
    /*
        @CONSEQUENCE
         Other experience of storing formadata directly failed:
         DataCloneError: Failed to execute 'put' on 'IDBObjectStore': 
         FormData object could not be cloned
     */

    const now = new Date()
    theModel.updatedAt = now
    theModel.updatedTs = Math.floor(now.getTime() / 1000) 

    try {
        await putToStore('theModel', theModel)

    } catch (err) {
        console.log(err)
        throw new Error(err) // rethrowing to be caught at higher level
    }
}

async function putToStore(store, instance) {

    const db = await dbPromise

    return await db.put(store, instance);
}

async function getFromStore(store, key) {

    const db = await dbPromise
    const thing = await db.get(store, key)

    return thing
}

