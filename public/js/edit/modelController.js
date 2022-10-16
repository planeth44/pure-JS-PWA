/* jshint esversion: 8 */
import localISODateTime from '../libs/localISODateTime.js'
import updateControl from './updateFormControl.js'
import {getByPath, setByPath} from '../libs/objectByPath.js'
import changeHandlers from './changeHandlers.js'
import {dbPromise} from '../db.js'
import {APP} from '../app.js'

const theModel = {
        meta: {
            date: new Date(),
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
        addedAt: new Date(),
        updatedAt: null,
        syncStatus: 'pending',
        updatedTs: Math.floor(new Date().getTime() / 1000),
        uuid: APP.uuid
    },
    formEl = document.forms.editTheThingForm
;
let formControls = [],
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

formEl.addEventListener('submit', done)
formEl.addEventListener('change', updateObject)

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
        let type = element.type
        if (type.includes('-')) { // datetime-local | select-one | select-multiple
            type = type.split('-') 
            type[1] = `${type[1].charAt(0).toUpperCase()}${type[1].slice(1)}`
            type = type.join('')
        }
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

    let handler = event.target.getAttribute('data-change');

    if (handler && changeHandlers[handler]){
        changeHandlers[handler](event, theModel);
    }
    else {
        updateObjectFromControl(event)
    }

    await updateStore(event)
}

function updateObjectFromControl(event) {
    event.preventDefault()

    const formdata = new FormData(formEl)
    const path = event.target.name
    let value = null

    const expected = getByPath(theModel, path)

    if (Array.isArray(expected)) {
        value = formdata.getAll(path) // will always retuen an array

    } else if (expected instanceof Date) {
        // console.log(formdata.get(path))

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
    await updateStore(event)

    wb.messageSW({
        type: 'DO_SYNC'
    });

    location.href = `${location.origin }/show/${instanceUuid}`
}

async function updateStore(event) {
    event.preventDefault()

    /*
        @CONSEQUENCE
     Other experience of storing formadata directly failed:
     DataCloneError: Failed to execute 'put' on 'IDBObjectStore': FormData object could not be cloned
     */
    const now = new Date()
    theModel.updatedAt = now
    theModel.updatedTs = Math.floor(now.getTime() / 1000) 

    try {
        instanceId = await putToStore('theModel', theModel)

        if (!theModel.hasOwnProperty('id')) {
            theModel.id = instanceId
        }

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

