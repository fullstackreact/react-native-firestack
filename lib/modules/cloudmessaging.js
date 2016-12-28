import {Platform, NativeModules, NativeEventEmitter} from 'react-native';
const FirestackCloudMessaging = NativeModules.FirestackCloudMessaging;
const FirestackCloudMessagingEvt = new NativeEventEmitter(FirestackCloudMessaging);

import promisify from '../utils/promisify'
import { Base, ReferenceBase } from './base'

const defaultPermissions = {
    'badge': 1,
    'sound': 2,
    'alert': 3
}
export class CloudMessaging extends Base {
    constructor(firestack, options = {}) {
        super(firestack, options);

        this.requestedPermissions = Object.assign({}, defaultPermissions, options.permissions); 
    }
    get namespace() {
        return 'firestack:cloudMessaging'
    }
    getToken() {
        this.log.info('getToken for cloudMessaging');
        return promisify('getToken', FirestackCloudMessaging)();
    }

    // Request FCM permissions
    requestPermissions(requestedPermissions = {}) {
        if (Platform.OS === 'ios') {
            const mergedRequestedPermissions = Object.assign({}, 
                this.requestedPermissions, 
                requestedPermissions);
            return promisify('requestPermissions', FirestackCloudMessaging)(mergedRequestedPermissions)
                .then(perms => {
                    
                    return perms;
                });
        }
    }

    sendMessage(details:Object = {}, type:string='local') {
        const methodName = `send${type == 'local' ? 'Local' : 'Remote'}`
        this.log.info('sendMessage', methodName, details);
        return promisify(methodName, FirestackCloudMessaging)(details);
    }
    scheduleMessage(details:Object = {}, type:string='local') {
        const methodName = `schedule${type == 'local' ? 'Local' : 'Remote'}`
        return promisify(methodName, FirestackCloudMessaging)(details);
    }
    // OLD
    send(senderId, messageId, messageType, msg){
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
        const finalTopic = `/topics/${topic}`
        return promisify('subscribeToTopic', FirestackCloudMessaging)(finalTopic);
    }
    unsubscribeFromTopic(topic) {
        this.log.info('unsubscribeFromTopic ' + topic);
        const finalTopic = `/topics/${topic}`
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

    // Original API
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