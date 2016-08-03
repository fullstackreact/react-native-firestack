import {NativeModules, NativeAppEventEmitter} from 'react-native';
const FirebaseHelper = NativeModules.Firestack;

export const promisify = fn => (...args) => {
  return new Promise((resolve, reject) => {
    const handler = (err, resp) => err ? reject(err) : resolve(resp);
    args.push(handler);
    (typeof fn === 'function' ? fn : FirebaseHelper[fn])
      .call(FirebaseHelper, ...args);
  });
};

export default promisify