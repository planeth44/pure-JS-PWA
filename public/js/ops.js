/* jshint esversion: 8 */
import _d from './libs/query.js'
import {dbPromise} from './db.js'
import {APP, wb} from './app.js'

const triggerBtn  = _d.qs('[data-trigger-thing]')

triggerBtn.addEventListener('click', doTheThing)

async function doTheThing(event) {
    wb.messageSW({
        type: 'RENDER_LIST'
    });
    // document.dispatchEvent(new CustomEvent('message', {
    //   detail: {
    //     type: 'user.notify',
    //     text: 'auto clear in 8 sec',
    //     class: 'info'
    //   }
    // }))
}


