/* jshint esversion: 8 */
import {getByPath} from '../libs/objectByPath.js'
import localISODateTime from '../libs/localISODateTime.js'

const updateControl = {
  textarea: function setTextarea(element, model) {
    // console.log(element)
    element.value = getByPath(model, element.name)
  },
  selectOne: function setSelectOne(element, model) {
    // console.log(element)
    let options = element.options
    for ( let opt of options) {
        if (opt.value == getByPath(model, element.name)) {
            opt.selected = true
        }
    }
  },
  selectMultiple: function setSelectMultiple(element, model) {
    // console.log(element)
    const options = element.options
    const values = getByPath(model, element.name)
    
    for ( let opt of options) {
        if (values.includes(opt.value)) {
            opt.selected = true
        }
    }
  },
  checkbox: function setCheckbox(element, model) {
    // console.log(element.name, getByPath(model, element.name))
    const storedValue = getByPath(model, element.name)

    if (Array.isArray(storedValue)) {
      if(storedValue.includes(element.value)) {
        element.checked = true
      }
    } else if (storedValue) {
        element.checked = true
    }
  },
  radio: function setRadio(element, model) {
    // console.log(element)
    if (element.value == getByPath(model, element.name)) {
        element.checked = true
    }
  },
  datetimeLocal: function setDatetimeLocal(element, model) {
    // console.log(date.getTime(), localISODateTime(date.getTime()))
    const date = getByPath(model, element.name)
    if(date instanceof Date){
      element.value = localISODateTime(date.getTime()/1000)
    } else {
      element.value = date
    }
  },
  text: function setText(element, model) {
    // console.log(JSON.stringify(getByPath(model, element.name)))
    element.value = getByPath(model, element.name)
  },
  file: function setFile(element, model) {
    // this is managed by fileController
    return
  },

}

export default updateControl