import promisify from '../utils/promisify';
import { Base } from './base';


export default class User {
  constructor(authClass, authObj) {
    this._auth = authClass;
    this._user = null;
    this._updateValues(authObj);
  }

  /**
   * INTERNALS
   */

  /**
   *
   * @param authObj
   * @private
   */
  _updateValues(authObj) {
    this._authObj = authObj;
    if (authObj.user) {
      this._user = authObj.user;
    } else {
      this._user = null;
    }
  }

  /**
   * Returns a user property or null if does not exist
   * @param prop
   * @returns {*}
   * @private
   */
  _getOrNull(prop) {
    if (!this._user) return null;
    if (!Object.hasOwnProperty.call(this._user, prop)) return null;
    return this._user[prop];
  }

  /**
   * PROPERTIES
   */

  get displayName() {
    return this._getOrNull('displayName');
  }

  get email() {
    return this._getOrNull('email');
  }

  get emailVerified() {
    return this._getOrNull('emailVerified');
  }

  get isAnonymous() {
    return !this._getOrNull('email') && this._getOrNull('providerId') === 'firebase';
  }

  get photoURL() {
    return this._getOrNull('photoURL');
  }

  get photoUrl() {
    return this._getOrNull('photoURL');
  }

  // TODO no android method yet, the SDK does have .getProviderData but returns as a List.
  // get providerData() {
  //   return this._getOrNull('providerData');
  // }

  get providerId() {
    return this._getOrNull('providerId');
  }

  // TODO no
  // get refreshToken() {
  //   return this._getOrNull('refreshToken');
  // }

  get uid() {
    return this._getOrNull('uid');
  }

  /**
   * METHODS
   */

  delete(...args) {
    return this._auth.deleteUser(...args);
  }

  getToken(...args) {
    return this._auth.getToken(...args);
  }

  get updateEmail() {
    if (this.isAnonymous) return () => Promise.reject(new Error('Can not update email on an annonymous user.'));
    return this._auth.updateEmail;
  }

  get updateProfile() {
    return this._auth.updateProfile;
  }

  get updatePassword() {
    if (this.isAnonymous) return () => Promise.reject(new Error('Can not update password on an annonymous user.'));
    return this._auth.updatePassword;
  }

  get sendEmailVerification() {
    if (this.isAnonymous) return () => Promise.reject(new Error('Can not verify email on an annonymous user.'));
    return this._auth.sendEmailVerification;
  }
}
