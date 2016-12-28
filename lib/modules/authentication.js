
import {NativeModules, NativeEventEmitter} from 'react-native';
const FirestackAuth = NativeModules.FirestackAuth
const FirestackAuthEvt = new NativeEventEmitter(FirestackAuth);

import promisify from '../utils/promisify'
import { Base } from './base'

export class Authentication extends Base {
  constructor(firestack, options={}) {
    super(firestack, options);
  }

  // Auth
  listenForAuth(callback) {
    this.log.info('Setting up listenForAuth callback');
    const sub = this._on('listenForAuth', callback, FirestackAuthEvt);
    FirestackAuth.listenForAuth();
    this.log.info('Listening for auth...');
    return promisify(() => sub, FirestackAuth)(sub);
  }

  unlistenForAuth() {
    this.log.info('Unlistening for auth');
    this._off('listenForAuth');
    return promisify('unlistenForAuth', FirestackAuth)();
  }

  /**
   * Create a user with the email/password functionality
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise indicating the completion
   */
  createUserWithEmail(email, password) {
    this.log.info('Creating user with email', email);
    return promisify('createUserWithEmail', FirestackAuth)(email, password);
  }

  /**
   * Sign a user in with email/password
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise that is resolved upon completion
   */
  signInWithEmail(email, password) {
    return promisify('signInWithEmail', FirestackAuth)(email, password)
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
   * Sign the user in with a custom auth token
   * @param  {string} customToken  A self-signed custom auth token.
   * @return {Promise}             A promise resolved upon completion
   */
  signInWithCustomToken(customToken) {
    return promisify('signInWithCustomToken', FirestackAuth)(customToken)
  }

  /**
   * Sign a user in anonymously
   * @return {Promise}            A promise resolved upon completion
   */
  signInAnonymously() {
    return promisify('signInAnonymously', FirestackAuth)();
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
   * Update the current user's email
   * @param  {string} email The user's _new_ email
   * @return {Promise}       A promise resolved upon completion
   */
  updateUserEmail(email) {
    return promisify('updateUserEmail', FirestackAuth)(email);
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
   * @param  {Object} obj An object containing the keys listed [here](https://firebase.google.com/docs/auth/ios/manage-users#update_a_users_profile)
   * @return {Promise}
   */
  updateUserProfile(obj) {
    return promisify('updateUserProfile', FirestackAuth)(obj);
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

  get namespace() {
    return 'firestack:auth';
  }
}

export default Authentication
