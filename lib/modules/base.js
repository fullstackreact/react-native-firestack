/**
 * @providesModule Firestack
 * @flow
 */
import Log from '../log'

const firebase = require('firebase');

const app = require('firebase/app');
const db = require('firebase/database');
const storage = require('firebase/storage');

import {NativeModules, NativeAppEventEmitter, AsyncStorage} from 'react-native';
const FirebaseHelper = NativeModules.Firestack;

import promisify from '../promisify'

let logs = {};
export class Base {
  constructor(firestack, options={}) {
    this.firestack = firestack;

    // Extend custom options with default options
    this.options = Object.assign({}, firestack.options, options);
    
    this.log.debug('Created new instance with options', options);
  }

  // Logger
  get log() {
    if (!logs[this.namespace]) {
      logs[this.namespace] = new Log(this.namespace, this._debug);
    }
    return logs[this.namespace];
  }

  _addToFirestackInstance(...methods) {
    methods.forEach(name => {
      this.log.debug('Adding method to firestack instance', name);
      this.firestack[name] = this[name].bind(this);
    })
  }

  /**
   * app instance
   **/
  get app() {
    return this.firestack.app;
  }

  get namespace() {
    return 'firestack:base';
  }

  // Event handlers
  // proxy to firestack instance
  on(...args) {
    this.firestack.on(...args);
  }

  off(...args) {
    this.firestack.off(...args);
  }
}