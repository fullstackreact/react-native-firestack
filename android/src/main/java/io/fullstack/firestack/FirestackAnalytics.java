package io.fullstack.firestack;

import android.content.Context;
import android.util.Log;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReactContext;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.FirebaseApp;

class FirestackAnalyticsModule extends ReactContextBaseJavaModule {

  private static final String TAG = "FirestackAnalytics";

  private Context context;
  private ReactContext mReactContext;

  public FirestackAnalyticsModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext;
    mReactContext = reactContext;

    Log.d(TAG, "New instance");
  }

  @Override
  public String getName() {
    return TAG;
  }

  @ReactMethod
  public void logEventWithName(final String name, final ReadableMap props, final Callback callback) {
    // TODO
    FirestackUtils.todoNote(TAG, "logEventWithName", callback);
  }
}