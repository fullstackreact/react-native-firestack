import { NativeModules, NativeEventEmitter } from 'react-native';
import { Base } from './base';
import { promisify } from '../utils';

const FirestackCloudMessaging = NativeModules.FirestackCloudMessaging;
const FirestackCloudMessagingEvt = new NativeEventEmitter(FirestackCloudMessaging);

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
  onMessage(callback) {
    this.log.info('Setting up onMessage callback');
    const sub = this._on('FirestackReceiveNotification', callback, FirestackCloudMessagingEvt);
    return promisify(() => sub, FirestackCloudMessaging)(sub);
  }

  // android & ios api dfgsdfs
  onMessageReceived(...args) {
    return this.onMessage(...args);
  }

  // there is no 'off' for this on api's but it's needed here for react
  // so followed the general 'off' / 'on' naming convention
  offMessage() {
    this.log.info('Unlistening from onMessage (offMessage)');
    this._off('FirestackRefreshToken');
  }

  offMessageReceived(...args) {
    return this.offMessage(...args);
  }


  get namespace() {
    return 'firestack:cloudMessaging'
  }

  getToken() {
    this.log.info('getToken for cloudMessaging');
    return promisify('getToken', FirestackCloudMessaging)();
  }

  sendMessage(details: Object = {}, type: string = 'local') {
    const methodName = `send${type == 'local' ? 'Local' : 'Remote'}`;
    this.log.info('sendMessage', methodName, details);
    return promisify(methodName, FirestackCloudMessaging)(details);
  }

  scheduleMessage(details: Object = {}, type: string = 'local') {
    const methodName = `schedule${type == 'local' ? 'Local' : 'Remote'}`;
    return promisify(methodName, FirestackCloudMessaging)(details);
  }

  // OLD
  send(senderId, messageId, messageType, msg) {
    return promisify('send', FirestackCloudMessaging)(senderId, messageId, messageType, msg);
  }

  //
  listenForTokenRefresh(callback) {
    this.log.info('Setting up listenForTokenRefresh callback');
    const sub = this._on('FirestackRefreshToken', callback, FirestackCloudMessagingEvt);
    return promisify(() => sub, FirestackCloudMessaging)(sub);
  }

  unlistenForTokenRefresh() {
    this.log.info('Unlistening for TokenRefresh');
    this._off('FirestackRefreshToken');
  }

  subscribeToTopic(topic) {
    this.log.info('subscribeToTopic ' + topic);
    const finalTopic = `/topics/${topic}`;
    return promisify('subscribeToTopic', FirestackCloudMessaging)(finalTopic);
  }

  unsubscribeFromTopic(topic) {
    this.log.info('unsubscribeFromTopic ' + topic);
    const finalTopic = `/topics/${topic}`;
    return promisify('unsubscribeFromTopic', FirestackCloudMessaging)(finalTopic);
  }

  // New api
  onRemoteMessage(callback) {
    this.log.info('On remote message callback');
    const sub = this._on('messaging_remote_event_received', callback, FirestackCloudMessagingEvt);
    return promisify(() => sub, FirestackCloudMessaging)(sub);
  }

  onLocalMessage(callback) {
    this.log.info('on local callback');
    const sub = this._on('messaging_local_event_received', callback, FirestackCloudMessagingEvt);
    return promisify(() => sub, FirestackCloudMessaging)(sub);
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
    const sub = this._on('FirestackUpstreamSend', callback, FirestackCloudMessagingEvt);
    return promisify(() => sub, FirestackCloudMessaging)(sub);
  }

  unlistenForReceiveUpstreamSend() {
    this.log.info('Unlistening for send');
    this._off('FirestackUpstreamSend');
  }
}
