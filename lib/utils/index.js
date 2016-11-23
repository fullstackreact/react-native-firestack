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

/**
 * No operation func
 */
export function noop() {
}


// internal promise handler
const _handler = (resolve, reject, err, resp) => {
  // resolve / reject after events etc
  setImmediate(() => {
    if (err) return reject(err);
    return resolve(resp);
  });
};

/**
 * Wraps a native module method to support promises.
 * @param fn
 * @param NativeModule
 */
export function promisify(fn, NativeModule) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      const _fn = typeof fn === 'function' ? fn : NativeModule[fn];
      if (!_fn || typeof _fn !== 'function') return reject(new Error('Missing function for promisify.'));
      return _fn.apply(NativeModule, [...args, _handler.bind(_handler, resolve, reject)]);
    });
  };
}
