/* @flow */
import { NativeModules, NativeEventEmitter } from 'react-native';

import { Base } from './../base';
import StorageRef from './reference';
import { promisify, noop } from './../../utils';

const FirestackStorage = NativeModules.FirestackStorage;
const FirestackStorageEvt = new NativeEventEmitter(FirestackStorage);

type StorageOptionsType = {
  storageBucket?: ?string,
};

export default class Storage extends Base {
  constructor(firestack: Object, options: StorageOptionsType = {}) {
    super(firestack, options);
    this.subscriptions = {};

    this.successListener = FirestackStorageEvt.addListener(
      'storage_event',
      event => this._handleStorageEvent(event)
    );

    this.errorListener = FirestackStorageEvt.addListener(
      'storage_error',
      err => this._handleStorageError(err)
    );
  }

  ref(path: string): StorageRef {
    return new StorageRef(this, path);
  }

  refFromURL(url: string): Promise<StorageRef> { 
    return new StorageRef(this, `url::${url}`);
  }

  setMaxOperationRetryTime(time: number) {
    FirestackStorage.setMaxOperationRetryTime(time);
  }

  setMaxUploadRetryTime(time: number) {
    FirestackStorage.setMaxUploadRetryTime(time);
  }

  //Additional methods compared to Web API
  setMaxDownloadRetryTime(time: number) {
    FirestackStorage.setMaxDownloadRetryTime(time);
  }

  _handleStorageEvent(event: Object) {
    const { path, eventName } = event;
    const body = event.body || {};

    this.log.debug('_handleStorageEvent: ', path, eventName, body);

    if (this.subscriptions[path] && this.subscriptions[path][eventName]) {
      this.subscriptions[path][eventName].forEach((cb) => {
        cb(body);
      })
    }
  }

  _handleStorageError(err: Object) {
    this.log.debug('_handleStorageError ->', err);
  }

  _addListener(path: string, eventName: string, cb: (evt: Object) => Object) {
    if (!this.subscriptions[path]) this.subscriptions[path] = {};
    if (!this.subscriptions[path][eventName]) this.subscriptions[path][eventName] = [];
    this.subscriptions[path][eventName].push(cb);
  }

  _removeListener(path: string, eventName: string, origCB: (evt: Object) => Object) {
    if (this.subscriptions[path] && this.subscriptions[path][eventName]) {
      const i = this.subscriptions[path][eventName].indexOf(origCB);

      if (i === -1) {
        this.log.warn('_removeListener() called, but the callback specified is not listening at this location (bad path)', path, eventName);
      } else {
        this.subscriptions[path][eventName].splice(i, 1);
      }
    } else {
      this.log.warn('_removeListener() called, but there are no listeners at this location (bad path)', path, eventName);
    }
  }

  static constants = {
    MAIN_BUNDLE_PATH: FirestackStorage.MAIN_BUNDLE_PATH,
    CACHES_DIRECTORY_PATH: FirestackStorage.CACHES_DIRECTORY_PATH,
    DOCUMENT_DIRECTORY_PATH: FirestackStorage.DOCUMENT_DIRECTORY_PATH,
    EXTERNAL_DIRECTORY_PATH: FirestackStorage.EXTERNAL_DIRECTORY_PATH,
    EXTERNAL_STORAGE_DIRECTORY_PATH: FirestackStorage.EXTERNAL_STORAGE_DIRECTORY_PATH,
    TEMP_DIRECTORY_PATH: FirestackStorage.TEMP_DIRECTORY_PATH,
    LIBRARY_DIRECTORY_PATH: FirestackStorage.LIBRARY_DIRECTORY_PATH,
    FILETYPE_REGULAR: FirestackStorage.FILETYPE_REGULAR,
    FILETYPE_DIRECTORY: FirestackStorage.FILETYPE_DIRECTORY,
  };

  get namespace(): string {
    return 'firestack:storage';
  }
}

