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
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactContext;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

class FirestackStorageModule extends ReactContextBaseJavaModule {

  private static final String TAG = "FirestackStorage";

  private Context context;
  private ReactContext mReactContext;
  private FirebaseApp app;

  public FirestackStorageModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext;
    mReactContext = reactContext;

    Log.d(TAG, "New instance");
  }

  @Override
  public String getName() {
    return TAG;
  }

  // STORAGE
  @ReactMethod
  public void uploadFile(final String urlStr, final String name, final String filepath, final ReadableMap metadata, final Callback callback) {
    // TODO
    FirestackUtils.todoNote(TAG, "uploadFile", callback);
  }
}