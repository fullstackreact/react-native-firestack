package io.fullstack.firestack;

import android.content.Context;
import android.util.Log;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactContext;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.database.ServerValue;


class FirestackModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
    private static final String TAG = "Firestack";
    private Context context;
    private ReactContext mReactContext;
    private FirebaseApp app;

    enum ConfigurationValues {
        API_KEY("apiKey", "APIKey") {
            @Override
            protected void doApply(FirebaseOptions.Builder builder, String value) {
                builder.setApiKey(value);
            }
        },
        APPLICATION_ID("applicationID", "applicationId") {
            @Override
            protected void doApply(FirebaseOptions.Builder builder, String value) {
                builder.setApplicationId(value);
            }
        },
        GCM_SENDER_ID("gcmSenderID", "GCMSenderID") {
            @Override
            protected void doApply(FirebaseOptions.Builder builder, String value) {
                builder.setGcmSenderId(value);
            }
        },
        STORAGE_BUCKET("storageBucket") {
            @Override
            protected void doApply(FirebaseOptions.Builder builder, String value) {
                builder.setStorageBucket(value);
            }
        }, DATABASE_URL("databaseUrl", "databaseURL") {
            @Override
            protected void doApply(FirebaseOptions.Builder builder, String value) {
                builder.setDatabaseUrl(value);
            }
        };

        ConfigurationValues(String... keys) {
            this.keys = Arrays.asList(keys);
        }

        public void apply(ReadableMap params, FirebaseOptions.Builder builder) {
            String value = lookUp(params);
            Log.d(TAG, "Setting " + this.name() + " from params to: " + value);
            doApply(builder, value);
        }

        private String lookUp(ReadableMap params) {
            for (String key : keys) {
                if (params.hasKey(key)) {
                    return params.getString(key);
                }
            }
            return "";
        }

        protected abstract void doApply(FirebaseOptions.Builder builder, String value);

        private final List<String> keys;
    }

    public FirestackModule(ReactApplicationContext reactContext, Context context) {
        super(reactContext);
        this.context = context;
        mReactContext = reactContext;

        Log.d(TAG, "New instance");
    }

    @Override
    public String getName() {
        return TAG;
    }

    @ReactMethod
    public void configureWithOptions(final ReadableMap params, @Nullable final Callback onComplete) {
        Log.i(TAG, "configureWithOptions");
        try {
            app = retrieveOrConfigure(params);
            WritableMap resp = Arguments.createMap();
            resp.putString("msg", "success");
            onComplete.invoke(null, resp);
        } catch (Exception ex) {
            Log.e(TAG, "ERROR configureWithOptions");
            Log.e(TAG, ex.getMessage());
            WritableMap resp = Arguments.createMap();
            resp.putString("msg", ex.getMessage());
            onComplete.invoke(resp);
        }
    }

    private FirebaseApp retrieveOrConfigure(ReadableMap params) {
        if (FirebaseApp.getApps(context).size() > 0) {
            return FirebaseApp.getInstance();
        }
        return configure(params);
    }

    @NonNull
    private FirebaseApp configure(ReadableMap params) {
        Log.i(TAG, "Configuring app");
        FirebaseOptions.Builder builder = new FirebaseOptions.Builder();
        for (ConfigurationValues configurationValue : ConfigurationValues.values()) {
            configurationValue.apply(params, builder);
        }
        FirebaseApp firebaseApp = FirebaseApp.initializeApp(this.context, builder.build());
        Log.i(TAG, "Configured");
        return firebaseApp;
    }

    @ReactMethod
    public void serverValue(@Nullable final Callback onComplete) {
        WritableMap timestampMap = Arguments.createMap();
        for (Map.Entry<String, String> entry : ServerValue.TIMESTAMP.entrySet()) {
            timestampMap.putString(entry.getKey(), entry.getValue());
        }

        WritableMap map = Arguments.createMap();
        map.putMap("TIMESTAMP", timestampMap);
        onComplete.invoke(null, map);
    }

    // Internal helpers
    @Override
    public void onHostResume() {
        WritableMap params = Arguments.createMap();
        params.putBoolean("isForeground", true);
        FirestackUtils.sendEvent(mReactContext, "FirestackAppState", params);
    }

    @Override
    public void onHostPause() {
        WritableMap params = Arguments.createMap();
        params.putBoolean("isForeground", false);
        FirestackUtils.sendEvent(mReactContext, "FirestackAppState", params);
    }

    @Override
    public void onHostDestroy() {

    }
}
