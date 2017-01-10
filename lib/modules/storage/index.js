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
    this.refs = {};
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

  _addListener(evt: string, cb: (evt: Object) => Object): {remove: () => void} {
    return FirestackStorageEvt.addListener(evt, cb);
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

