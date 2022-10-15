/* jshint esversion: 8 */
const changeHandlers = {
  computeDowntime: function computeDowntime(event, model) {
    console.log(event.target.value)
    const value = Number(event.target.value)
    model[event.target.name] = Number(event.target.value)
    model.computedValueFromNbrHours = value * 2.5
  }
}

export default changeHandlers