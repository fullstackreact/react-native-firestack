/**
 * @flow
 * Database representation wrapper
 */
'use strict';
import { NativeModules, NativeEventEmitter } from 'react-native';
const FirestackDatabase = NativeModules.FirestackDatabase;
const FirestackDatabaseEvt = new NativeEventEmitter(FirestackDatabase);

import { promisify } from './../../utils';

import { Base } from './../base';
import Reference from './reference.js';
import Snapshot from './snapshot.js';

/**
 * @class Database
 */
export default class Database extends Base {
  constructor(firestack: Object, options: Object = {}) {
    super(firestack, options);
    this.log.debug('Created new Database instance', this.options);

    this.persistenceEnabled = false;
    this.successListener = FirestackDatabaseEvt
      .addListener(
        'database_event',
        event => this.handleDatabaseEvent(event));
    this.errorListener = FirestackDatabaseEvt
      .addListener(
        'database_error',
        err => this.handleDatabaseError(err));

    this.dbSubscriptions = {};
  }

  ref(...path: Array<string>) {
    return new Reference(this, path);
  }

  setPersistence(enable: boolean = true) {
    let promise;
    if (this.persistenceEnabled !== enable) {
      this.log.debug(`${enable ? 'Enabling' : 'Disabling'} persistence`);
      promise = this.whenReady(promisify('enablePersistence', FirestackDatabase)(enable));
      this.persistenceEnabled = enable;
    } else {
      promise = this.whenReady(Promise.resolve({ status: 'Already enabled' }))
    }

    return promise;
  }

  handleDatabaseEvent(event: Object) {
    const body = event.body || {};
    const { path, modifiersString, eventName, snapshot } = body;
    const dbHandle = this._dbHandle(path, modifiersString);
    this.log.debug('handleDatabaseEvent: ', dbHandle, eventName, snapshot && snapshot.key);

    if (this.dbSubscriptions[dbHandle] && this.dbSubscriptions[dbHandle][eventName]) {
      this.dbSubscriptions[dbHandle][eventName].forEach(cb => {
        if (cb && typeof(cb) === 'function') {
          const snap = new Snapshot(this, snapshot);
          cb(snap, body);
        }
      })
    } else {
      FirestackDatabase.off(path, modifiersString, eventName, () => {
        this.log.debug('handleDatabaseEvent: No JS listener registered, removed native listener', dbHandle, eventName);
      });
    }
  }

  handleDatabaseError(err: Object) {
    this.log.debug('handleDatabaseError ->', err);
  }

  on(path: string, modifiersString: string, modifiers: Array<string>, eventName: string, cb: () => void) {
    const dbHandle = this._dbHandle(path, modifiersString);
    this.log.debug('adding on listener', dbHandle);
    
    if (this.dbSubscriptions[dbHandle]) {
      if (this.dbSubscriptions[dbHandle][eventName]) {
        this.dbSubscriptions[dbHandle][eventName].push(cb);
      } else {
        this.dbSubscriptions[dbHandle][eventName] = [cb];
      }
    } else {
      this.dbSubscriptions[dbHandle] = {
        [eventName]: [cb]
      }
    }

    return promisify('on', FirestackDatabase)(path, modifiersString, modifiers, eventName);
  }

  off(path: string, modifiersString: string, eventName?: string, origCB?: () => void) {
    const dbHandle = this._dbHandle(path, modifiersString);
    this.log.debug('off() : ', dbHandle, eventName);

    if (!this.dbSubscriptions[dbHandle]
      || (eventName && !this.dbSubscriptions[dbHandle][eventName])) {
      this.log.warn('off() called, but not currently listening at that location (bad path)', dbHandle, eventName);
      return Promise.resolve();
    }

    if (eventName && origCB) {
      const i = this.dbSubscriptions[dbHandle][eventName].indexOf(origCB);
      if (i === -1) {
        this.log.warn('off() called, but the callback specifed is not listening at that location (bad path)', dbHandle, eventName);
        return Promise.resolve();
      } else {
        this.dbSubscriptions[dbHandle][eventName] = this.dbSubscriptions[dbHandle][eventName].splice(i, 1);
        if (this.dbSubscriptions[dbHandle][eventName].length > 0) {
          return Promise.resolve();
        }
      }
    } else if (eventName) {
      this.dbSubscriptions[dbHandle][eventName] = [];
    } else {
      this.dbSubscriptions[dbHandle] = {}
    }
    return promisify('off', FirestackDatabase)(path, modifiersString, eventName);
  }

  cleanup() {
    let promises = [];
    Object.keys(this.dbSubscriptions).forEach(dbHandle => {
      Object.keys(this.dbSubscriptions[dbHandle]).forEach(eventName => {
        let separator = dbHandle.indexOf('|');
        let path = dbHandle.substring(0, separator);
        let modifiersString = dbHandle.substring(separator + 1);
        
        promises.push(this.off(path, modifiersString, eventName))
      })
    })
    return Promise.all(promises);
  }

  _dbHandle(path: string = '', modifiersString: string = '') {
    return path + '|' + modifiersString;
  }

  goOnline() {
    FirestackDatabase.goOnline();
  }

  goOffline() {
    FirestackDatabase.goOffline();
  }

  get namespace(): string {
    return 'firestack:database';
  }
}
