import {NativeModules, NativeEventEmitter} from 'react-native';
const FirestackCloudMessaging = NativeModules.FirestackCloudMessaging;
const FirestackCloudMessagingEvt = new NativeEventEmitter(FirestackCloudMessaging);

import promisify from '../utils/promisify'
import { Base, ReferenceBase } from './base'
export class CloudMessaging extends Base {
    constructor(firestack, options = {}) {
        super(firestack, options);
    }
    get namespace() {
        return 'firestack:cloudMessaging'
    }
    getToken() {
        this.log.info('getToken for cloudMessaging');
        return promisify('getToken', FirestackCloudMessaging)();
    }
    send(senderId, messageId, messageType, msg){
        return promisify('send', FirestackCloudMessaging)(senderId, messageId, messageType, msg);
    }
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
        return promisify('subscribeToTopic', FirestackCloudMessaging)(topic);
    }
    unsubscribeFromTopic(topic) {
        this.log.info('unsubscribeFromTopic ' + topic);
        return promisify('unsubscribeFromTopic', FirestackCloudMessaging)(topic);
    }
    listenForReceiveNotification(callback) {
        this.log.info('Setting up listenForReceiveNotification callback');
        const sub = this._on('FirestackReceiveNotification', callback, FirestackCloudMessagingEvt);
        return promisify(() => sub, FirestackCloudMessaging)(sub);
    }
    unlistenForReceiveNotification() {
        this.log.info('Unlistening for ReceiveNotification');
        this._off('FirestackRefreshToken');
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

export default CloudMessaging