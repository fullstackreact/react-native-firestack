package io.fullstack.firestack;

import android.content.Context;
import android.util.Log;
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

class FirestackModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
  private static final String TAG = "Firestack";
  private Context context;
  private ReactContext mReactContext;
  private FirebaseApp app;

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
  public void configureWithOptions(ReadableMap params, @Nullable final Callback onComplete) {
    Log.i(TAG, "configureWithOptions");

    FirebaseOptions.Builder builder = new FirebaseOptions.Builder();

    if (params.hasKey("applicationId")) {
      final String applicationId = params.getString("applicationId");
      Log.d(TAG, "Setting applicationId from params " + applicationId);
      builder.setApplicationId(applicationId);
    }
    if (params.hasKey("apiKey")) {
      final String apiKey = params.getString("apiKey");
      Log.d(TAG, "Setting API key from params " + apiKey);
      builder.setApiKey(apiKey);
    }
    if (params.hasKey("APIKey")) {
      final String apiKey = params.getString("APIKey");
      Log.d(TAG, "Setting API key from params " + apiKey);
      builder.setApiKey(apiKey);
    }
    if (params.hasKey("gcmSenderID")) {
      final String gcmSenderID = params.getString("gcmSenderID");
      Log.d(TAG, "Setting gcmSenderID from params " + gcmSenderID );
      builder.setGcmSenderId(gcmSenderID);
    }
    if (params.hasKey("storageBucket")) {
      final String storageBucket = params.getString("storageBucket");
      Log.d(TAG, "Setting storageBucket from params " + storageBucket);
      builder.setStorageBucket(storageBucket);
    }
    if (params.hasKey("databaseURL")) {
      final String databaseURL = params.getString("databaseURL");
      Log.d(TAG, "Setting databaseURL from params " + databaseURL);
      builder.setDatabaseUrl(databaseURL);
    }
    if (params.hasKey("clientID")) {
      final String clientID = params.getString("clientID");
      Log.d(TAG, "Setting clientID from params " + clientID);
      builder.setApplicationId(clientID);
    }

    try {
        Log.i(TAG, "Configuring app");
        if (app == null) {
          app = FirebaseApp.initializeApp(this.context, builder.build());
        }
        Log.i(TAG, "Configured");

        WritableMap resp = Arguments.createMap();
        resp.putString("msg", "success");
        onComplete.invoke(null, resp);
    }
    catch (Exception ex){
        Log.e(TAG, "ERROR configureWithOptions");
        Log.e(TAG, ex.getMessage());

        WritableMap resp = Arguments.createMap();
        resp.putString("msg", ex.getMessage());

        onComplete.invoke(resp);
    }
  }

    // Internal helpers
    @Override
    public void onHostResume() {
        WritableMap params = Arguments.createMap();
        params.putBoolean("isForground", true);
        FirestackUtils.sendEvent(mReactContext, "FirestackAppState", params);
    }

    @Override
    public void onHostPause() {
        WritableMap params = Arguments.createMap();
        params.putBoolean("isForground", false);
        FirestackUtils.sendEvent(mReactContext, "FirestackAppState", params);
    }

    @Override
    public void onHostDestroy() {

    }
}