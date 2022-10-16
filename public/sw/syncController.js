/*jshint esversion: 8 */
// "use strict";
importScripts('sw/db.js')

const syncHandlers = {

  transmitText: async function() {
    const models = await getAllPendingModels()
    console.log(models)
    const result = await postModels(models)
    
    console.log(result)
    if (undefined === result) {
      return // bad response is reaching this block
    }
    
    const update = await Promise.allSettled(
          result.map(async uuid => {
            return await updateObjectStatus('theModel', uuid, 'done')
          })
        )
      
    if (undefined === update) return // bad response is reaching this block

    postMessage({
      type: 'user.notify',
      text: 'Texts upload done',
    })
  },

  transmitPhoto: async function() {

    self.syncInProgress = true
    const photo = await getPendingPhoto()
    if (undefined == photo) { // no more photo to transmit
      return transmitHandlers.transmitFailedPhoto()
    }

    return fetch('/journal/photo', {
        method: 'PUT',
        headers: {
          'Content-Type': photo.mime,
          'X-filename': photo.name,
        },
        body: photo.image
      })
      .then(async response => {
        let contentType = response.headers.get('content-type')

        if (response.ok && contentType.includes('application/json')) {

          return await handlePhotoUploaded(response)
        } else if (!response.ok && contentType.includes('text/html')) {

          return await handleFailedPhotoUpload(response, photo.name)
        } else if (response.ok && contentType.includes('text/html')) {
          const html = await response.text()
          postMessage({
            type: 'user.notify',
            text: `Trying to upload photos<br>
                    But, there was an error:<br>
                    Response was : ${html}`
          })
        } else {

          postMessage({
            type: 'user.notify',
            text: `Trying to upload photos<br>
                    But, there was an error:<br>
                    Response was : ${response.statusText}<br>
                    content-type was ${contentType}`
          })
        }
      })
      .catch(error => {
        console.error(error)
        postMessage({
          type: 'user.notify',
          text: 'We’re offline, sailor ⛵',
        })
      })
  },
  transmitFailedPhoto: async function() {
    const photo = await getFailedPhoto()
    if (undefined == photo) { // no more photo to transmit
      postMessage({
        type: 'user.notify',
        text: `No more photo to upload`
      })
      self.syncInProgress = false
      return
    }

    return fetch('/journal/photo', {
        method: 'PUT',
        headers: {
          'Content-Type': photo.mime,
          'X-filename': photo.name,
        },
        body: photo.image
      })
      .then(async response => {
        let contentType = response.headers.get('content-type')

        if (response.ok && contentType.includes('application/json')) {

          return await handlePhotoUploadedAndStop(response)
        } else if (!response.ok && contentType.includes('text/html')) {

          return await handleFailedPhotoUpload(response, photo.name)
        } else {

          postMessage({
            type: 'user.notify',
            text: `Trying to upload photos<br>
                    But, there was an error:<br>
                    Response was : ${response.statusText}<br>
                    content-type was ${contentType}`
          })
        }
      })
      .catch(error => {
        throw new Error('We’re offline, sailor ⛵')
      })

  }
}

async function startSync() {
  return await syncHandlers.transmitText()
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

    if (response.ok && response.status == 201 && contentType.includes('application/json')) {

      return response.json()
    } else if (!response.ok && contentType.includes('text/html')) {

      return response.text().then((html) => {
        postMessage({
          type: 'user.notify',
          text: `Trying to upload texts<br>
                          But, there was an error:<br>
                          ${html}`
        })
        return
      })
    } else {

      postMessage({
        type: 'user.notify',
        text: `Trying to upload texts<br>
                  But, there was an error:<br>
                  Response was : ${response.statusText}<br>
                  content-type was ${contentType}`,
      })

      return
    }
  }).catch((fetchError) => {
      console.error(fetchError)
      postMessage({
        type: 'user.notify',
        text: 'We’re offline, sailor ⛵' + fetchError.toString(),
      })
  })
}




async function handlePhotoUploaded(response) {
  response.json().then(async res => {

    await cachePhoto(res) // name, filename

    await deleteFromStore('photo', res.name)

    postMessage({
      type: 'update.photo.queue',
      photoName: res.name
    })
    // queue viewer will message SW for new transitPhoto cycle
    // return await transmitHandlers.transmitPhoto()
  })
}

async function handlePhotoUploadedAndStop(response) {
  response.json().then(async res => {

    await cachePhoto(res) // name, filename

    postMessage({
      type: 'update.photo.queue',
      photoName: res.name
    })

    await deleteFromStore('photo', res.name)
    return 

  })
}

async function handleFailedPhotoUpload(response, photoName) {
  response.text().then(async html => {
    postMessage({
      type: 'user.notify',
      text: `Trying to upload photos<br>
            But, there was an error:<br>
            <a href="/journal/queueFailed">View errors</a>`
    })
    await updateObjectStatus('photo', photoName, 'transmission_failed', html)
    return 
  })
}

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
}

async function getPhoto(uuid) {
}


