/*jshint esversion: 8 */
// "use strict";
importScripts('sw/db.js')
importScripts('../js/Constants.js')

const syncHandlers = {

  transmitText: async function() {

    const models = await getAllPendingModels()

    let json

    if (models.length < 1) {
      return syncHandlers.transmitFile()
    }

    try {

      json = await postModels(models)

    } catch (syncError) {

      if (syncError instanceof ServerHTMLError ||
        syncError instanceof ServerError) {

        postMessage({
          type: 'user.notify',
          text: syncError.message,
          class: 'failure'
        })

        return 'failed'
      } else { // networkError

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

    if (json) {
      const update = await Promise.allSettled(
        json.map(async (uuid) => await updateObjectStatus('theModel', uuid, SYNC_STATUS.DONE))
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

        throw new ServerHTMLError('', {
          objectUploaded: 'models',
          html: html
        })
        /* not updating w/ failed as we don’t know which part/model failed
          should be decided w/ back-end response
         */
      })
    } else {
      throw new ServerError('', {
        contentType: contentType,
        statusText: response.statusText,
        objectUploaded: 'models'
      })
    }
  })
}

async function doSyncFile(file) {
  let json

  try {
    json = await postFile(file)
  } catch (syncError) {

     if (syncError instanceof PutFileHTMLError) {

      await updateObjectStatus('document', file.uuid, SYNC_STATUS.FAILED, syncError.cause.html)

      postMessage({
          type: 'user.notify',
          text: syncError.message,
          class: 'failure'
        })

      return 'failed'
    } else if (syncError instanceof ServerError) {

      await updateObjectStatus('document', file.uuid, SYNC_STATUS.FAILED, syncError.message)

      postMessage({
          type: 'user.notify',
          text: syncError.message,
          class: 'failure'
        })

      return 'failed'
    } else { //networkError 
        /*
        syncError.message.includes("Failed to fetch")
        can’t check for message content as it’s different in each browser
        https://github.com/github/fetch/issues/201#issuecomment-308213104
        // */

      postMessage({
        type: 'user.notify',
        text: `We’re offline, sailor ⛵<br>
                We cannot reach the server<br>
                Give it a try later`,
        class: 'info'
      })

      return 'offline'
    } 

  }

  if (json) {
    const update = await updateObjectStatus('document', json.uuid, SYNC_STATUS.DONE)
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

        return response.text().then((html) => {

        throw new PutFileHTMLError('', {
          fileName: file.name,
          html: html
        })
      })
      } else {

        throw new ServerError('', {
            contentType: contentType,
            statusText: response.statusText,
            objectUploaded: 'file'
          })
      }
    })
    /*
      Exception for "Failed to fetch" will be intercepted in @doSyncFile
     */
}

/*
    Custom ERROR
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#custom_error_types
 */
// class ServerError extends Error {}

class PutFileHTMLError extends Error {
  /*
    options.fileName  
    options.html the response error 
   */
  constructor(message, options) {
    // Need to pass `options` as the second parameter to install the "cause" property.
    super(message, {cause: options});
    this.message = `Trying to upload files ${options.fileName}<br>
                    But, there was an error:<br>
                    <a href="${ROUTES.FAILED}">See failed page</a>`
  }
}
class ServerHTMLError extends Error {
  constructor(message, options) {

    super(message, options);
    this.message = `Trying to upload ${options.objectUploaded}<br>
                    But, there was an error:<br>
                    ${options.html}`
  }
}

class ServerError extends Error {
  constructor(message, options) {

    super(message, options);
    this.message = `Trying to upload ${options.objectUploaded}<br>
                    But, there was an error:<br>
                    Response was : ${options.statusText}<br>
                    content-type was ${options.contentType}`
  }
}


/* @TO DO resize & cache photos https://stackoverflow.com/a/53986239
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
