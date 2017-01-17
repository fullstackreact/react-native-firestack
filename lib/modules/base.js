/**
 * @flow
 */
import { NativeModules, NativeEventEmitter } from 'react-native';

import Log from '../utils/log';
import EventEmitter from './../utils/eventEmitter';

const FirestackModule = NativeModules.Firestack;
const FirestackModuleEvt = new NativeEventEmitter(FirestackModule);

const logs = {};

// single event emitter for all classes extending base
// TODO
// const EE = new EventEmitter();

type FirestackOptions = {};

// TODO cleanup
export class Base extends EventEmitter {
  constructor(firestack: Object, options: FirestackOptions = {}) {
    super();
    this.firestack = firestack;
    this.eventHandlers = {};

    // Extend custom options with default options
    this.options = Object.assign({}, firestack.options, options);
  }


  // Logger
  get log(): Log {
    if (!logs[this.namespace]) logs[this.namespace] = new Log(this.namespace, this.firestack._debug);
    return logs[this.namespace];
  }

  /**
   * app instance
   **/
  get app(): Object {
    return this.firestack.app;
  }

  whenReady(promise: Promise<*>): Promise<*> {
    return this.firestack.configurePromise.then((result) => {
      return promise;
    });
  }

  // Event handlers
  // proxy to firestack instance
  _on(name, cb, nativeModule) {
    return new Promise((resolve) => {
      // if (!this.eventHandlers[name]) {
      //   this.eventHandlers[name] = {};
      // }
      if (!nativeModule) {
        nativeModule = FirestackModuleEvt;
      }
      const sub = nativeModule.addListener(name, cb);
      this.eventHandlers[name] = sub;
      resolve(sub);
    });
  }

  _off(name) {
    return new Promise((resolve) => {
      if (this.eventHandlers[name]) {
        const subscription = this.eventHandlers[name];
        subscription.remove(); // Remove subscription
        delete this.eventHandlers[name];
        resolve(subscription);
      }
    });
  }
}

export class ReferenceBase extends Base {
  constructor(firestack: Object, path: string) {
    super(firestack);
    this.path = path || '/';
  }

  get key(): string {
    return this.path === '/' ? null : this.path.substring(this.path.lastIndexOf('/') + 1);
  }
}
