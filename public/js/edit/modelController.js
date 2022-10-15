/* jshint esversion: 8 */
import {getByPath, setByPath} from '../libs/objectByPath.js'
import localISODateTime from '../libs/localISODateTime.js'
import updateControl from './updateFormControl.js'
import changeHandlers from './changeHandlers.js'
import {dbPromise} from '../db.js'

const theModel = {
        thingMeta: {
            date: new Date(),
            place: ''
        },
        title: '',
        description: '',
        category: {
            cat1: '',
            cat2: '',
            cat3: '',
            cat4: '',
        },
        peopleInvolved: false,
        numbreHoursDowntime: 0,
        computedValueFromNbrHours: 0,
        addedAt: new Date(),
        updatedAt: null
    },
    formEl = document.forms.editTheThingForm;
let instanceId = null,
    formControls = [];

/*
 * Event listeners
 */

document.addEventListener('DOMContentLoaded', updateControlsFromModel);

formEl.addEventListener('submit', updateStore)
formEl.addEventListener('change', updateObject)

/*
 * Functions
 */
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

    let handler = event.target.getAttribute('data-change');

    if (handler && changeHandlers[handler]){
        changeHandlers[handler](e, theModel);
    }
    else {
        updateObjectFromControl(event)
    }

    await updateStore(event)
}

function updateObjectFromControl(event) {
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

async function updateStore(event) {
    event.preventDefault()

    /*
    @CONSEQUENCE
    Dropping formData to update theModel :
    there is no way without jumping through hoops 
    to know if a value for a key should be an array or a string
    You get either an array for any key when calling formData.getAll(key)
    or a succession of string when calling formData.get(key)
    when cycling through formdata.entries()


        const formdata = new FormData(formEl)

        for(const [key, value] of formdata.entries()){
            console.log(key, value)
        }
        const formObj = formDataToObject(formdata)

        Object.assign(theModel, formObj.data)
    */

    /*
        @CONSEQUENCE
     Other experience of storing formadata directly failed:
     DataCloneError: Failed to execute 'put' on 'IDBObjectStore': FormData object could not be cloned
     */

    theModel.updatedAt = new Date()

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

