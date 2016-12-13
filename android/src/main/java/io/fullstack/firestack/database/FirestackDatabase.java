package io.fullstack.firestack.database;

import java.util.Map;
import android.net.Uri;
import android.util.Log;
import java.util.HashMap;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReadableMapKeySetIterator;

import com.google.firebase.database.OnDisconnect;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;


import io.fullstack.firestack.Utils;

public class FirestackDatabase extends ReactContextBaseJavaModule {
  private static final String TAG = "FirestackDatabase";
  private HashMap<String, FirestackDatabaseReference> mDBListeners = new HashMap<String, FirestackDatabaseReference>();
  private FirebaseDatabase mFirebaseDatabase;

  public FirestackDatabase(ReactApplicationContext reactContext) {
    super(reactContext);
    mFirebaseDatabase = FirebaseDatabase.getInstance();
  }

  @Override
  public String getName() {
    return TAG;
  }

  // Persistence
  @ReactMethod
  public void enablePersistence(
    final Boolean enable,
    final Callback callback) {
      try {
        mFirebaseDatabase.setPersistenceEnabled(enable);
      } catch (Throwable t) {
        Log.e(TAG, "FirebaseDatabase setPersistenceEnabled exception", t);
      }

      WritableMap res = Arguments.createMap();
      res.putString("status", "success");
      callback.invoke(null, res);
  }

  @ReactMethod
  public void keepSynced(
    final String path,
    final Boolean enable,
    final Callback callback) {
      DatabaseReference ref = mFirebaseDatabase.getReference(path);
      ref.keepSynced(enable);

      WritableMap res = Arguments.createMap();
      res.putString("status", "success");
      res.putString("path", path);
      callback.invoke(null, res);
  }

  // FirestackDatabase
  @ReactMethod
  public void set(
          final String path,
          final ReadableMap props,
          final Callback callback) {
    DatabaseReference ref = mFirebaseDatabase.getReference(path);
    Map<String, Object> m = Utils.recursivelyDeconstructReadableMap(props);

    DatabaseReference.CompletionListener listener = new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handleCallback("set", callback, error);
      }
    };

    ref.setValue(m, listener);
  }

  @ReactMethod
  public void update(final String path,
                     final ReadableMap props,
                     final Callback callback) {
    DatabaseReference ref = mFirebaseDatabase.getReference(path);
    Map<String, Object> m = Utils.recursivelyDeconstructReadableMap(props);

    DatabaseReference.CompletionListener listener = new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handleCallback("update", callback, error);
      }
    };

    ref.updateChildren(m, listener);
  }

  @ReactMethod
  public void remove(final String path,
                     final Callback callback) {
    DatabaseReference ref = mFirebaseDatabase.getReference(path);
    DatabaseReference.CompletionListener listener = new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handleCallback("remove", callback, error);
      }
    };

    ref.removeValue(listener);
  }

  @ReactMethod
  public void push(final String path,
                   final ReadableMap props,
                   final Callback callback) {

    Log.d(TAG, "Called push with " + path);
    DatabaseReference ref = mFirebaseDatabase.getReference(path);
    DatabaseReference newRef = ref.push();

    final Uri url = Uri.parse(newRef.toString());
    final String newPath = url.getPath();

    ReadableMapKeySetIterator iterator = props.keySetIterator();
    if (iterator.hasNextKey()) {
      Log.d(TAG, "Passed value to push");
      // lame way to check if the `props` are empty
      Map<String, Object> m = Utils.recursivelyDeconstructReadableMap(props);

      DatabaseReference.CompletionListener listener = new DatabaseReference.CompletionListener() {
        @Override
        public void onComplete(DatabaseError error, DatabaseReference ref) {
          if (error != null) {
            WritableMap err = Arguments.createMap();
            err.putInt("errorCode", error.getCode());
            err.putString("errorDetails", error.getDetails());
            err.putString("description", error.getMessage());
            callback.invoke(err);
          } else {
            WritableMap res = Arguments.createMap();
            res.putString("status", "success");
            res.putString("ref", newPath);
            callback.invoke(null, res);
          }
        }
      };

      newRef.setValue(m, listener);
    } else {
      Log.d(TAG, "No value passed to push: " + newPath);
      WritableMap res = Arguments.createMap();
      res.putString("status", "success");
      res.putString("ref", newPath);
      callback.invoke(null, res);
    }
  }

  @ReactMethod
  public void on(final String path,
                 final String modifiersString,
                 final ReadableArray modifiersArray,
                 final String name,
                 final Callback callback) {
    FirestackDatabaseReference ref = this.getDBHandle(path, modifiersArray, modifiersString);

    if (name.equals("value")) {
      ref.addValueEventListener();
    } else {
      ref.addChildEventListener(name);
    }

    WritableMap resp = Arguments.createMap();
    resp.putString("status", "success");
    resp.putString("handle", path);
    callback.invoke(null, resp);
  }

  @ReactMethod
  public void onOnce(final String path,
                     final String modifiersString,
                     final ReadableArray modifiersArray,
                     final String name,
                     final Callback callback) {
    FirestackDatabaseReference ref = this.getDBHandle(path, modifiersArray, modifiersString);
    ref.addOnceValueEventListener(callback);
  }

  /**
   * At the time of this writing, off() only gets called when there are no more subscribers to a given path.
   * `mListeners` might therefore be out of sync (though javascript isnt listening for those eventTypes, so
   * it doesn't really matter- just polluting the RN bridge a little more than necessary.
   * off() should therefore clean *everything* up
   */
  @ReactMethod
  public void off(
          final String path,
          final String modifiersString,
          final String name,
          final Callback callback) {

    String key = this.getDBListenerKey(path, modifiersString);
    FirestackDatabaseReference r = mDBListeners.get(key);

    if (r != null) {
      if (name == null || "".equals(name)) {
        r.cleanup();
        mDBListeners.remove(key);
      } else {
        //TODO: Remove individual listeners as per iOS code
        //1) Remove event handler
        //2) If no more listeners, remove from listeners map
        r.cleanup();
        mDBListeners.remove(key);
      }
    }

    Log.d(TAG, "Removed listener " + path + "/" + modifiersString);
    WritableMap resp = Arguments.createMap();
    resp.putString("handle", path);
    resp.putString("status", "success");
    resp.putString("modifiersString", modifiersString);
    //TODO: Remaining listeners
    callback.invoke(null, resp);
  }

  // On Disconnect
  @ReactMethod
  public void onDisconnectSetObject(final String path, final ReadableMap props, final Callback callback) {
    DatabaseReference ref = mFirebaseDatabase.getReference(path);
    Map<String, Object> m = Utils.recursivelyDeconstructReadableMap(props);

    OnDisconnect od = ref.onDisconnect();
    od.setValue(m, new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handleCallback("onDisconnectSetObject", callback, error);
      }
    });
  }

  @ReactMethod
  public void onDisconnectSetString(final String path, final String value, final Callback callback) {
    DatabaseReference ref = mFirebaseDatabase.getReference(path);

    OnDisconnect od = ref.onDisconnect();
    od.setValue(value, new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handleCallback("onDisconnectSetString", callback, error);
      }
    });
  }

  @ReactMethod
  public void onDisconnectRemove(final String path, final Callback callback) {
    DatabaseReference ref = mFirebaseDatabase.getReference(path);

    OnDisconnect od = ref.onDisconnect();
    od.removeValue(new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handleCallback("onDisconnectRemove", callback, error);
      }
    });
  }
  @ReactMethod
  public void onDisconnectCancel(final String path, final Callback callback) {
    DatabaseReference ref = mFirebaseDatabase.getReference(path);

    OnDisconnect od = ref.onDisconnect();
    od.cancel(new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handleCallback("onDisconnectCancel", callback, error);
      }
    });
  }

  @ReactMethod
  public void goOnline() {
    mFirebaseDatabase.goOnline();
  }

  @ReactMethod
  public void goOffline() {
    mFirebaseDatabase.goOffline();
  }

  private void handleCallback(
          final String methodName,
          final Callback callback,
          final DatabaseError databaseError) {
    if (databaseError != null) {
      WritableMap err = Arguments.createMap();
      err.putInt("errorCode", databaseError.getCode());
      err.putString("errorDetails", databaseError.getDetails());
      err.putString("description", databaseError.getMessage());
      callback.invoke(err);
    } else {
      WritableMap res = Arguments.createMap();
      res.putString("status", "success");
      res.putString("method", methodName);
      callback.invoke(null, res);
    }
  }

  private FirestackDatabaseReference getDBHandle(final String path,
                                                 final ReadableArray modifiersArray,
                                                 final String modifiersString) {
    String key = this.getDBListenerKey(path, modifiersString);
    FirestackDatabaseReference r = mDBListeners.get(key);

    if (r == null) {
      ReactContext ctx = getReactApplicationContext();
      r = new FirestackDatabaseReference(ctx, mFirebaseDatabase, path, modifiersArray, modifiersString);
      mDBListeners.put(key, r);
    }

    return r;
  }

  private String getDBListenerKey(String path, String modifiersString) {
    return path + " | " + modifiersString;
  }
}
