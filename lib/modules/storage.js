
import {NativeModules, NativeEventEmitter} from 'react-native';
const FirestackStorage = NativeModules.FirestackStorage;
const FirestackStorageEvt = new NativeEventEmitter(FirestackStorage);

import promisify from '../promisify'
import { Base } from './base'

export class Storage extends Base {
  constructor(firestack, options={}) {
    super(firestack, options);

    if (this.options.storageBucket) {
      this.setStorageUrl(this.options.storageBucket);
    }

    this._addToFirestackInstance(
      'uploadFile'
    )
  }
  
  /**
   * Upload a filepath
   * @param  {string} name     The destination for the file
   * @param  {string} filepath The local path of the file
   * @param  {object} metadata An object containing metadata
   * @return {Promise}
   */
  uploadFile(name, filepath, metadata) {
    return 
      promisify('uploadFile', FirestackStorageEvt)(this.storageUrl, name, filepath, metadata);
  }

  setStorageUrl(url) {
    // return promisify('setStorageUrl', FirestackStorage)(url);
    this.storageUrl = url;
  }

  get namespace() {
    return 'firestack:storage'
  }
}

export default Storage