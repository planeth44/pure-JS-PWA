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

    let json
    try {
      json = await postModels(models)
    } catch (postError) {
      if (postError.message.includes("Failed to fetch")) {
        postMessage({
          type: 'user.notify',
          text: `We’re offline, sailor ⛵<br>
                We cannot reach the server<br>
                Give it a try later`,
          class: 'info'
        })

        return 'offline' // we’re offline stop here
      }
    }

    if (json){
      const update = await Promise.allSettled(
            json.map(async uuid => {
              return await updateObjectStatus('theModel', uuid, SYNC_STATUS.DONE)
            })
          )
    }

    postMessage({
      type: 'user.notify',
      text: 'Texts upload done',
      class: 'info'
    })

    const sync = await syncHandlers.transmitFile()
    return sync
  },

  transmitFile: async function() {

    const file = await getPendingFile()
    let sync

    if (undefined == file) { // no more file to transmit

      sync = await syncHandlers.transmitFailedFile()

      return sync // stoping here
    }

    sync = await doSyncFile(file)

    if (sync == 'offline'){
      return sync
    }

    await syncHandlers.transmitFile()
    // return 
  },
 
  transmitFailedFile: async function() {
    const file = await getFailedFile()

    if (undefined == file) { // no more file to transmit
      postMessage({
        type: 'user.notify',
        text: `No more file to upload`,
        class: 'info'
      })
      // self.syncInProgress = false
      return 'complete'
    }

    let sync = await doSyncFile(file)  // offline|failed|file.uuid
    if (!['offline', 'failed'].includes(sync)){
      sync = 'to complete'
    }

    return sync
  }
}

async function postModels(models) {
  return fetch(API_URL.MODELS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(models),
  }).then((response) => {
    let contentType = response.headers.get('content-type')

    if (response.ok &&
      response.status == 201 &&
      contentType.includes('application/json')) {

      return response.json()
    } else if (!response.ok && contentType.includes('text/html')) {

      /*
      @TO CONSIDER 
      response.status could be 400 or 409 because of bad data
      We could test for response status and store the returned HTML 
      with information about malformed data and offer to edit and resubmit the Thing
      */
      return response.text().then(async (html) => {
        postMessage({
          type: 'user.notify',
          text: `Trying to upload models<br>
            But, there was an error:<br>
            ${html}`,
          class: 'failure'
        })
        /*Not throwing
         and not updating w/ failed as we don’t know which part/model failed
          should be decided w/ back-end response

          throw new fetchError(html)
         */
      })
    } else {

      postMessage({
        type: 'user.notify',
        text: `Trying to upload models<br> But, there was an error:<br>
          Response was : ${response.statusText}<br>
          content-type was ${contentType}`,
        class: 'failure'
      })
      // throw new fetchError(`
      //   Response was : ${response.statusText}<br>
      //   content-type was ${contentType}`)

    }
  })
}

async function doSyncFile(file) {
  let json

  try {
    json = await postFile(file)
  } catch (postError) {

    if (postError.message.includes("Failed to fetch")) {
      postMessage({
        type: 'user.notify',
        text: `We’re offline, sailor ⛵<br>
                We cannot reach the server<br>
                Give it a try later`,
        class: 'info'
      })

      return 'offline'
    } else {

      await updateObjectStatus('document', file.uuid, SYNC_STATUS.FAILED, postError)
      return 'failed'
    }
  }

  if (json) {
    const update = await handleFileUploaded(json)
    return update //file.uuid
  }
}

async function postFile(file) {
  return fetch(API_URL.FILE, {
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

      if (response.ok &&
        response.status == 201 &&
        contentType.includes('application/json')) {

        return response.json()

      } else if (!response.ok && contentType.includes('text/html')) {

        return response.text().then(async (html) => {

          postMessage({
              type: 'user.notify',
              text: `Trying to upload files ${file.name}<br>
                    But, there was an error:<br>
                    <a href="${ROUTES.FAILED}">See failed page</a>`,
              class: 'failure'
            })
          throw new fetchError(html)
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
        throw new fetchError(`
            Response was : ${response.statusText}<br>
            content-type was ${contentType}`)
      }
    })
  /*
  Case of background-sync not available
  networkError will be caught in sw@messageListener
  .catch((networkError) => { 
    console.error(networkError)
    postMessage({
      type: 'user.notify',
      text: 'We’re offline, sailor ⛵' + networkError.toString(),
      class: 'info'
    })
  })
   */
}


async function handleFileUploaded(json) {

  const update = await updateObjectStatus('document', json.uuid, SYNC_STATUS.DONE)

  return update
}

/*
@TO DO make a meaningful error
 */
class fetchError extends Error {}


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
