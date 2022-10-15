/*jshint esversion: 8 */

let tzOffset

export default function localISODateTime(timestamp){
  if (!tzOffset){
    const currentOffset = (new Date()).getTimezoneOffset() * 60000 //offset in milliseconds
    tzOffset = currentOffset
  }
  timestamp = timestamp * 1000
  return (new Date(timestamp - tzOffset)).toISOString().slice(0, 16)
}
