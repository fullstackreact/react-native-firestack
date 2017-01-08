/* @flow */
import { NativeModules } from 'react-native';

import { promisify, noop } from '../../utils';
import { ReferenceBase } from './../base';
import Storage from './';

const FirestackStorage = NativeModules.FirestackStorage;

export default class StorageRef extends ReferenceBase {
  constructor(storage: Storage, path: string) {
    super(storage.firestack, path);
    this.storage = storage;
  }

  downloadUrl(): Promise<Object> {
    this.log.debug('downloadUrl(', this.path, ')');
    return promisify('downloadUrl', FirestackStorage)(this.path)
      .catch((err) => {
        this.log.error('Error downloading URL for ', this.path, '.  Error: ', err);
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
    this.log.debug('download(', this.path, ') -> ', downloadPath);
    const listeners = [
      this.storage._addListener('download_progress', listener),
      this.storage._addListener('download_paused', listener),
      this.storage._addListener('download_resumed', listener),
    ];

    return promisify('downloadFile', FirestackStorage)(this.path, downloadPath)
      .then((res) => {
        this.log.debug('res --->', res);
        listeners.forEach(l => l.remove());
        return res;
      })
      .catch((err) => {
        this.log.error('Error downloading ', this.path, ' to ', downloadPath, '.  Error: ', err);
        throw err;
      });
  }
}
