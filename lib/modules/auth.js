import { NativeModules, NativeEventEmitter } from 'react-native';

import { Base } from './base';
import { default as User } from './user';
import promisify from '../utils/promisify';

const FirestackAuth = NativeModules.FirestackAuth;
const FirestackAuthEvt = new NativeEventEmitter(FirestackAuth);

export default class Auth extends Base {
  constructor(firestack, options = {}) {
    super(firestack, options);
    this._authResult = null;
    this.authenticated = false;
    this._user = null;

    // start listening straight away
    // generally though the initial event fired will get ignored
    // but this is ok as we fake it with the getCurrentUser below
    FirestackAuth.listenForAuth();

    this.getCurrentUser().then((u) => {
      const authResult = { authenticated: !!u };
      if (u) authResult.user = u;
      this._onAuthStateChanged(authResult);
      this._startListening();
    }).catch(() => {
      // todo check if error contains user disabled message maybe and add a disabled flag?
      this._onAuthStateChanged({ authenticated: false });
      this._startListening();
    });
  }

  /**
   * Internal function begin listening for auth changes
   * only called after getting current user.
   * @private
   */
  _startListening() {
    FirestackAuthEvt.addListener('listenForAuth', this._onAuthStateChanged.bind(this));
  }

  /**
   * Internal auth changed listener
   * @param auth
   * @private
   */
  _onAuthStateChanged(auth) {
    this._authResult = auth;
    this.emit('onAuthStateChanged', this._authResult.user || null);
    this.authenticated = auth ? auth.authenticated || false : false;
    if (auth && auth.user && !this._user) this._user = new User(this, auth);
    else if ((!auth || !auth.user) && this._user) this._user = null;
    else this._user ? this._user._updateValues(auth) : null;
  }

  /*
   * WEB API
   */

  /**
   * Listen for auth changes.
   * @param listener
   */
  onAuthStateChanged(listener) {
    this.log.info('Creating onAuthStateChanged listener');
    this.on('onAuthStateChanged', listener);
  }

  /**
   * Remove auth change listener
   * @param listener
   */
  offAuthStateChanged(listener) {
    this.log.info('Removing onAuthStateChanged listener');
    this.removeListener('onAuthStateChanged', listener);
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
   * @param  {string} password the new password
   * @return {Promise}
   */
  updatePassword(password) {
    return promisify('updateUserPassword', FirestackAuth)(password);
  }

  /**
   * Update the current user's profile
   * @param  {Object} updates An object containing the keys listed [here](https://firebase.google.com/docs/auth/ios/manage-users#update_a_users_profile)
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
    return promisify('deleteUser', FirestackAuth)();
  }

  /**
   * get the token of current user
   * @return {Promise}
   */
  getToken() {
    return promisify('getToken', FirestackAuth)();
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
  getCurrentUser() {
    return promisify('getCurrentUser', FirestackAuth)();
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
