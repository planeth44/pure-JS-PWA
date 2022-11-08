/* jshint esversion: 8 */
export default function isOnline()
{
    return new Promise((resolve, reject) => {
        fetch(API_URL.CHECK, {
            method: 'HEAD'
        }).then(response => {
          // console.log(response.status)
            resolve(true)
        }).catch(offline => {
          // console.log('offline')
            reject(false)
        })
    })
}