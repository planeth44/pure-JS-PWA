/* jshint esversion: 8 */

// https://stackoverflow.com/a/61104191
export function getByPath(model, path) {
  return path
    .replace(/\[(\w+)\]/g, '.$1')
    .replace(/^\./, '')
    .split(/\./g)
    .reduce((ref, key) => {
      if (key in ref) {
        return ref[key]
      }
      throw Error(`Property ${path} does not exist for object ${JSON.stringify(model)}`)
    }, model)
}

// https://stackoverflow.com/a/50392139
export function setByPath(model, path, value) {
  const [head, ...rest] = path.replace(/\[(\w+)\]/g, '.$1')
    .replace(/^\./, '')
    .split(/\./g)

  if (!rest.length) {
    model[head] = value
  } else {
    setByPath(model[head], rest.join('.'), value)
  }
}