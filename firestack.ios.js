/**
 * @providesModule Firestack
 * @flow
 */
const FirebaseManager = require('firebase');

const app = require('firebase/app');
const db = require('firebase/database');
const storage = require('firebase/storage');

import {NativeModules} from 'react-native';

console.log('ksdjfkjdf', NativeModules);
const FirebaseHelper = NativeModules.Firestack;

const promisify = fn => (...args) => {
  return new Promise((resolve, reject) => {
    const handler = (err, resp) => err ? reject(err) : resolve(resp);
    args.push(handler);
    FirebaseHelper[fn].call(FirebaseHelper, ...args);
  });
};

export default class Firestack {
  constructor(options) {
    this.options = options;
    this.appInstance = app.initializeApp(options);
  }

  configure() {
    return promisify('configure')();
  }

  // Auth
  listenForAuth(callback) {
    return FirebaseHelper.listenForAuth(callback);
  }

  unlistenForAuth() {
    return promisify('unlistenForAuth')();
  }

  createUserWithEmail(email, password) {
    return promisify('createUserWithEmail')(email, password);
  }

  signInWithEmail(email, password) {
    return promisify('signInWithEmail')(email, password);
  }

  signInWithProvider(provider, authToken, authSecret) {
    return promisify('signInWithProvider')(provider, authToken, authSecret);
  }

  getCurrentUser() {
    return promisify('getCurrentUser')();
  }

  // Analytics
  logEventWithName(name, props) {
    return promisify('logEventWithName')(name, props);
  }

  // Storage
  setStorageUrl(url) {
    return promisify('setStorageUrl')(url);
  }

  uploadFile(name, filepath, metadata) {
    return promisify('uploadFile')(name, filepath, metadata);
  }

  // database
  get database() {
    return db();
  }

  get storage() {
    return storage();
  }

  get ServerValue() {
    return db.ServerValue;
  }

}
