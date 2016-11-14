export const promisify = (fn, NativeModule) => (...args) => {
  return new Promise((resolve, reject) => {
    const handler = (err, resp) => {
      setTimeout(() => {
        err ? reject(err) : resolve(resp);
      }, 0);
    }
    args.push(handler);
    (typeof fn === 'function' ? fn : NativeModule[fn])
      .call(NativeModule, ...args);
  });
};

export default promisify
