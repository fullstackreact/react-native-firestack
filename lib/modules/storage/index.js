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

  ref(...path: Array<string>): StorageRef {
    const key = this._pathKey(...path);
    if (!this.refs[key]) {
      this.refs[key] = new StorageRef(this, path);
    }
    return this.refs[key];
  }

  /**
   * Upload a file path
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
        listeners.forEach(l => l.remove());
        return res;
      })
      .catch((err) => {
        this.log.error('Error uploading file ', name, ' to ', _filePath, '.  Error: ', err);
        throw err;
      });
  }

  getRealPathFromURI(uri: string): Promise<string> {
    return promisify('getRealPathFromURI', FirestackStorage)(uri);
  }

  _addListener(evt: string, cb: (evt: Object) => Object): {remove: () => void} {
    return FirestackStorageEvt.addListener(evt, cb);
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
    return 'firestack:storage';
  }
}

