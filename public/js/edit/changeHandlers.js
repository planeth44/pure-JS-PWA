/* jshint esversion: 8 */
const changeHandlers = {
  mySpecialChange: function mySpecialChange(event, model) {
    console.log(event.target.value)
    model[event.target.name] = `preString${event.target.value}`
  }
}

export default changeHandlers