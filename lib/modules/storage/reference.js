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

  child(path: string) {
    return new StorageRef(this.storage, this.path + '/' + path);
  }

  delete(): Promise {
    return promisify('delete', FirestackStorage)(this.path)
      .catch(err => {
        this.log.error('Error deleting reference ', this.path, '.  Error: ', err);
        throw err;
      })
  }

  getDownloadURL(): Promise<String> {
    this.log.debug('getDownloadURL(', this.path, ')');
    return promisify('getDownloadURL', FirestackStorage)(this.path)
      .catch((err) => {
        this.log.error('Error downloading URL for ', this.path, '.  Error: ', err);
        throw err;
      });
  }

  getMetadata(): Promise<Object> {
    return promisify('getMetadata', FirestackStorage)(this.path)
      .catch(err => {
        this.log.error('Error getting metadata for ', this.path, '.  Error: ', err);
        throw err;
      })
  }

  //TODO: Figure out the best way to do this on iOS/Android
  put(data: Object, metadata: Object = {}): /*UploadTask*/Promise<Object> {
    throw new Error('put() is not currently supported by react-native-firestack')
  }

  //TODO: Figure out the best way to do this on iOS/Android
  putString(data: string, format: String, metadata: Object = {}): /*UploadTask*/Promise<Object> {
    throw new Error('putString() is not currently supported by react-native-firestack')
  }

  toString(): String {
    //TODO: Return full gs://bucket/path
    return this.path;
  }

  updateMetadata(metadata: Object = {}): Promise<Object> {
    return promisify('updateMetadata', FirestackStorage)(this.path, metadata)
      .catch(err => {
        this.log.error('Error updating metadata for ', this.path, '.  Error: ', err);
        throw err;
      })
  }

  //Additional methods compared to Web API

  //TODO: Listeners
  /**
   * Downloads a reference to the device
   * @param {String} filePath Where to store the file
   * @param listener
   * @return {Promise}
   */
  downloadFile(filePath: string, listener: Function = noop): Promise<Object> {
    this.log.debug('download(', this.path, ') -> ', filePath);
    this.storage._addListener(this.path, 'state_changed', listener);

    return promisify('downloadFile', FirestackStorage)(this.path, filePath)
      .then((res) => {
        this.storage._removeListener(this.path, 'state_changed', listener);
        return res;
      })
      .catch((err) => {
        this.log.error('Error downloading ', this.path, ' to ', filePath, '.  Error: ', err);
        throw err;
      });
  }

  //TODO: Change to return UploadTask
  /**
   * Upload a file path
   * @param  {string} filePath The local path of the file
   * @param  {object} metadata An object containing metadata
   * @param listener
   * @return {Promise}
   */
  putFile(filePath: Object, metadata: Object = {}, listener: Function = noop): /*UploadTask*/Promise<Object> {
    const _filePath = filePath.replace('file://', '');
    this.log.debug('putFile(', _filePath, ') -> ', this.path);

    this.storage._addListener(this.path, 'state_changed', listener);

    return promisify('putFile', FirestackStorage)(this.path, _filePath, metadata)
      .then((res) => {
        this.storage._removeListener(this.path, 'state_changed', listener);
        return res;
      })
      .catch((err) => {
        this.log.error('Error uploading file ', this.path, ' to ', _filePath, '.  Error: ', err);
        throw err;
      });
  }
}
