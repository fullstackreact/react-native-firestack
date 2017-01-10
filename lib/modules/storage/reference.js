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
   * @return {Promise}
   */
  downloadFile(filePath: string): Promise<Object> {
    this.log.debug('download(', this.path, ') -> ', filePath);

    let downloadTask = promisify('downloadFile', FirestackStorage)(this.path, filePath);
    downloadTask.cancel = () => {
      //TODO
      throw new Error('.cancel() is not currently supported by react-native-firestack');
    }
    downloadTask.on = (event, nextOrObserver, error, complete) => {
      //TODO: nextOrObserver as an object
      if (nextOrObserver) this.storage._addListener(this.path, 'state_changed', nextOrObserver);
      if (error) this.storage._addListener(this.path, 'download_failure', error);
      if (complete) this.storage._addListener(this.path, 'download_success', complete);
      return () => {
        if (nextOrObserver) this.storage._removeListener(this.path, 'state_changed', nextOrObserver);
        if (error) this.storage._removeListener(this.path, 'download_failure', error);
        if (complete) this.storage._removeListener(this.path, 'download_success', complete);
      }
    }
    downloadTask.pause = () => {
      //TODO
      throw new Error('.pause() is not currently supported by react-native-firestack');
    }
    downloadTask.resume = () => {
      //TODO
      throw new Error('.resume() is not currently supported by react-native-firestack');
    }

    return downloadTask;
  }

  /**
   * Upload a file path
   * @param  {string} filePath The local path of the file
   * @param  {object} metadata An object containing metadata
   * @return {Promise}
   */
  putFile(filePath: Object, metadata: Object = {}): Promise<Object> {
    const _filePath = filePath.replace('file://', '');
    this.log.debug('putFile(', _filePath, ') -> ', this.path);

    //TODO: There's probably a better way of doing this, but I couldn't figure out the best way to extend a promise
    let uploadTask = promisify('putFile', FirestackStorage)(this.path, _filePath, metadata);
    uploadTask.cancel = () => {
      //TODO
      throw new Error('.cancel() is not currently supported by react-native-firestack');
    }
    uploadTask.on = (event, nextOrObserver, error, complete) => {
      //TODO: nextOrObserver as an object
      if (nextOrObserver) this.storage._addListener(this.path, 'state_changed', nextOrObserver);
      if (error) this.storage._addListener(this.path, 'upload_failure', error);
      if (complete) this.storage._addListener(this.path, 'upload_success', complete);
      return () => {
        if (nextOrObserver) this.storage._removeListener(this.path, 'state_changed', nextOrObserver);
        if (error) this.storage._removeListener(this.path, 'upload_failure', error);
        if (complete) this.storage._removeListener(this.path, 'upload_success', complete);
      }
    }
    uploadTask.pause = () => {
      //TODO
      throw new Error('.pause() is not currently supported by react-native-firestack');
    }
    uploadTask.resume = () => {
      //TODO
      throw new Error('.resume() is not currently supported by react-native-firestack');
    }

    return uploadTask;
  }
}
