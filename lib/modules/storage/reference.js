/* @flow */
import { NativeModules } from 'react-native';

import { promisify, noop } from '../../utils';
import { ReferenceBase } from './../base';
import Storage from './';

const FirestackStorage = NativeModules.FirestackStorage;

export default class StorageRef extends ReferenceBase {
  constructor(storage: Storage, path: Array<string>) {
    super(storage.firestack, path);

    this.storage = storage;
  }

  downloadUrl(): Promise<Object> {
    const path = this.pathToString();
    this.log.debug('downloadUrl(', path, ')');
    return promisify('downloadUrl', FirestackStorage)(path)
      .catch((err) => {
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
        listeners.forEach(l => l.remove());
        return res;
      })
      .catch((err) => {
        this.log.error('Error downloading ', path, ' to ', downloadPath, '.  Error: ', err);
        throw err;
      });
  }
}
