/* @flow */

import {NativeModules, NativeEventEmitter} from 'react-native';
const FirestackStorage = NativeModules.FirestackStorage;
const FirestackStorageEvt = new NativeEventEmitter(FirestackStorage);

import promisify from '../utils/promisify'
import { Base, ReferenceBase } from './base'

class StorageRef extends ReferenceBase {
  constructor(storage, path) {
    super(storage.firestack, path);

    this.storage = storage;
  }

  downloadUrl(): Promise<Object> {
    const path = this.pathToString();
    return promisify('downloadUrl', FirestackStorage)(this.storage.storageUrl, path);
  }

  /**
   * Downloads a reference to the device
   * @param {String} downloadPath Where to store the file
   * @return {Promise}
   */
  download (downloadPath: string, cb: (evt: Object) => Object): Promise<Object> {
    let callback = cb;
    if (!callback || typeof callback !== 'function') {
      callback = (evt) => {};
    }

    const listeners = [];
    listeners.push(this.storage._addListener('download_progress', callback));
    listeners.push(this.storage._addListener('download_paused', callback));
    listeners.push(this.storage._addListener('download_resumed', callback));

    const path = this.pathToString();
    return promisify('downloadFile', FirestackStorage)(this.storage.storageUrl, path, downloadPath)
      .then((res) => {
        console.log('res --->', res);
        listeners.forEach(listener => listener.remove());
        return res;
      })
      .catch(err => {
        console.log('Got an error ->', err);
      })
  }
}

type StorageOptionsType = {
  storageBucket?: ?string,
};
export default class Storage extends Base {
  constructor(firestack: Object, options:StorageOptionsType={}) {
    super(firestack, options);

    if (this.options.storageBucket) {
      this.setStorageUrl(this.options.storageBucket);
    }

    this.refs = {};
  }

  ref(...path: Array<string>): StorageRef {
    const key = this._pathKey(...path);
    if (!this.refs[key]) {
      const ref = new StorageRef(this, path);
      this.refs[key] = ref;
    }
    return this.refs[key];
  }

  /**
   * Upload a filepath
   * @param  {string} name     The destination for the file
   * @param  {string} filepath The local path of the file
   * @param  {object} metadata An object containing metadata
   * @return {Promise}
   */
  uploadFile(name: string, filepath: string, metadata: Object={}, cb: (evt: Object) => Object): Promise<Object> {
    let callback = cb;
    if (!callback || typeof callback !== 'function') {
      callback = (evt: Object) => ({});
    }

    filepath = filepath.replace("file://", "");

    const listeners = [];
    listeners.push(this._addListener('upload_progress', callback));
    listeners.push(this._addListener('upload_paused', callback));
    listeners.push(this._addListener('upload_resumed', callback));
    return promisify('uploadFile', FirestackStorage)(this.storageUrl, name, filepath, metadata)
      .then((res) => {
        listeners.forEach(listener => listener.remove());
        return res;
      });
  }

  getRealPathFromURI(uri: string): Promise<string> {
    return promisify('getRealPathFromURI', FirestackStorage)(uri);
  }

  _addListener(evt: string, cb: (evt: Object) => Object): {remove: () => void} {
    let listener = FirestackStorageEvt.addListener(evt, cb);
    return listener;
  }

  setStorageUrl(url: string): void {
    // return promisify('setStorageUrl', FirestackStorage)(url);
    this.storageUrl = `gs://${url}`;
  }

  _pathKey(...path: Array<string>): string {
    return path.join('-');
  }

  static constants = {
      'MAIN_BUNDLE_PATH': FirestackStorage.MAIN_BUNDLE_PATH,
      'CACHES_DIRECTORY_PATH': FirestackStorage.CACHES_DIRECTORY_PATH,
      'DOCUMENT_DIRECTORY_PATH': FirestackStorage.DOCUMENT_DIRECTORY_PATH,
      'EXTERNAL_DIRECTORY_PATH': FirestackStorage.EXTERNAL_DIRECTORY_PATH,
      'EXTERNAL_STORAGE_DIRECTORY_PATH': FirestackStorage.EXTERNAL_STORAGE_DIRECTORY_PATH,
      'TEMP_DIRECTORY_PATH': FirestackStorage.TEMP_DIRECTORY_PATH,
      'LIBRARY_DIRECTORY_PATH': FirestackStorage.LIBRARY_DIRECTORY_PATH,
      'FILETYPE_REGULAR': FirestackStorage.FILETYPE_REGULAR,
      'FILETYPE_DIRECTORY': FirestackStorage.FILETYPE_DIRECTORY
  };

  get namespace(): string {
    return 'firestack:storage'
  }
}

