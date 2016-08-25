package io.fullstack.firestack;

import android.util.Log;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;

public class FirestackUtils {
  private static final String TAG = "FirestackUtils";

      // TODO NOTE
  public static void todoNote(final String tag, final String name, final Callback callback) {
    Log.e(tag, "The method " + name + " has not yet been implemented.");
    Log.e(tag, "Feel free to contribute to finish the method in the source.");

    WritableMap errorMap = Arguments.createMap();
    errorMap.putString("error", "unimplemented");
    callback.invoke(errorMap);
  }

  /**
  * send a JS event
  **/
  public static void sendEvent(final ReactContext context, 
    String eventName,
    WritableMap params) {
      context
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit(eventName, params);
  }
}