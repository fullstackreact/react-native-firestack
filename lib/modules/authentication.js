import { NativeModules, NativeEventEmitter } from 'react-native';
const FirestackAuth = NativeModules.FirestackAuth
const FirestackAuthEvt = new NativeEventEmitter(FirestackAuth);


import promisify from '../utils/promisify'
import { Base } from './base'
import { default as User} from './user';

export class Authentication extends Base {
  constructor(firestack, options = {}) {
    super(firestack, options);
    this._authResult = null;
    this.authenticated = false;
    this._user = null;

    // always track auth changes internall so we can access them synchronously
    FirestackAuthEvt.addListener('listenForAuth', this._onAuthStateChanged.bind(this));
    FirestackAuth.listenForAuth();
  }

  /**
   * Internal auth changed listener
   * @param auth
   * @private
   */
  _onAuthStateChanged(auth) {
    this._authResult = auth;
    this.authenticated = auth ? auth.authenticated || false : false
    if (auth && !this._user) this._user = new User(this, auth);
    else if (!auth && this._user) this._user = null;
    else this._user._updateValues(auth);
  }

  /*
   * WEB API
   */

  /**
   * Listen for auth changes.
   * @param callback
   */
  onAuthStateChanged(listener) {
    this.log.info('Creating onAuthStateChanged listener');
    const sub = this._on('listenForAuth', listener, FirestackAuthEvt);
    FirestackAuth.listenForAuth();
    this.log.info('Listening for onAuthStateChanged events...');
    return promisify(() => sub, FirestackAuth)(sub);
  }

  /**
   * Remove auth change listener
   * @param listener
   */
  offAuthStateChanged(listener) {
    this.log.info('Removing onAuthStateChanged listener');
    this._off('listenForAuth');
    return promisify('unlistenForAuth', FirestackAuth)();
  }

  /**
   * Create a user with the email/password functionality
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise indicating the completion
   */
  createUserWithEmailAndPassword(email, password) {
    this.log.info('Creating user with email and password', email);
    return promisify('createUserWithEmail', FirestackAuth)(email, password);
  }

  /**
   * Sign a user in with email/password
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise that is resolved upon completion
   */
  signInWithEmailAndPassword(email, password) {
    this.log.info('Signing in user with email and password', email);
    return promisify('signInWithEmail', FirestackAuth)(email, password)
  }


  /**
   * Update the current user's email
   * @param  {string} email The user's _new_ email
   * @return {Promise}       A promise resolved upon completion
   */
  updateEmail(email) {
    return promisify('updateUserEmail', FirestackAuth)(email);
  }

  /**
   * Send verification email to current user.
   */
  sendEmailVerification() {
    return promisify('sendEmailVerification', FirestackAuth)();
  }

  /**
   * Update the current user's password
   * @param  {string} email the new password
   * @return {Promise}
   */
  updatePassword(password) {
    return promisify('updateUserPassword', FirestackAuth)(password);
  }

  /**
   * Update the current user's profile
   * @param  {Object} obj An object containing the keys listed [here](https://firebase.google.com/docs/auth/ios/manage-users#update_a_users_profile)
   * @return {Promise}
   */
  updateProfile(updates) {
    return promisify('updateUserProfile', FirestackAuth)(updates);
  }

  /**
   * Sign the user in with a custom auth token
   * @param  {string} customToken  A self-signed custom auth token.
   * @return {Promise}             A promise resolved upon completion
   */
  signInWithCustomToken(customToken) {
    return promisify('signInWithCustomToken', FirestackAuth)(customToken)
  }

  /**
   * Sign the user in with a third-party authentication provider
   * @param  {string} provider   The name of the provider to use for login
   * @param  {string} authToken  The authToken granted by the provider
   * @param  {string} authSecret The authToken secret granted by the provider
   * @return {Promise}           A promise resolved upon completion
   */
  signInWithProvider(provider, authToken, authSecret) {
    return promisify('signInWithProvider', FirestackAuth)(provider, authToken, authSecret)
  }

  /**
   * Reauthenticate a user with a third-party authentication provider
   * @param  {string} provider The provider name
   * @param  {string} token    The authToken granted by the provider
   * @param  {string} secret   The authTokenSecret granted by the provider
   * @return {Promise}         A promise resolved upon completion
   */
  reauthenticateWithCredentialForProvider(provider, token, secret) {
    return promisify('reauthenticateWithCredentialForProvider', FirestackAuth)(provider, token, secret)
  }


  /**
   * Sign a user in anonymously
   * @return {Promise}            A promise resolved upon completion
   */
  signInAnonymously() {
    return promisify('signInAnonymously', FirestackAuth)();
  }


  /*
   * Old deprecated api stubs
   */


  /**
   * @deprecated
   * @param args
   */
  listenForAuth(...args) {
    console.warn('Firestack: listenForAuth is now deprecated, please use onAuthStateChanged');
    this.onAuthStateChanged(...args);
  }

  /**
   * @deprecated
   * @param args
   */
  unlistenForAuth(...args) {
    console.warn('Firestack: unlistenForAuth is now deprecated, please use offAuthStateChanged');
    this.offAuthStateChanged(...args);
  }

  /**
   * Create a user with the email/password functionality
   * @deprecated
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise indicating the completion
   */
  createUserWithEmail(...args) {
    console.warn('Firestack: createUserWithEmail is now deprecated, please use createUserWithEmailAndPassword');
    this.createUserWithEmailAndPassword(...args);
  }

  /**
   * Sign a user in with email/password
   * @deprecated
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise that is resolved upon completion
   */
  signInWithEmail(...args) {
    console.warn('Firestack: signInWithEmail is now deprecated, please use signInWithEmailAndPassword');
    this.signInWithEmailAndPassword(...args);
  }

  /**
   * Update the current user's email
   * @deprecated
   * @param  {string} email The user's _new_ email
   * @return {Promise}       A promise resolved upon completion
   */
  updateUserEmail(...args) {
    console.warn('Firestack: updateUserEmail is now deprecated, please use updateEmail');
    this.updateEmail(...args);
  }

  /**
   * Send reset password instructions via email
   * @param {string} email The email to send password reset instructions
   */
  sendPasswordResetWithEmail(email) {
    return promisify('sendPasswordResetWithEmail', FirestackAuth)(email);
  }

  /**
   * Delete the current user
   * @return {Promise}
   */
  deleteUser() {
    return promisify('deleteUser', FirestackAuth)()
  }

  /**
   * get the token of current user
   * @return {Promise}
   */
  getToken() {
    return promisify('getToken', FirestackAuth)()
  }

  /**
   * Update the current user's profile
   * @deprecated
   * @param  {Object} obj An object containing the keys listed [here](https://firebase.google.com/docs/auth/ios/manage-users#update_a_users_profile)
   * @return {Promise}
   */
  updateUserProfile(...args) {
    console.warn('Firestack: updateUserProfile is now deprecated, please use updateProfile');
    this.updateProfile(...args);
  }

  /**
   * Sign the current user out
   * @return {Promise}
   */
  signOut() {
    return promisify('signOut', FirestackAuth)();
  }

  /**
   * Get the currently signed in user
   * @return {Promise}
   */
  get currentUser() {
    return this._user;
  }

  get namespace() {
    return 'firestack:auth';
  }
}

export default Authentication
