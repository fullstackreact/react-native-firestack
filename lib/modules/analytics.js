import {NativeModules, NativeAppEventEmitter} from 'react-native';
const FirestackAnalytics = NativeModules.FirestackAnalytics;

import promisify from '../utils/promisify'
import { Base } from './base'

export class Analytics extends Base {
  constructor(firestack, options={}) {
    super(firestack, options);

    this._addToFirestackInstance(
      'logEventWithName'
    )
  }
  /**
   * Log an event
   * @param  {string} name  The name of the event
   * @param  {object} props An object containing string-keys
   * @return {Promise}
   */
  logEventWithName(name, props) {
    return promisify('logEventWithName', FirestackAnalytics)(name, props);
  }

  enable() {
    return promisify('setEnabled', FirestackAnalytics)(true);
  }

  disable() {
    return promisify('setEnabled', FirestackAnalytics)(false);
  }

  setUser(id, properties={}) {
    return promisify('setUserId', FirestackAnalytics)(id, properties);
  }

  get namespace() {
    return 'firestack:analytics'
  }
}

export default Analytics