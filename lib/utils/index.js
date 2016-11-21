/**
 * Makes an objects keys it's values
 * @param object
 * @returns {{}}
 */
export function reverseKeyValues(object) {
  const output = {};
  for (const key in object) {
    output[object[key]] = key;
  }
  return output;
}
