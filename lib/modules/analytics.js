
import {NativeModules, NativeAppEventEmitter} from 'react-native';
const FirestackAnalytics = NativeModules.FirestackAnalytics;

import promisify from '../promisify'
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
}

export default Analytics