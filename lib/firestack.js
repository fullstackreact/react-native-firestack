/**
 * @providesModule Firestack
 * @flow
 */
const firebase = require('firebase');

const app = require('firebase/app');
const db = require('firebase/database');
const storage = require('firebase/storage');

import {NativeModules, NativeAppEventEmitter, AsyncStorage} from 'react-native';
// TODO: Break out modules into component pieces
// i.e. auth component, storage component, etc.
const FirebaseHelper = NativeModules.Firestack;

import promisify from './promisify'
import RemoteConfig from './remoteConfig'

export class Firestack {

  constructor(options) {
    this.options = options || {};

    this._remoteConfig = options.remoteConfig || {};
    delete options.remoteConfig;

    this.configured = this.options.configure || false;
    this._debug = options.debug || false;
    this.auth = null;

    this.eventHandlers = {};

    this.configure(options);
  }

  configure(opts) {
    opts = opts || {};
    const firestackOptions = Object.assign({}, this.options, opts);
    this.appInstance = app.initializeApp(firestackOptions);

    return promisify('configureWithOptions')(firestackOptions)
    .then((...args) => {
      this.configured = true;
      return args;
    }).catch((err) => {})
  }

  // Auth
  listenForAuth(callback) {
    this.on('listenForAuth', auth => {
      this._updateUserTokenFromPromise(Promise.resolve(auth));
    });

    const sub = this.on('listenForAuth', callback);
    FirebaseHelper.listenForAuth();
    return promisify(() => sub)(sub);
  }

  unlistenForAuth() {
    this.off('listenForAuth');
    return promisify('unlistenForAuth')();
  }

  setStore(store) {
    if (store) {
      this._store = store;
    }
  }

  /**
   * Create a user with the email/password functionality
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise indicating the completion
   */
  createUserWithEmail(email, password) {
    return promisify('createUserWithEmail')(email, password);
  }

  /**
   * Sign a user in with email/password
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise that is resolved upon completion
   */
  signInWithEmail(email, password) {
    return this._updateUserTokenFromPromise(promisify('signInWithEmail')(email, password))
  }

  /**
   * Sign the user in with a third-party authentication provider
   * @param  {string} provider   The name of the provider to use for login
   * @param  {string} authToken  The authToken granted by the provider
   * @param  {string} authSecret The authToken secret granted by the provider
   * @return {Promise}           A promise resolved upon completion
   */
  signInWithProvider(provider, authToken, authSecret) {
    return this._updateUserTokenFromPromise(promisify('signInWithProvider')(provider, authToken, authSecret))
  }

  /**
   * Sign the user in with a custom auth token
   * @param  {string} customToken  A self-signed custom auth token.
   * @return {Promise}             A promise resolved upon completion
   */
  signInWithCustomToken(customToken) {
    return this._updateUserTokenFromPromise(promisify('signInWithCustomToken')(customToken))
  }

  /**
   * Reauthenticate a user with a third-party authentication provider
   * @param  {string} provider The provider name
   * @param  {string} token    The authToken granted by the provider
   * @param  {string} secret   The authTokenSecret granted by the provider
   * @return {Promise}         A promise resolved upon completion
   */
  reauthenticateWithCredentialForProvider(provider, token, secret) {
    return this._updateUserTokenFromPromise(promisify('reauthenticateWithCredentialForProvider')(provider, token, secret))
  }

  _updateUserTokenFromPromise(promise) {
    return promise;
  }

  /**
   * Update the current user's email
   * @param  {string} email The user's _new_ email
   * @return {Promise}       A promise resolved upon completion
   */
  updateUserEmail(email) {
    return promisify('updateUserEmail')(email);
  }

  /**
   * Update the current user's password
   * @param  {string} email the new password
   * @return {Promise}
   */
  updatePassword(password) {
    return promisify('updateUserPassword')(password);
  }

  /**
   * Send reset password instructions via email
   * @param {string} email The email to send password reset instructions
   */
  sendPasswordResetWithEmail(email) {
    return promisify('sendPasswordResetWithEmail')(email);
  }

  /**
   * Delete the current user
   * @return {Promise}
   */
  deleteUser() {
    return promisify('deleteUser')()
  }
  /**
   * get the token of current user
   * @return {Promise}
   */
  getToken() {
    return promisify('getToken')()
  }

  /**
   * Update the current user's profile
   * @param  {Object} obj An object containing the keys listed [here](https://firebase.google.com/docs/auth/ios/manage-users#update_a_users_profile)
   * @return {Promise}
   */
  updateUserProfile(obj) {
    return promisify('updateUserProfile')(obj);
  }

  /**
   * Sign the current user out
   * @return {Promise}
   */
  signOut() {
    return promisify('signOut')();
  }

  /**
   * Get the currently signed in user
   * @return {Promise}
   */
  getCurrentUser() {
    return promisify('getCurrentUser')();
  }

  // Analytics
  /**
   * Log an event
   * @param  {string} name  The name of the event
   * @param  {object} props An object containing string-keys
   * @return {Promise}
   */
  logEventWithName(name, props) {
    return promisify('logEventWithName')(name, props);
  }

  // Storage
  //
  // /**
  //  * Configure the library to store the storage url
  //  * @param {string} url A string of your firebase storage url
  //  * @return {Promise}
  //  */
  // setStorageUrl(url) {
  //   return promisify('setStorageUrl')(url);
  // }

  /**
   * Upload a filepath
   * @param  {string} name     The destination for the file
   * @param  {string} filepath The local path of the file
   * @param  {object} metadata An object containing metadata
   * @return {Promise}
   */
  uploadFile(name, filepath, metadata) {
    return promisify('uploadFile')(name, filepath, metadata);
  }

  // database
  get database() {
    db.enableLogging(this._debug);
    return this.appInstance.database();
  }

  /**
   * The native storage object provided by Firebase
   * @return {instance}
   */
  get storage() {
    return storage();
  }

  // other
  get ServerValue() {
    return db.ServerValue;
  }

  /**
   * remote config
   */
  get remoteConfig() {
    if (!this.remoteConfig) {
      this.remoteConfig = new RemoteConfig(this._remoteConfig);
    }
    return this.remoteConfig;
  }

  /**
   * app instance
   **/
  get app() {
    return this.appInstance;
  }

  /**
   * Redux store
   **/
  get store() {
    return this._store;
  }

  on(name, cb) {
    if (!this.eventHandlers[name]) {
      this.eventHandlers[name] = [];
    }
    const sub = NativeAppEventEmitter.addListener(name, cb);
    this.eventHandlers[name].push(sub);
    return sub;
  }

  off(name) {
    if (this.eventHandlers[name]) {
      this.eventHandlers.forEach(subscription => subscription.remove());
    }
  }
}

export default Firestack