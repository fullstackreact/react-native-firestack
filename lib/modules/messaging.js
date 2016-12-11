import { NativeModules, NativeEventEmitter } from 'react-native';
import { Base } from './base';
import { promisify } from '../utils';

const FirestackMessaging = NativeModules.FirestackMessaging || NativeModules.FirestackCloudMessaging;
const FirestackMessagingEvt = new NativeEventEmitter(FirestackMessaging);

/**
 * @class Messaging
 */
export default class Messaging extends Base {
  constructor(firestack, options = {}) {
    super(firestack, options);
  }

  /*
   * WEB API
   */
  // TODO move to new event emitter logic
  onMessage(callback) {
    this.log.info('Setting up onMessage callback');
    const sub = this._on('FirestackReceiveNotification', callback, FirestackMessagingEvt);
    return promisify(() => sub, FirestackMessaging)(sub);
  }

  // TODO this is wrong - also there is no 'off' onMessage should return the unsubscribe function
  offMessage() {
    this.log.info('Unlistening from onMessage (offMessage)');
    this._off('FirestackReceiveNotification');
  }

  offMessageReceived(...args) {
    return this.offMessage(...args);
  }


  get namespace() {
    return 'firestack:cloudMessaging'
  }

  getToken() {
    this.log.info('getToken for cloudMessaging');
    return promisify('getToken', FirestackMessaging)();
  }

  sendMessage(details: Object = {}, type: string = 'local') {
    const methodName = `send${type == 'local' ? 'Local' : 'Remote'}`;
    this.log.info('sendMessage', methodName, details);
    return promisify(methodName, FirestackMessaging)(details);
  }

  scheduleMessage(details: Object = {}, type: string = 'local') {
    const methodName = `schedule${type == 'local' ? 'Local' : 'Remote'}`;
    return promisify(methodName, FirestackMessaging)(details);
  }

  // OLD
  send(senderId, messageId, messageType, msg) {
    return promisify('send', FirestackMessaging)(senderId, messageId, messageType, msg);
  }

  //
  listenForTokenRefresh(callback) {
    this.log.info('Setting up listenForTokenRefresh callback');
    const sub = this._on('FirestackRefreshToken', callback, FirestackMessagingEvt);
    return promisify(() => sub, FirestackMessaging)(sub);
  }

  unlistenForTokenRefresh() {
    this.log.info('Unlistening for TokenRefresh');
    this._off('FirestackRefreshToken');
  }

  subscribeToTopic(topic) {
    this.log.info('subscribeToTopic ' + topic);
    const finalTopic = `/topics/${topic}`;
    return promisify('subscribeToTopic', FirestackMessaging)(finalTopic);
  }

  unsubscribeFromTopic(topic) {
    this.log.info('unsubscribeFromTopic ' + topic);
    const finalTopic = `/topics/${topic}`;
    return promisify('unsubscribeFromTopic', FirestackMessaging)(finalTopic);
  }

  // New api
  onRemoteMessage(callback) {
    this.log.info('On remote message callback');
    const sub = this._on('messaging_remote_event_received', callback, FirestackMessagingEvt);
    return promisify(() => sub, FirestackMessaging)(sub);
  }

  onLocalMessage(callback) {
    this.log.info('on local callback');
    const sub = this._on('messaging_local_event_received', callback, FirestackMessagingEvt);
    return promisify(() => sub, FirestackMessaging)(sub);
  }

  // old API
  /**
   * @deprecated
   * @param args
   * @returns {*}
   */
  listenForReceiveNotification(...args) {
    console.warn('Firestack: listenForReceiveNotification is now deprecated, please use onMessage');
    return this.onMessage(...args);
  }

  /**
   * @deprecated
   * @param args
   * @returns {*}
   */
  unlistenForReceiveNotification(...args) {
    console.warn('Firestack: unlistenForReceiveNotification is now deprecated, please use offMessage');
    return this.offMessage(...args);
  }

  listenForReceiveUpstreamSend(callback) {
    this.log.info('Setting up send callback');
    const sub = this._on('FirestackUpstreamSend', callback, FirestackMessagingEvt);
    return promisify(() => sub, FirestackMessaging)(sub);
  }

  unlistenForReceiveUpstreamSend() {
    this.log.info('Unlistening for send');
    this._off('FirestackUpstreamSend');
  }
}
