'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _reactNative = require('react-native');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @providesModule Firestack
 * @flow
 */
var FirebaseManager = require('firebase');

var app = require('firebase/app');
var db = require('firebase/database');
var storage = require('firebase/storage');

var FirebaseHelper = _reactNative.NativeModules.Firestack;

var promisify = function promisify(fn) {
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return new Promise(function (resolve, reject) {
      var _ref;

      var handler = function handler(err, resp) {
        return err ? reject(err) : resolve(resp);
      };
      args.push(handler);
      (_ref = typeof fn === 'function' ? fn : FirebaseHelper[fn]).call.apply(_ref, [FirebaseHelper].concat(args));
    });
  };
};

var Firestack = function () {
  function Firestack(options) {
    _classCallCheck(this, Firestack);

    this.options = options;
    this.appInstance = app.initializeApp(options);
    this.configured = false;

    this.eventHandlers = {};
  }

  _createClass(Firestack, [{
    key: 'configure',
    value: function configure() {
      var _this = this;

      return promisify('configure')().then(function () {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        _this.configured = true;
        return args;
      });
    }

    // Auth

  }, {
    key: 'listenForAuth',
    value: function listenForAuth(callback) {
      var sub = this.on('listenForAuth', callback);
      FirebaseHelper.listenForAuth();
      return promisify(function () {
        return sub;
      })(sub);
    }
  }, {
    key: 'unlistenForAuth',
    value: function unlistenForAuth() {
      this.off('listenForAuth');
      return promisify('unlistenForAuth')();
    }

    /**
     * Create a user with the email/password functionality
     * @param  {string} email    The user's email
     * @param  {string} password The user's password
     * @return {Promise}         A promise indicating the completion
     */

  }, {
    key: 'createUserWithEmail',
    value: function createUserWithEmail(email, password) {
      return promisify('createUserWithEmail')(email, password);
    }

    /**
     * Sign a user in with email/password
     * @param  {string} email    The user's email
     * @param  {string} password The user's password
     * @return {Promise}         A promise that is resolved upon completion
     */

  }, {
    key: 'signInWithEmail',
    value: function signInWithEmail(email, password) {
      return promisify('signInWithEmail')(email, password);
    }
  }, {
    key: 'signInWithProvider',
    value: function signInWithProvider(provider, authToken, authSecret) {
      return promisify('signInWithProvider')(provider, authToken, authSecret);
    }
  }, {
    key: 'reauthenticateWithCredentialForProvider',
    value: function reauthenticateWithCredentialForProvider(provider, token, secret) {
      return promisify('reauthenticateWithCredentialForProvider')(provider, token, secret);
    }

    /**
     * Update the current user's email
     * @param  {string} email The user's _new_ email
     * @return {Promise}       A promise resolved upon completion
     */

  }, {
    key: 'updateUserEmail',
    value: function updateUserEmail(email) {
      return promisify('updateUserEmail')(email);
    }

    /**
     * Update the current user's password
     * @param  {string} email the new password
     * @return {Promise}
     */

  }, {
    key: 'updatePassword',
    value: function updatePassword(password) {
      return promisify('updateUserPassword')(password);
    }

    /**
     * Send reset password instructions via email
     * @param {string} email The email to send password reset instructions
     */

  }, {
    key: 'sendPasswordResetWithEmail',
    value: function sendPasswordResetWithEmail(email) {
      return promisify('sendPasswordResetWithEmail')(email);
    }

    /**
     * Delete the current user
     * @return {Promise}
     */

  }, {
    key: 'deleteUser',
    value: function deleteUser() {
      return promisify('deleteUser')();
    }

    /**
     * Update the current user's profile
     * @param  {Object} obj An object containing the keys listed [here](https://firebase.google.com/docs/auth/ios/manage-users#update_a_users_profile)
     * @return {Promise}
     */

  }, {
    key: 'updateUserProfile',
    value: function updateUserProfile(obj) {
      return promisify('updateUserProfile')(obj);
    }

    /**
     * Sign the current user out
     * @return {Promise}
     */

  }, {
    key: 'signOut',
    value: function signOut() {
      return promisify('signOut')();
    }

    /**
     * Get the currently signed in user
     * @return {Promise}
     */

  }, {
    key: 'getCurrentUser',
    value: function getCurrentUser() {
      return promisify('getCurrentUser')();
    }

    // Analytics
    /**
     * Log an event
     * @param  {string} name  The name of the event
     * @param  {object} props An object containing string-keys
     * @return {Promise}
     */

  }, {
    key: 'logEventWithName',
    value: function logEventWithName(name, props) {
      return promisify('logEventWithName')(name, props);
    }

    // Storage

    /**
     * Configure the library to store the storage url
     * @param {string} url A string of your firebase storage url
     * @return {Promise}
     */

  }, {
    key: 'setStorageUrl',
    value: function setStorageUrl(url) {
      return promisify('setStorageUrl')(url);
    }

    /**
     * Upload a filepath
     * @param  {string} name     The destination for the file
     * @param  {string} filepath The local path of the file
     * @param  {object} metadata An object containing metadata
     * @return {Promise}
     */

  }, {
    key: 'uploadFile',
    value: function uploadFile(name, filepath, metadata) {
      return promisify('uploadFile')(name, filepath, metadata);
    }

    // database

  }, {
    key: 'on',
    value: function on(name, cb) {
      if (!this.eventHandlers[name]) {
        this.eventHandlers[name] = [];
      }
      var sub = _reactNative.NativeAppEventEmitter.addListener(name, cb);
      this.eventHandlers[name].push(sub);
      return sub;
    }
  }, {
    key: 'off',
    value: function off(name) {
      if (this.eventHandlers[name]) {
        this.eventHandlers.forEach(function (subscription) {
          return subscription.remove();
        });
      }
    }
  }, {
    key: 'database',
    get: function get() {
      return db();
    }

    /**
     * The native storage object provided by Firebase
     * @return {instance} 
     */

  }, {
    key: 'storage',
    get: function get() {
      return storage();
    }

    // other

  }, {
    key: 'ServerValue',
    get: function get() {
      return db.ServerValue;
    }
  }]);

  return Firestack;
}();

exports.default = Firestack;