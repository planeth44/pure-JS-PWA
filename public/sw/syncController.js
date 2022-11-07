/*jshint esversion: 8 */
// "use strict";
importScripts('sw/db.js')
importScripts('../js/Constants.js')

const syncHandlers = {

  transmitText: async function() {
 
    const models = await getAllPendingModels()

    if (models.length < 1) {
      return syncHandlers.transmitFile()
    }
 
    const result = await postModels(models)
    
    if (undefined === result) return // bad response is reaching this block
    
    const update = await Promise.allSettled(
          result.map(async uuid => {
            return await updateObjectStatus('theModel', uuid, SYNC_STATUS.DONE)
          })
        )
      
    if (undefined === update) return // bad response is reaching this block

    postMessage({
      type: 'user.notify',
      text: 'Texts upload done',
      class: 'info'
    })

    syncHandlers.transmitFile()
  },

  transmitFile: async function() {

    const file = await getPendingFile()

    if (undefined == file) { // no more file to transmit
      return syncHandlers.transmitFailedFile()
    }

    const json = await postFile(file)
    
    if (undefined === json) return // bad response is reaching this block

    const update = await handleFileUploaded(json)

    return await syncHandlers.transmitFile()
  },
 
  transmitFailedFile: async function() {
    const file = await getFailedFile()

    if (undefined == file) { // no more file to transmit
      postMessage({
        type: 'user.notify',
        text: `No more file to upload`,
        class: 'success'
      })
      self.syncInProgress = false
      return
    }

    const json = await postFile(file)
    
    if (undefined === json){// bad response is reaching this block
      return
    }

    const update = await handleFileUploaded(json)

  }
}

async function postModels(models) {
  return fetch('/api/models', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(models),
  }).then((response) => {
    let contentType = response.headers.get('content-type')

    if (response.ok 
      && response.status == 201 && contentType.includes('application/json')) {

      return response.json()
    } else if (!response.ok && contentType.includes('text/html')) {

      return response.text().then(async (html) => {
        postMessage({
          type: 'user.notify',
          text: `Trying to upload texts<br>
                          But, there was an error:<br>
                          ${html}`,
          class: 'failure'                          
        })
        // not updating w/ failed as we don’t know which part/model failed
        // should be decided w/ back-end response
      })
    } else {

      postMessage({
        type: 'user.notify',
        text: `Trying to upload models<br>
                  But, there was an error:<br>
                  Response was : ${response.statusText}<br>
                  content-type was ${contentType}`,
        class: 'failure'                          
      })

      return
    }
  }).catch((fetchError) => {
      console.error(fetchError)
      postMessage({
        type: 'user.notify',
        text: 'We’re offline, sailor ⛵' + fetchError.toString(),
        class: 'info'                          
      })
  })
}

async function postFile(file) {
    return fetch('/api/file', {
        method: 'PUT',
        headers: {
          'Content-Type': file.mime,
          'X-filename': file.name,
          'X-fileuuid': file.uuid,
          'X-fileparentuuid': file.parentUuid,
        },
        body: file.blob
      })
      .then(async response => {
        let contentType = response.headers.get('content-type')

        if (response.ok
         && response.status == 201 && contentType.includes('application/json')) {

          return response.json() 
        } else if (!response.ok && contentType.includes('text/html')) {

          return response.text().then(async (html) => {
            postMessage({
              type: 'user.notify',
              text: `Trying to upload files ${file.name}<br>
                    But, there was an error:<br>
                    ${html}`,
              class: 'failure'
            })
            return await updateObjectStatus('document', file.uuid, SYNC_STATUS.FAILED, html)
          })
        } else {

          postMessage({
            type: 'user.notify',
            text: `Trying to upload file<br>
                    But, there was an error:<br>
                    Response was : ${response.statusText}<br>
                    content-type was ${contentType}`,
            class: 'failure'                          
          })
          return
        }
      })
      .catch((networkError) => {
        console.error(networkError)
        postMessage({
          type: 'user.notify',
          text: 'We’re offline, sailor ⛵' + networkError.toString(),
          class: 'info'
        })
      })
}


async function handleFileUploaded(json) {

  await updateObjectStatus('document', json.uuid, SYNC_STATUS.DONE)

  return
}

/*
async function cachePhoto(res) {

  const db = await dbPromise
  const photo = await db.get('photo', res.name)

  const response = new Response(photo.image, {
    status: 200,
    statusText: 'Served from Offline images CacheStorage',
    headers:{
      'Content-Type': photo.mime,
      'Response-Type': 'basic', 
    }
  })

  const url = '/' + res.filename
  const request = new Request(url, {
    method: 'GET',
    headers: {'Accept': photo.mime}
  })

  const cacheStorage = await caches.open( 'images' )

  await cacheStorage.put(request, response)
  return 
}*/
