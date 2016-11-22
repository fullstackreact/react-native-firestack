/**
 * @flow
 */
import { NativeModules, NativeEventEmitter, AsyncStorage } from 'react-native';

import Log from '../utils/log'
import EventEmitter from './../utils/eventEmitter';

const FirestackModule = NativeModules.Firestack;
const FirestackModuleEvt = new NativeEventEmitter(FirestackModule);

const logs = {};

type FirestackOptions = {};
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
    if (!logs[this.namespace]) {
      const debug = this.firestack._debug;
      logs[this.namespace] = new Log(this.namespace, debug);
    }
    return logs[this.namespace];
  }

  // TODO unused - do we need this anymore?
  _addConstantExports(constants) {
    Object.keys(constants).forEach(name => {
      FirestackModule[name] = constants[name];
    });
  }

  // TODO unused - do we need this anymore?
  _addToFirestackInstance(...methods: Array<string>) {
    methods.forEach(name => {
      this.firestack[name] = this[name].bind(this);
    })
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

  get namespace(): string {
    return 'firestack:base';
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
    })
  }

  _off(name) {
    return new Promise((resolve) => {
      if (this.eventHandlers[name]) {
        const subscription = this.eventHandlers[name];
        subscription.remove(); // Remove subscription
        delete this.eventHandlers[name];
        resolve(subscription)
      }
    });
  }
}

export class ReferenceBase extends Base {
  constructor(firestack: Object, path: Array<string> | string) {
    super(firestack);

    this.path = Array.isArray(path) ?  path : (typeof path == 'string' ?  [path] : []);

    // sanitize path, just in case
    this.path = this.path.filter(str => str !== '');
  }

  get key(): string {
    const path = this.path;
    return path.length === 0 ? '/' : path[path.length - 1];
  }

  pathToString(): string {
    let path = this.path;
    let pathStr = (path.length > 0 ? path.join('/') : '/');
    if (pathStr[0] != '/') {
      pathStr = `/${pathStr}`
    }
    return pathStr;
  }
}
