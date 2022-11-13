/*jshint esversion: 8 */

const UiElement = {}

/*
 * Templates 
 */
function userNotifTmpl(message, notifierId) {
  return `
    <div class="user-notification ${message.class}" id="${notifierId}">
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

  const notifierId = now()
  const delay = message.delay || 8000
  const notifier = userNotifTmpl(message, notifierId)

  UiElement.mainNode.insertAdjacentHTML('afterbegin', notifier)

  setTimeout(() => {
    const thisEl = document.getElementById(notifierId)
    if (thisEl){
      thisEl.classList.add('removing')
      thisEl.ontransitionend = function(){
        thisEl.remove()
      }
    }
  }, delay)

  window.scrollTo(0, 0)
}

function dismiss(elt) {
  elt.parentElement.remove()
}

function now(){
  return Math.floor(new Date().getTime() / 1000)
}
