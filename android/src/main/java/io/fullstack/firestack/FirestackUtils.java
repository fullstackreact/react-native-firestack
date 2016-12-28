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
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.ReadableMap;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;
import com.google.firebase.database.DataSnapshot;

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
    final String eventName,
    final WritableMap params) {
    if (context.hasActiveCatalystInstance()) {
      context
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit(eventName, params);
    } else {
      Log.d(TAG, "Waiting for CatalystInstance before sending event");
    }
  }

  // snapshot
  public static WritableMap dataSnapshotToMap(String name, 
    String path, 
    DataSnapshot dataSnapshot) {
      WritableMap data = Arguments.createMap();

      data.putString("key", dataSnapshot.getKey());
      data.putBoolean("exists", dataSnapshot.exists());
      data.putBoolean("hasChildren", dataSnapshot.hasChildren());

      data.putDouble("childrenCount", dataSnapshot.getChildrenCount());
      if (!dataSnapshot.hasChildren()) {
        Object value = dataSnapshot.getValue();
        String type = value!=null ? value.getClass().getName() : "";
        switch (type) {
          case "java.lang.Boolean":
            data.putBoolean("value", (Boolean)value);
            break;
          case "java.lang.Long":
            Long longVal = (Long) value;
            data.putDouble("value", (double)longVal);
            break;
          case "java.lang.Double":
            data.putDouble("value", (Double) value);
            break;
          case "java.lang.String":
            data.putString("value",(String) value);
            break;
          default:
            data.putString("value", null);
        }
      } else{
        WritableMap valueMap = FirestackUtils.castSnapshotValue(dataSnapshot);
        data.putMap("value", valueMap);
      }

      // Child keys
      WritableArray childKeys = FirestackUtils.getChildKeys(dataSnapshot);
      data.putArray("childKeys", childKeys);

      Object priority = dataSnapshot.getPriority();
      if (priority == null) {
        data.putString("priority", null);
      } else {
        data.putString("priority", priority.toString());
      }

      WritableMap eventMap = Arguments.createMap();
      eventMap.putString("eventName", name);
      eventMap.putMap("snapshot", data);
      eventMap.putString("path", path);
      return eventMap;
  }

  public static <Any> Any castSnapshotValue(DataSnapshot snapshot) {
    if (snapshot.hasChildren()) {
      WritableMap data = Arguments.createMap();
      for (DataSnapshot child : snapshot.getChildren()) {
        Any castedChild = castSnapshotValue(child);
        switch (castedChild.getClass().getName()) {
          case "java.lang.Boolean":
            data.putBoolean(child.getKey(), (Boolean) castedChild);
            break;
          case "java.lang.Long":
            Long longVal = (Long) castedChild;
            data.putDouble(child.getKey(), (double)longVal);
            break;
          case "java.lang.Double":
            data.putDouble(child.getKey(), (Double) castedChild);
            break;
          case "java.lang.String":
            data.putString(child.getKey(), (String) castedChild);
            break;
          case "com.facebook.react.bridge.WritableNativeMap":
            data.putMap(child.getKey(), (WritableMap) castedChild);
            break;
          default:
            Log.w(TAG, "Invalid type: " + castedChild.getClass().getName());
            break;
        }
      }
      return (Any) data;
    } else {
      if (snapshot.getValue() != null) {
        String type = snapshot.getValue().getClass().getName();
        switch (type) {
          case "java.lang.Boolean":
            return (Any)(snapshot.getValue());
          case "java.lang.Long":
            return (Any)(snapshot.getValue());
          case "java.lang.Double":
            return (Any)(snapshot.getValue());
          case "java.lang.String":
            return (Any)(snapshot.getValue());
          default:
            Log.w(TAG, "Invalid type: "+type);
            return (Any) null;
        }
      }
      return (Any) null;
    }
  }

  public static WritableArray getChildKeys(DataSnapshot snapshot) {
    WritableArray childKeys = Arguments.createArray();

    if (snapshot.hasChildren()) {
      for (DataSnapshot child : snapshot.getChildren()) {
        childKeys.pushString(child.getKey());
      }
    }

    return childKeys;
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
