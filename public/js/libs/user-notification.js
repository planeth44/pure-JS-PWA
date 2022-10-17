/*jshint esversion: 8 */

const UiElement = {}

/*
 * Templates 
 */
function userNotifTmpl(message) {
  return `
    <div class="user-notification ${message.class}">
      <p class="content">${message.text}</p>
      <button class="close" title="close notification" data-close-notification>×</button>
    </div>`
}

/*
 * Event listeners
 */
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-notification]')) {
    dismiss(event.target.closest('[data-close-notification]'))
  }
})

document.addEventListener('DOMContentLoaded', init);
/*
 * Functions
 */

function init() {
  UiElement.mainNode = document.querySelector('main')
}

export default function notifyUser(message) {

  const notifier = userNotifTmpl(message)

  UiElement.mainNode.insertAdjacentHTML('afterbegin', notifier)
}

function dismiss(elt) {
  elt.parentElement.remove()
}