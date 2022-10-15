/*jshint esversion: 8 */

const UiElement = {}

/*
* Templates 
*/
function userNotifTmpl(message) {
  return `
    <div class="flpwa-notification ${message.class}">
      <p class="flpwa-notification-content">${message.text}</p>
      <button class="flpwa-notification-close" title="dismiss notification">×</button>
    </div>`
}

/*
* Event listeners
*/

document.addEventListener('DOMContentLoaded', init);
/*
* Functions
*/

function init()
{
    UiElement.mainNode    = document.querySelector('main')
    UiElement.siblingNode = UiElement.mainNode.firstElementChild
}

export default function notifyUser(message) {

  const notifier = userNotifTmpl(message)

  UiElement.mainNode.insertBefore(notifier, UiElement.siblingNode)
}

