const handler = (resolve, reject, err, resp) => {
  setImmediate(() => {
    if (err) return reject(err);
    return resolve(resp);
  });
};

export default(fn, NativeModule) => (...args) => {
  return new Promise((resolve, reject) => {
    const _fn = typeof fn === 'function' ? fn : NativeModule[fn];
    if (!_fn || typeof _fn !== 'function') return reject(new Error('Missing function for promisify.'));
    return fn.apply(NativeModule, ...args, handler.bind(handler, resolve, reject));
  });
};
