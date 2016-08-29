package io.fullstack.firestack;

import android.util.Log;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;

public class FirestackUtils {
  private static final String TAG = "FirestackUtils";

      // TODO NOTE
  public static void todoNote(final String tag, final String name, final Callback callback) {
    Log.e(tag, "The method " + name + " has not yet been implemented.");
    Log.e(tag, "Feel free to contribute to finish the method in the source.");

    WritableMap errorMap = Arguments.createMap();
    errorMap.putString("error", "unimplemented");
    callback.invoke(null, errorMap);
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

  public static Map<String, Object> recursivelyDeconstructReadableMap(ReadableMap readableMap) {
      ReadableMapKeySetIterator iterator = readableMap.keySetIterator();
      Map<String, Object> deconstructedMap = new HashMap<>();
      while (iterator.hasNextKey()) {
          String key = iterator.nextKey();
          ReadableType type = readableMap.getType(key);
          switch (type) {
              case Null:
                  deconstructedMap.put(key, null);
                  break;
              case Boolean:
                  deconstructedMap.put(key, readableMap.getBoolean(key));
                  break;
              case Number:
                  deconstructedMap.put(key, readableMap.getDouble(key));
                  break;
              case String:
                  deconstructedMap.put(key, readableMap.getString(key));
                  break;
              case Map:
                  deconstructedMap.put(key, FirestackUtils.recursivelyDeconstructReadableMap(readableMap.getMap(key)));
                  break;
              case Array:
                  deconstructedMap.put(key, FirestackUtils.recursivelyDeconstructReadableArray(readableMap.getArray(key)));
                  break;
              default:
                  throw new IllegalArgumentException("Could not convert object with key: " + key + ".");
          }

      }
      return deconstructedMap;
  }

  public static List<Object> recursivelyDeconstructReadableArray(ReadableArray readableArray) {
      List<Object> deconstructedList = new ArrayList<>(readableArray.size());
      for (int i = 0; i < readableArray.size(); i++) {
          ReadableType indexType = readableArray.getType(i);
          switch(indexType) {
              case Null:
                  deconstructedList.add(i, null);
                  break;
              case Boolean:
                  deconstructedList.add(i, readableArray.getBoolean(i));
                  break;
              case Number:
                  deconstructedList.add(i, readableArray.getDouble(i));
                  break;
              case String:
                  deconstructedList.add(i, readableArray.getString(i));
                  break;
              case Map:
                  deconstructedList.add(i, FirestackUtils.recursivelyDeconstructReadableMap(readableArray.getMap(i)));
                  break;
              case Array:
                  deconstructedList.add(i, FirestackUtils.recursivelyDeconstructReadableArray(readableArray.getArray(i)));
                  break;
              default:
                  throw new IllegalArgumentException("Could not convert object at index " + i + ".");
          }
      }
      return deconstructedList;
  }
}