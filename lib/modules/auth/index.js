// @flow
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

import User from './../user';
import { Base } from './../base';
import EmailAuthProvider from './Email';
import { promisify } from './../../utils';

const FirestackAuth = NativeModules.FirestackAuth;
const FirestackAuthEvt = new NativeEventEmitter(FirestackAuth);

type AuthResultType = { authenticated: boolean, user: Object|null };
type CredentialType = { provider: string, token: string, secret: string };

export default class Auth extends Base {
  _user: User|null;
  _authResult: AuthResultType | null;
  authenticated: boolean;

  constructor(firestack: Object, options: Object = {}) {
    super(firestack, options);
    this._user = null;
    this._authResult = null;
    this.authenticated = false;

    // attach auth providers
    // TODO add missing providers
    this.EmailAuthProvider = EmailAuthProvider;
    // start listening straight away
    // generally though the initial event fired will get ignored
    // but this is ok as we fake it with the getCurrentUser below
    FirestackAuthEvt.addListener('listenForAuth', this._onAuthStateChanged.bind(this));
    FirestackAuth.listenForAuth();
  }

  /**
   * Internal auth changed listener
   * @param auth
   * @private
   */
  _onAuthStateChanged(auth: AuthResultType) {
    this._authResult = auth;
    this.authenticated = auth ? auth.authenticated || false : false;
    if (auth && auth.user && !this._user) this._user = new User(this, auth);
    else if ((!auth || !auth.user) && this._user) this._user = null;
    else if (this._user) this._user._updateValues(auth);
    this.emit('onAuthStateChanged', this._authResult.user || null);
  }

  /*
   * WEB API
   */

  /**
   * Listen for auth changes.
   * @param listener
   */
  onAuthStateChanged(listener: Function) {
    this.log.info('Creating onAuthStateChanged listener');
    this.on('onAuthStateChanged', listener);
    if (this._authResult) listener(this._authResult.user || null);
    return this._offAuthStateChanged.bind(this, listener);
  }

  /**
   * Remove auth change listener
   * @param listener
   */
  _offAuthStateChanged(listener: Function) {
    this.log.info('Removing onAuthStateChanged listener');
    this.removeListener('onAuthStateChanged', listener);
  }

  /**
   * Create a user with the email/password functionality
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise indicating the completion
   */
  createUserWithEmailAndPassword(email: string, password: string): Promise<Object> {
    this.log.info('Creating user with email and password', email);
    return promisify('createUserWithEmail', FirestackAuth, 'auth/')(email, password);
  }

  /**
   * Sign a user in with email/password
   * @param  {string} email    The user's email
   * @param  {string} password The user's password
   * @return {Promise}         A promise that is resolved upon completion
   */
  signInWithEmailAndPassword(email: string, password: string): Promise<Object> {
    this.log.info('Signing in user with email and password', email);
    return promisify('signInWithEmail', FirestackAuth, 'auth/')(email, password);
  }

  // TODO move user methods to User class

  /**
   * Update the current user's email
   * @param  {string} email The user's _new_ email
   * @return {Promise}       A promise resolved upon completion
   */
  updateEmail(email: string): Promise<Object> {
    return promisify('updateUserEmail', FirestackAuth, 'auth/')(email);
  }

  /**
   * Send verification email to current user.
   */
  sendEmailVerification(): Promise<Object> {
    return promisify('sendEmailVerification', FirestackAuth, 'auth/')();
  }

  /**
   * Update the current user's password
   * @param  {string} password the new password
   * @return {Promise}
   */
  updatePassword(password: string): Promise<Object> {
    return promisify('updateUserPassword', FirestackAuth, 'auth/')(password);
  }

  /**
   * Update the current user's profile
   * @param  {Object} updates An object containing the keys listed [here](https://firebase.google.com/docs/auth/ios/manage-users#update_a_users_profile)
   * @return {Promise}
   */
  updateProfile(updates: Object = {}): Promise<Object> {
    return promisify('updateUserProfile', FirestackAuth, 'auth/')(updates);
  }

  /**
   *
   * @param credential
   */
  link(credential: CredentialType) {
    return promisify('link', FirestackAuth, 'auth/')(credential.provider, credential.token, credential.secret);
  }

  /**
   * Sign the user in with a custom auth token
   * @param  {string} customToken  A self-signed custom auth token.
   * @return {Promise}             A promise resolved upon completion
   */
  signInWithCustomToken(customToken: string): Promise<Object> {
    return promisify('signInWithCustomToken', FirestackAuth)(customToken);
  }

  /**
   * Sign the user in with a third-party authentication provider
   * @return {Promise}           A promise resolved upon completion
   */
  signInWithCredential(credential: any): Promise<Object> {
    if (Platform.OS === 'ios'){
      return promisify('signInWithProvider', FirestackAuth)(credential);
    }else{ //Android
      return promisify('signInWithProvider', FirestackAuth)(credential.provider, credential.accessToken, credential.secret);
    }
  }

  /**
   * Re-authenticate a user with a third-party authentication provider
   * @return {Promise}         A promise resolved upon completion
   */
  reauthenticateUser(credential: any): Promise<Object> {
    return promisify('reauthenticateWithCredentialForProvider', FirestackAuth)(credential);
  }

  /**
   * Sign a user in anonymously
   * @return {Promise}            A promise resolved upon completion
   */
  signInAnonymously(): Promise<Object> {
    return promisify('signInAnonymously', FirestackAuth, 'auth/')();
  }

  /**
   * Send reset password instructions via email
   * @param {string} email The email to send password reset instructions
   */
  sendPasswordResetEmail(email: string): Promise<Object> {
    return promisify('sendPasswordResetWithEmail', FirestackAuth, 'auth/')(email);
  }

  /**
   * Delete the current user
   * @return {Promise}
   */
  deleteUser(): Promise<Object> {
    return promisify('deleteUser', FirestackAuth, 'auth/')();
  }

  /**
   * Delete the current user
   * @return {Promise}
   */
  reloadUser(): Promise<Object> {
    return promisify('reloadUser', FirestackAuth, 'auth/')();
  }

  /**
   * get the token of current user
   * @return {Promise}
   */
  getToken(): Promise<Object> {
    return promisify('getToken', FirestackAuth, 'auth/')();
  }


  /**
   * Sign the current user out
   * @return {Promise}
   */
  signOut(): Promise<Object> {
    return promisify('signOut', FirestackAuth, 'auth/')();
  }

  /**
   * Get the currently signed in user
   * @return {Promise}
   */
  getCurrentUser(): Promise<Object> {
    return promisify('getCurrentUser', FirestackAuth, 'auth/')();
  }

  /**
   * Get the currently signed in user
   * @return {Promise}
   */
  get currentUser(): User|null {
    return this._user;
  }

  get namespace(): string {
    return 'firestack:auth';
  }
}
