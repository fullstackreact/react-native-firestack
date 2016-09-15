package io.fullstack.firestack;

import java.util.Map;

import android.content.Context;
import android.content.IntentFilter;
import android.content.Intent;
import android.content.BroadcastReceiver;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.WritableMap;

import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.RemoteMessage;

/**
 * Created by nori on 2016/09/12.
 */
public class FirestackCloudMessaging extends ReactContextBaseJavaModule {

    private static final String TAG = "FirestackCloudMessaging";
    private static final String EVENT_NAME_TOKEN = "FirestackRefreshToken";
    private static final String EVENT_NAME_NOTIFICATION = "FirestackReceiveNotification";
    private static final String EVENT_NAME_SEND = "FirestackUpstreamSend";

    public static final String INTENT_NAME_TOKEN = "io.fullstack.firestack.refreshToken";
    public static final String INTENT_NAME_NOTIFICATION = "io.fullstack.firestack.ReceiveNotification";
    public static final String INTENT_NAME_SEND = "io.fullstack.firestack.Upstream";

    private ReactContext mReactContext;
    private IntentFilter mRefreshTokenIntentFilter;
    private IntentFilter mReceiveNotificationIntentFilter;
    private IntentFilter mReceiveSendIntentFilter;

    public FirestackCloudMessaging(ReactApplicationContext reactContext) {
        super(reactContext);
        mReactContext = reactContext;
        mRefreshTokenIntentFilter = new IntentFilter(INTENT_NAME_TOKEN);
        mReceiveNotificationIntentFilter = new IntentFilter(INTENT_NAME_NOTIFICATION);
        mReceiveSendIntentFilter = new IntentFilter(INTENT_NAME_SEND);
        initRefreshTokenHandler();
        initMessageHandler();
        initSendHandler();
        Log.d(TAG, "New instance");
    }

    @Override
    public String getName() {
        return TAG;
    }

    @ReactMethod
    public void getToken(final Callback callback) {

        try {
            String token = FirebaseInstanceId.getInstance().getToken();
            Log.d(TAG, "Firebase token: " + token);
            callback.invoke(null, token);
        } catch (Exception e) {
            WritableMap error = Arguments.createMap();
            error.putString("message", e.getMessage());
            callback.invoke(error);
        }
    }

    /**
     *
     */
    private void initRefreshTokenHandler() {
        getReactApplicationContext().registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                WritableMap params = Arguments.createMap();
                params.putString("token", intent.getStringExtra("token"));
                ReactContext ctx = getReactApplicationContext();
                Log.d(TAG, "initRefreshTokenHandler received event " + EVENT_NAME_TOKEN);
                FirestackUtils.sendEvent(ctx, EVENT_NAME_TOKEN, params);
            }

            ;
        }, mRefreshTokenIntentFilter);
    }

    @ReactMethod
    public void subscribeToTopic(String topic, final Callback callback) {
        try {
            FirebaseMessaging.getInstance().subscribeToTopic(topic);
            callback.invoke(null,topic);
        } catch (Exception e) {
            e.printStackTrace();
            Log.d(TAG, "Firebase token: " + e);
            WritableMap error = Arguments.createMap();
            error.putString("message", e.getMessage());
            callback.invoke(error);

        }
    }

    @ReactMethod
    public void unsubscribeFromTopic(String topic, final Callback callback) {
        try {
            FirebaseMessaging.getInstance().unsubscribeFromTopic(topic);
            callback.invoke(null,topic);
        } catch (Exception e) {
            WritableMap error = Arguments.createMap();
            error.putString("message", e.getMessage());
            callback.invoke(error);
        }
    }

    private void initMessageHandler() {
        Log.d(TAG, "Firestack initMessageHandler called");
        getReactApplicationContext().registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                RemoteMessage remoteMessage = intent.getParcelableExtra("data");
                Log.d(TAG, "Firebase onReceive: " + remoteMessage);
                WritableMap params = Arguments.createMap();
                if (remoteMessage.getData().size() != 0) {
                    WritableMap dataMap = Arguments.createMap();
                    Map<String, String> data = remoteMessage.getData();
                    //Set<String> keysIterator = data.keySet();
                    for (String key : data.keySet()) {
                        dataMap.putString(key, data.get(key));
                    }
                    params.putMap("data", dataMap);
                } else {
                    params.putNull("data");
                }
                if (remoteMessage.getNotification() != null) {
                    WritableMap notificationMap = Arguments.createMap();
                    RemoteMessage.Notification notification = remoteMessage.getNotification();
                    notificationMap.putString("title", notification.getTitle());
                    notificationMap.putString("body", notification.getBody());
                    notificationMap.putString("icon", notification.getIcon());
                    notificationMap.putString("sound", notification.getSound());
                    notificationMap.putString("tag", notification.getTag());
                    params.putMap("notification", notificationMap);
                } else {
                    params.putNull("notification");
                }
                ReactContext ctx = getReactApplicationContext();
                FirestackUtils.sendEvent(ctx, EVENT_NAME_NOTIFICATION, params);
            }
        }, mReceiveNotificationIntentFilter);
    }

    @ReactMethod
    public void send(String senderId, String messageId, String messageType, ReadableMap params, final Callback callback) {
        FirebaseMessaging fm = FirebaseMessaging.getInstance();
        RemoteMessage.Builder remoteMessage = new RemoteMessage.Builder(senderId);
        remoteMessage.setMessageId(messageId);
        remoteMessage.setMessageType(messageType);
        ReadableMapKeySetIterator iterator = params.keySetIterator();
        while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            ReadableType type = params.getType(key);
            if (type == ReadableType.String) {
                remoteMessage.addData(key, params.getString(key));
                Log.d(TAG, "Firebase send: " + key);
                Log.d(TAG, "Firebase send: " + params.getString(key));
            }
        }
        try {
            fm.send(remoteMessage.build());
            WritableMap res = Arguments.createMap();
            res.putString("status", "success");
            callback.invoke(null, res);
        } catch(Exception e) {
            Log.e(TAG, "Error sending message", e);
            WritableMap error = Arguments.createMap();
            error.putString("code", e.toString());
            error.putString("message", e.toString());
            callback.invoke(error);
        }
    }

    private void initSendHandler() {
        getReactApplicationContext().registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                WritableMap params = Arguments.createMap();
                if (intent.getBooleanExtra("hasError", false)) {
                    WritableMap error = Arguments.createMap();
                    error.putInt("code", intent.getIntExtra("errCode", 0));
                    error.putString("message", intent.getStringExtra("errorMessage"));
                    params.putMap("err", error);
                } else {
                    params.putNull("err");
                }
                ReactContext ctx = getReactApplicationContext();
                FirestackUtils.sendEvent(ctx, EVENT_NAME_SEND, params);
            }
        }, mReceiveSendIntentFilter);
    }
}
