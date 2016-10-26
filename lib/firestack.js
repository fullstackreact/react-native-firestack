/**
 * @providesModule Firestack
 * @flow
 */
import Log from './utils/log'

// const firebase = require('firebase');

// const app = require('firebase/app');
// const storage = require('firebase/storage');
// const db = require('firebase/database');

import {NativeModules, NativeEventEmitter, AsyncStorage} from 'react-native';
// TODO: Break out modules into component pieces
// i.e. auth component, storage component, etc.
const FirestackModule = NativeModules.Firestack;
const FirestackModuleEvt = new NativeEventEmitter(FirestackModule);

import promisify from './utils/promisify'
import Singleton from './utils/singleton'

import RemoteConfig from './modules/remoteConfig'
import {Authentication} from './modules/authentication'
import {Database} from './modules/database'
import {Analytics} from './modules/analytics'
import {Storage} from './modules/storage'
import {Presence} from './modules/presence'
import {CloudMessaging} from './modules/cloudmessaging'

let log;
export class Firestack extends Singleton {

  constructor(options) {
    var instance = super(options);

    instance.options = options || {};
    instance._debug = instance.options.debug || false;

    Log.enable(instance._debug);
    log = instance._log = new Log('firestack');

    log.info('Creating new firestack instance');

    instance._remoteConfig = instance.options.remoteConfig || {};
    delete instance.options.remoteConfig;

    instance.configured = instance.options.configure || false;
    instance.auth = null;

    instance.eventHandlers = {};

    log.info('Calling configure with options', instance.options);
    instance.configurePromise = instance.configure(instance.options);

    instance._auth = new Authentication(instance, instance.options);
  }

  configure(opts = {}) {
    if (!this.configurePromise) {
      const firestackOptions = Object.assign({}, this.options, opts);
      
      this.configurePromise = promisify('configureWithOptions', FirestackModule)(firestackOptions)
        .then((configuredProperties) => {
          log.info('Native configureWithOptions success', configuredProperties);
          this.configured = true;
          this.firestackOptions = configuredProperties;
          return configuredProperties;
        }).catch((err) => {
          log.info('Native error occurred while calling configure', err);
        })
    }
    return this.configurePromise;
  }

  onReady(cb) {
    return this.configurePromise = this.configurePromise.then(cb);
  }

  /**
   * Wrappers
   * We add methods from each wrapper to this instance
   * when they are needed. Not sure if this is a good
   * idea or not (imperative vs. direct manipulation/proxy)
   */
  get auth() {
    if (!this._auth) { this._auth = new Authentication(this); }
    return this._auth;
  }
  // database
  get database() {
    if (!this._db) { this._db = new Database(this); }
    return this._db;
    // db.enableLogging(this._debug);
    // return this.appInstance.database();
  }

  // analytics
  get analytics() {
    if (!this._analytics) { this._analytics = new Analytics(this); }
    return this._analytics;
  }

  // storage
  get storage() {
    if (!this._storage) { this._storage = new Storage(this); }
    return this._storage;
  }

  // presence
  get presence() {
    if (!this._presence) { this._presence = new Presence(this); }
    return this._presence;
  }
  // CloudMessaging
  get cloudMessaging() {
    if (!this._cloudMessaging) { this._cloudMessaging = new CloudMessaging(this); }
    return this._cloudMessaging;
  }

  // other
  get ServerValue() {
    return promisify('serverValue', FirestackModule)();
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
   * Logger
   */
  get log() {
    return this._log;
  }

  /**
   * Redux store
   **/
  get store() {
    return this._store;
  }

  get constants() {
    if (!this._constants) {
      this._constants = Object.assign({}, Storage.constants)
    }
    return this._constants;
  }

  /**
   * Set the redux store helper
   */
  setStore(store) {
    if (store) {
      this.log.info('Setting the store for Firestack instance');
      this._store = store;
    }
  }

  /**
   * Global event handlers for the single Firestack instance
   */
  on(name, cb, nativeModule) {
    if (!this.eventHandlers[name]) {
      this.eventHandlers[name] = [];
    }
    if (!nativeModule) {
      nativeModule = FirestackModuleEvt;
    }
    const sub = nativeModule.addListener(name, cb);
    this.eventHandlers[name].push(sub);
    return sub;
  }

  off(name) {
    if (this.eventHandlers[name]) {
      this.eventHandlers[name]
        .forEach(subscription => subscription.remove());
    }
  }
}

export default Firestack
