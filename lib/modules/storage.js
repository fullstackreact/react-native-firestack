/* @flow */
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

  downloadUrl(): Promise<Object> {
    const path = this.pathToString();
    this.log.debug('downloadUrl(', path, ')');
    return promisify('downloadUrl', FirestackStorage)(path)
      .catch(err => {
        this.log.error('Error downloading URL for ', path, '.  Error: ', err);
        throw err;
      });
  }

  /**
   * Downloads a reference to the device
   * @param {String} downloadPath Where to store the file
   * @param listener
   * @return {Promise}
   */
  download(downloadPath: string, listener: Function = noop): Promise<Object> {
    const path = this.pathToString();
    this.log.debug('download(', path, ') -> ', downloadPath);
    const listeners = [
      this.storage._addListener('download_progress', listener),
      this.storage._addListener('download_paused', listener),
      this.storage._addListener('download_resumed', listener),
    ];

    return promisify('downloadFile', FirestackStorage)(path, downloadPath)
      .then((res) => {
        this.log.debug('res --->', res);
        listeners.forEach(listener => listener.remove());
        return res;
      })
      .catch(err => {
        this.log.error('Error downloading ', path, ' to ', downloadPath, '.  Error: ', err);
        throw err;
      });
  }
}

type StorageOptionsType = {
  storageBucket?: ?string,
};
export default class Storage extends Base {
  constructor(firestack: Object, options:StorageOptionsType={}) {
    super(firestack, options);
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
   * @param  {string} filePath The local path of the file
   * @param  {object} metadata An object containing metadata
   * @param listener
   * @return {Promise}
   */
  uploadFile(name: string, filePath: string, metadata: Object = {}, listener: Function = noop): Promise<Object> {
    const _filePath = filePath.replace('file://', '');
    this.log.debug('uploadFile(', _filePath, ') -> ', name);
    const listeners = [
      this._addListener('upload_paused', listener),
      this._addListener('upload_resumed', listener),
      this._addListener('upload_progress', listener),
    ];

    return promisify('uploadFile', FirestackStorage)(name, _filePath, metadata)
      .then((res) => {
        listeners.forEach(listener => listener.remove());
        return res;
      })
      .catch(err => {
        this.log.error('Error uploading file ', name, ' to ', _filePath, '.  Error: ', err);
        throw err;
      });
  }

  getRealPathFromURI(uri: string): Promise<string> {
    return promisify('getRealPathFromURI', FirestackStorage)(uri);
  }

  _addListener(evt: string, cb: (evt: Object) => Object): {remove: () => void} {
    let listener = FirestackStorageEvt.addListener(evt, cb);
    return listener;
  }

  _pathKey(...path: Array<string>): string {
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

  get namespace(): string {
    return 'firestack:storage'
  }
}

