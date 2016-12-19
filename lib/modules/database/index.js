/**
 * @flow
 * Database representation wrapper
 */
import { NativeModules, NativeEventEmitter } from 'react-native';
import { Base } from './../base';
import Snapshot from './snapshot.js';
import Reference from './reference.js';
import { promisify, isFunction } from './../../utils';

const FirestackDatabase = NativeModules.FirestackDatabase;
const FirestackDatabaseEvt = new NativeEventEmitter(FirestackDatabase);

/**
 * @class Database
 */
export default class Database extends Base {
  constructor(firestack: Object, options: Object = {}) {
    super(firestack, options);
    this.subscriptions = {};
    this.persistenceEnabled = false;
    this.namespace = 'firestack:database';

    this.successListener = FirestackDatabaseEvt.addListener(
      'database_event',
      event => this._handleDatabaseEvent(event)
    );

    this.errorListener = FirestackDatabaseEvt.addListener(
      'database_error',
      err => this._handleDatabaseError(err)
    );

    this.log.debug('Created new Database instance', this.options);
  }

  /**
   * Returns a new firestack reference instance
   * @param path
   * @returns {Reference}
   */
  ref(...path: Array<string>) {
    return new Reference(this, path);
  }

  /**
   * Enabled / disable database persistence
   * @param enable
   * @returns {*}
   */
  setPersistence(enable: boolean = true) {
    if (this.persistenceEnabled !== enable) {
      this.log.debug(`${enable ? 'Enabling' : 'Disabling'} persistence`);
      this.persistenceEnabled = enable;
      return this.whenReady(promisify('enablePersistence', FirestackDatabase)(enable));
    }

    return this.whenReady(Promise.resolve({ status: 'Already enabled' }));
  }

  /**
   *
   * @param path
   * @param modifiersString
   * @param modifiers
   * @param eventName
   * @param cb
   * @returns {*}
   */
  on(path: string, modifiersString: string, modifiers: Array<string>, eventName: string, cb: () => void) {
    const handle = this._handle(path, modifiersString);
    this.log.debug('adding on listener', handle);

    if (this.subscriptions[handle]) {
      if (this.subscriptions[handle][eventName]) this.subscriptions[handle][eventName].push(cb);
      else this.subscriptions[handle][eventName] = [cb];
    } else {
      this.subscriptions[handle] = { [eventName]: [cb] };
    }

    return promisify('on', FirestackDatabase)(path, modifiersString, modifiers, eventName);
  }

  /**
   *
   * @param path
   * @param modifiersString
   * @param eventName
   * @param origCB
   * @returns {*}
   */
  off(path: string, modifiersString: string, eventName?: string, origCB?: () => void) {
    const handle = this._handle(path, modifiersString);
    this.log.debug('off() : ', handle, eventName);

    if (!this.subscriptions[handle] || (eventName && !this.subscriptions[handle][eventName])) {
      this.log.warn('off() called, but not currently listening at that location (bad path)', handle, eventName);
      return Promise.resolve();
    }

    if (eventName && origCB) {
      const i = this.subscriptions[handle][eventName].indexOf(origCB);
      if (i === -1) {
        this.log.warn('off() called, but the callback specifed is not listening at that location (bad path)', handle, eventName);
        return Promise.resolve();
      }

      this.subscriptions[handle][eventName] = this.subscriptions[handle][eventName].splice(i, 1);

      if (this.subscriptions[handle][eventName].length > 0) {
        return Promise.resolve();
      }
    } else if (eventName) {
      this.subscriptions[handle][eventName] = [];
    } else {
      this.subscriptions[handle] = {};
    }

    return promisify('off', FirestackDatabase)(path, modifiersString, eventName);
  }

  /**
   * Removes all event handlers and their native subscriptions
   * @returns {Promise.<*>}
   */
  cleanup() {
    const promises = [];
    Object.keys(this.subscriptions).forEach((handle) => {
      Object.keys(this.subscriptions[handle]).forEach((eventName) => {
        const separator = handle.indexOf('|');
        const path = handle.substring(0, separator);
        const modifiersString = handle.substring(separator + 1);
        promises.push(this.off(path, modifiersString, eventName));
      });
    });

    return Promise.all(promises);
  }

  goOnline() {
    FirestackDatabase.goOnline();
  }

  goOffline() {
    FirestackDatabase.goOffline();
  }

  /**
   *  INTERNALS
   */


  /**
   *
   * @param path
   * @param modifiersString
   * @returns {string}
   * @private
   */
  _dbHandle(path: string = '', modifiersString: string = '') {
    return `${path}|${modifiersString}`;
  }


  /**
   *
   * @param event
   * @private
   */
  _handleDatabaseEvent(event: Object) {
    const body = event.body || {};
    const { path, modifiersString, eventName, snapshot } = body;
    const handle = this._handle(path, modifiersString);

    this.log.debug('_handleDatabaseEvent: ', handle, eventName, snapshot && snapshot.key);

    if (this.subscriptions[handle] && this.subscriptions[handle][eventName]) {
      this.subscriptions[handle][eventName].forEach((cb) => {
        if (isFunction(cb)) cb(new Snapshot(this, snapshot), body);
      });
    } else {
      FirestackDatabase.off(path, modifiersString, eventName, () => {
        this.log.debug('_handleDatabaseEvent: No JS listener registered, removed native listener', handle, eventName);
      });
    }
  }

  /**
   *
   * @param err
   * @private
   */
  _handleDatabaseError(err: Object) {
    this.log.debug('_handleDatabaseError ->', err);
  }
}
