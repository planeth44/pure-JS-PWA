/*jshint esversion: 9 */
import {readableFileSize } from './readableFileSize.js'
import {dbPromise } from '../db.js'


  async function displayFile(file, filesWrapper)
  {

      const
        div = document.createElement('div'),
        fileUuid = crypto.randomUUID()
      ;
      div.classList.add('result-img')

    if (file && file.type.match('image.*')) {
        const image = new Image()
        image.dataset.uuid = fileUuid
        div.appendChild(image)

        return readtheFile('readAsDataURL', file).then(result => {
            image.src = result
            filesWrapper.insertAdjacentElement('beforeend', div)

            return fileUuid
          })

    } else {
      /*
        Or We could filter out photos only
        throw new NotImageError(`Le fichier sélectionné ${file.name} n’est pas une image. Choisissez en un autre.`)
       */

        div.insertAdjacentHTML(
            'afterbegin',`
            <p data-uuid="${fileUuid}">${file.name}</p>
            `
        )
        filesWrapper.insertAdjacentElement('beforeend', div)

        return fileUuid
    }
  }

  async function storeCurrentFile(theFile, fileUuid, parentUuid)
  {
      const currentFile = {
            uuid: fileUuid, // primaryKey
            parentUuid: parentUuid, // theModel uuid
            timestamp: new Date().getTime() / 1000,
            mime: theFile.type,
            name: theFile.name,
            syncStatus: 'pending'
        }

        return readtheFile('readAsArrayBuffer', theFile).then(async arrayBuffer => {
            currentFile.blob = arrayBuffer
            currentFile.byteLength = arrayBuffer.byteLength
            currentFile.size = readableFileSize(arrayBuffer.byteLength)

            return await putToDocumentStore(currentFile) // will return fileUuid

        })
  }

  function readtheFile(method, object)
  {
      return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.addEventListener('loadend', (e) => {
                resolve(reader.result)
            });

        reader.addEventListener('error', reject);
        reader[method](object);
        })
  }

  class NotImageError extends Error {}

  async function putToDocumentStore(currentFile) {
    const db = await dbPromise

    return await db.put('document', currentFile);
  }

  export {displayFile, storeCurrentFile, NotImageError}

