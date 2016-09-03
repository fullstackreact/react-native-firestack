/**
 * @providesModule Firestack
 * @flow
 */
import Log from '../log'

import {NativeModules, NativeEventEmitter, AsyncStorage} from 'react-native';
const FirestackModule = NativeModules.Firestack;
const FirestackModuleEvt = new NativeEventEmitter(FirestackModule);

import promisify from '../promisify'

let logs = {};
export class Base {
  constructor(firestack, options={}) {
    this.firestack = firestack;
    this.eventHandlers = {};

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
  _on(name, cb, nativeModule) {
    console.log('on ->', name);
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

  _off(name) {
    console.log('off ->', name);
    if (this.eventHandlers[name]) {
      this.eventHandlers[name]
        .forEach(subscription => subscription.remove());
    }
  }
}