import {NativeModules, NativeAppEventEmitter} from 'react-native';
const FirestackRemoteConfig = NativeModules.FirestackRemoteConfig;

import promisify from '../utils/promisify';
/**
 * Configuration class
 */
const defaultExpiration = 60 * 60 * 24; // one day
export class RemoteConfig {
  constructor(defaultConfig) {
    this.defaultConfig = defaultConfig || {};
    this.setDefaultRemoteConfig(defaultConfig, process.env.NODE_ENV === 'development')
    .then(() => this.configured = true);
  }

  setDefaultRemoteConfig(options, devMode=false) {
    return promisify('setDefaultRemoteConfig', FirestackRemoteConfig)(options, devMode)
  }

  fetchWithExpiration(expirationSeconds=defaultExpiration) {
    return promisify('fetchWithExpiration', FirestackRemoteConfig)(expirationSeconds)
  }

  config(name) {
    return promisify('configValueForKey', FirestackRemoteConfig)(name);
  }
}

export default RemoteConfig;
