import { NativeModules, NativeEventEmitter } from 'react-native';

import { promisify, noop } from '../utils';
import { Base, ReferenceBase } from './base';

const FirestackStorage = NativeModules.FirestackStorage;
const FirestackStorageEvt = new NativeEventEmitter(FirestackStorage);

class StorageRef extends ReferenceBase {
  constructor(storage, path) {
    super(storage.firestack, path);

    this.storage = storage;
  }

  downloadUrl() {
    const path = this.pathToString();
    return promisify('downloadUrl', FirestackStorage)(this.storage.storageUrl, path);
  }

  /**
   * Downloads a reference to the device
   * @param {String} downloadPath Where to store the file
   * @param listener
   * @return {Promise}
   */
  download(downloadPath: string, listener: Function = noop) {
    const path = this.pathToString();
    const listeners = [
      this.storage._addListener('download_progress', listener),
      this.storage._addListener('download_paused', listener),
      this.storage._addListener('download_resumed', listener),
    ];

    return promisify('downloadFile', FirestackStorage)(this.storage.storageUrl, path, downloadPath)
      .then((res) => {
        console.log('res --->', res);
        listeners.forEach(this.storage._removeListener);
        return res;
      })
      .catch((downloadError) => {
        console.log('Got an error ->', downloadError);
        return Promise.reject(downloadError);
      });
  }
}

export default class Storage extends Base {
  constructor(firestack, options = {}) {
    super(firestack, options);

    if (this.options.storageBucket) {
      this.setStorageUrl(this.options.storageBucket);
    }

    this.refs = {};
  }

  ref(...path) {
    const key = this._pathKey(path);
    if (!this.refs[key]) {
      const ref = new StorageRef(this, path);
      this.refs[key] = ref;
    }
    return this.refs[key];
  }

  /**
   * Upload a filepath
   * @param  {string} name     The destination for the file
   * @param  {string} filePath The local path of the file
   * @param  {object} metadata An object containing metadata
   * @param listener
   * @return {Promise}
   */
  uploadFile(name: string, filePath: string, metadata: Object = {}, listener: Function = noop) {
    const _filePath = filePath.replace('file://', '');
    const listeners = [
      this._addListener('upload_paused', listener),
      this._addListener('upload_resumed', listener),
      this._addListener('upload_progress', listener),
    ];

    return promisify('uploadFile', FirestackStorage)(this.storageUrl, name, _filePath, metadata)
      .then((res) => {
        listeners.forEach(this._removeListener);
        return res;
      });
  }

  getRealPathFromURI(uri) {
    return promisify('getRealPathFromURI', FirestackStorage)(uri);
  }

  _addListener(evt, cb) {
    return FirestackStorageEvt.addListener(evt, cb);
  }

  _removeListener(evt) {
    return FirestackStorageEvt.removeListener(evt);
  }

  setStorageUrl(url) {
    // return promisify('setStorageUrl', FirestackStorage)(url);
    this.storageUrl = `gs://${url}`;
  }

  _pathKey(...path) {
    return path.join('-');
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

  get namespace() {
    return 'firestack:storage';
  }
}

