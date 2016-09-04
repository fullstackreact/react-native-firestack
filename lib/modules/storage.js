
import {NativeModules, NativeEventEmitter} from 'react-native';
const FirestackStorage = NativeModules.FirestackStorage;
const FirestackStorageEvt = new NativeEventEmitter(FirestackStorage);

import promisify from '../promisify'
import { Base, ReferenceBase } from './base'

class StorageRef extends ReferenceBase {
  constructor(storage, path) {
    super(storage.firestack, path);

    this.storageUrl = storage.storageUrl;
  }

  downloadUrl() {
    const path = this.pathToString();
    return promisify('downloadUrl', FirestackStorage)(this.storageUrl, path);
  }
}

export class Storage extends Base {
  constructor(firestack, options={}) {
    super(firestack, options);

    if (this.options.storageBucket) {
      this.setStorageUrl(this.options.storageBucket);
    }

    this.refs = {};

    this._addToFirestackInstance(
      'uploadFile'
    )
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
   * @param  {string} filepath The local path of the file
   * @param  {object} metadata An object containing metadata
   * @return {Promise}
   */
  uploadFile(name, filepath, metadata={}, cb) {
    let callback = cb;
    if (!callback || typeof callback !== 'function') {
      callback = (evt) => {}
    }

    filepath = filepath.replace("file://", "");

    const listeners = [];
    listeners.push(this._addListener('upload_progress', callback));
    listeners.push(this._addListener('upload_paused', callback));
    listeners.push(this._addListener('upload_resumed', callback));
    return promisify('uploadFile', FirestackStorage)(this.storageUrl, name, filepath, metadata)
      .then((res) => {
        listeners.forEach(this._removeListener);
        return res;
      });
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

  get namespace() {
    return 'firestack:storage'
  }
}

export default Storage