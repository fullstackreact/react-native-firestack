export const promisify = (fn, NativeModule) => (...args) => {
  return new Promise((resolve, reject) => {
    const handler = (err, resp) => {
      err ? reject(err) : resolve(resp);
    }
    args.push(handler);
    (typeof fn === 'function' ? fn : NativeModule[fn])
      .call(NativeModule, ...args);
  });
};

export default promisify