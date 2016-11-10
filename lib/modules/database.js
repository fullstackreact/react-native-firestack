/**
 * @flow
 * Database representation wrapper
 */
'use strict';
import {NativeModules, NativeEventEmitter} from 'react-native';
const FirestackDatabase = NativeModules.FirestackDatabase;
const FirestackDatabaseEvt = new NativeEventEmitter(FirestackDatabase);

import promisify from '../utils/promisify';
import { Base, ReferenceBase } from './base';
import DatabaseSnapshot from './databaseSnapshot.js';
import DatabaseRef from './databaseReference.js';
import DataSnapshot from './databaseSnapshot.js';


function getModifiersString(modifiers) {
  if (!modifiers || !Array.isArray(modifiers)) {
    return '';
  }
  return modifiers.join('|');
}

export class Database extends Base {

  constructor(firestack: Object, options: Object={}) {
    super(firestack, options);
    this.log.debug('Created new Database instance', this.options);

    this.persistenceEnabled = false;
    this.successListener = null;
    this.errorListener = null;
    this.refs = {};
    this.dbSubscriptions = {}; // { path: { modifier: { eventType: [Subscriptions] } } }
  }

  ref(...path: Array<string>) {
    return new DatabaseRef(this, path);
  }

  storeRef(key: string, instance: DatabaseRef): Promise<DatabaseRef> {
    if (!this.refs[key]) {
      this.refs[key] = instance;
    }
    return Promise.resolve(this.refs[key]);
  }

  unstoreRef(key: string): Promise<void> {
    if (this.refs[key]) {
      delete this.refs[key];
    }
    return Promise.resolve();
  }

  setPersistence(enable: boolean=true) {
    let promise;
    if (this.persistenceEnabled !== enable) {
      this.log.debug(`${enable ? 'Enabling' : 'Disabling'} persistence`);
      promise = this.whenReady(promisify('enablePersistence', FirestackDatabase)(enable));
      this.persistenceEnabled = enable;
    } else {
      promise = this.whenReady(Promise.resolve({status: 'Already enabled'}))
    }

    return promise;
  }

  handleDatabaseEvent(evt: Object) {
    const body = evt.body || {};
    const path = body.path;
    const modifiersString = body.modifiersString || '';
    const modifier = modifiersString;
    const eventName = body.eventName;
    this.log.debug('handleDatabaseEvent: ', path, modifiersString, eventName, body.snapshot && body.snapshot.key);

    // subscriptionsMap === { path: { modifier: { eventType: [Subscriptions] } } }
    const modifierMap = this.dbSubscriptions[path];
    if (modifierMap) {
      const eventTypeMap = modifierMap[modifier];
      if (eventTypeMap) {
        const callbacks = eventTypeMap[eventName] || [];
        this.log.debug(' -- about to fire its '+callbacks.length+' callbacks');
        callbacks.forEach(cb => {
          if (cb && typeof(cb) === 'function') {
            const snap = new DataSnapshot(this, body.snapshot);
            cb(snap, body);
          }
        });
      }
    }
  }

  handleDatabaseError(evt: Object) {
    this.log.debug('handleDatabaseError ->', evt);
  }

  on(referenceKey: string, path: string, modifiers: Array<string>, evt: string, cb: () => void) {
    this.log.debug('adding on listener', referenceKey, path, modifiers, evt);
    const key = this._pathKey(path);
    const modifiersString = getModifiersString(modifiers);
    const modifier = modifiersString;

    if (!this.dbSubscriptions[key]) {
      this.dbSubscriptions[key] = {};
    }

    if (!this.dbSubscriptions[key][modifier]) {
      this.dbSubscriptions[key][modifier] = {};
    }

    if (!this.dbSubscriptions[key][modifier][evt]) {
      this.dbSubscriptions[key][modifier][evt] = [];
    }

    this.dbSubscriptions[key][modifier][evt].push(cb);

    if (!this.successListener) {
      this.successListener = FirestackDatabaseEvt
        .addListener(
          'database_event',
          this.handleDatabaseEvent.bind(this));
    }

    if (!this.errorListener) {
      this.errorListener = FirestackDatabaseEvt
        .addListener(
          'database_error',
          this.handleDatabaseError.bind(this));
    }

    const subscriptions = [this.successListener, this.errorListener];
    return promisify('on', FirestackDatabase)(path, modifiersString, modifiers, evt).then(() => {
      return subscriptions;
    });
  }

  off(path: string, modifiers: Array<string>, eventName: string, origCB?: () => void) {
    const pathKey = this._pathKey(path);
    const modifiersString = getModifiersString(modifiers);
    const modifier = modifiersString;
    console.log('off() : ', pathKey, modifiersString, eventName);
    // Remove subscription
    if (this.dbSubscriptions[pathKey]) {

      if (!eventName || eventName === '') {
        // remove all listeners for this pathKey
        this.dbSubscriptions[pathKey] = {};
      }

      if (this.dbSubscriptions[pathKey][modifier]) {
        if (this.dbSubscriptions[pathKey][modifier][eventName]) {
          if (origCB) {
            // remove only the given callback
            this.dbSubscriptions[pathKey][modifier][eventName].splice(this.dbSubscriptions[pathKey][modifier][eventName].indexOf(origCB), 1);
          }
          else {
            // remove all callbacks for this path:modifier:eventType
            delete this.dbSubscriptions[pathKey][modifier][eventName];
          }
        }
      }

      if (Object.keys(this.dbSubscriptions[pathKey]).length <= 0) {
        // there are no more subscriptions so we can unwatch
        delete this.dbSubscriptions[pathKey];
      }
      if (Object.keys(this.dbSubscriptions).length === 0) {
        if (this.successListener) {
          this.successListener.remove();
          this.successListener = null;
        }
        if (this.errorListener) {
          this.errorListener.remove();
          this.errorListener = null;
        }
      }
    }

    const subscriptions = [this.successListener, this.errorListener];

    let modifierMap = this.dbSubscriptions[path];
    if (modifierMap && modifierMap[modifier] && modifierMap[modifier][eventName] && modifierMap[modifier][eventName].length > 0) {
      return Promise.resolve(subscriptions);
    }

    return promisify('off', FirestackDatabase)(path, modifiersString, eventName).then(() => {
      // subscriptions.forEach(sub => sub.remove());
      // delete this.listeners[eventName];
      return subscriptions;
    });
  }

  cleanup() {
    let promises = Object.keys(this.refs)
                          .map(key => this.refs[key])
                          .map(ref => ref.cleanup());
    return Promise.all(promises);
  }

  release(...path: Array<string>) {
    const key = this._pathKey(...path);
    if (this.refs[key]) {
      delete this.refs[key];
    }
  }

  _pathKey(...path: Array<string>): string {
    return path.join('-');
  }

  get namespace(): string {
    return 'firestack:database';
  }
}
