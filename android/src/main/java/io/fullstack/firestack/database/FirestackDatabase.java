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

  public FirestackDatabase(ReactApplicationContext reactContext) {
    super(reactContext);
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
        FirebaseDatabase.getInstance()
          .setPersistenceEnabled(enable);
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
      DatabaseReference ref = this.getDatabaseReferenceAtPath(path);
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
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);

    final FirestackDatabase self = this;
    Map<String, Object> m = Utils.recursivelyDeconstructReadableMap(props);

    DatabaseReference.CompletionListener listener = new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handleCallback("set", callback, error, ref);
      }
    };

    ref.setValue(m, listener);
  }

  @ReactMethod
  public void update(final String path,
                     final ReadableMap props,
                     final Callback callback) {
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);
    final FirestackDatabase self = this;
    Map<String, Object> m = Utils.recursivelyDeconstructReadableMap(props);

    DatabaseReference.CompletionListener listener = new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handleCallback("update", callback, error, ref);
      }
    };

    ref.updateChildren(m, listener);
  }

  @ReactMethod
  public void remove(final String path,
                     final Callback callback) {
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);
    final FirestackDatabase self = this;
    DatabaseReference.CompletionListener listener = new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError error, DatabaseReference ref) {
        handleCallback("remove", callback, error, ref);
      }
    };

    ref.removeValue(listener);
  }

  @ReactMethod
  public void push(final String path,
                   final ReadableMap props,
                   final Callback callback) {

    Log.d(TAG, "Called push with " + path);
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);
    DatabaseReference newRef = ref.push();

    final Uri url = Uri.parse(newRef.toString());
    final String newPath = url.getPath();

    ReadableMapKeySetIterator iterator = props.keySetIterator();
    if (iterator.hasNextKey()) {
      Log.d(TAG, "Passed value to push");
      // lame way to check if the `props` are empty
      final FirestackDatabase self = this;
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
      res.putString("result", "success");
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
    FirestackDatabaseReference ref = this.getDBHandle(path, modifiersString);

    WritableMap resp = Arguments.createMap();

    if (name.equals("value")) {
      ref.addValueEventListener(name, modifiersArray, modifiersString);
    } else {
      ref.addChildEventListener(name, modifiersArray, modifiersString);
    }

    this.saveDBHandle(path, modifiersString, ref);
    resp.putString("result", "success");
    Log.d(TAG, "Added listener " + name + " for " + ref + "with modifiers: "+ modifiersString);

    resp.putString("handle", path);
    callback.invoke(null, resp);
  }

  @ReactMethod
  public void onOnce(final String path,
                     final String modifiersString,
                     final ReadableArray modifiersArray,
                     final String name,
                     final Callback callback) {
    Log.d(TAG, "Setting one-time listener on event: " + name + " for path " + path);
    FirestackDatabaseReference ref = this.getDBHandle(path, modifiersString);
    ref.addOnceValueEventListener(modifiersArray, modifiersString, callback);
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
          @Deprecated final String name,
          final Callback callback) {
    this.removeDBHandle(path, modifiersString);
    Log.d(TAG, "Removed listener " + path + "/" + modifiersString);
    WritableMap resp = Arguments.createMap();
    resp.putString("handle", path);
    resp.putString("result", "success");
    callback.invoke(null, resp);
  }

  // On Disconnect
  @ReactMethod
  public void onDisconnectSetObject(final String path, final ReadableMap props, final Callback callback) {
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);
    Map<String, Object> m = Utils.recursivelyDeconstructReadableMap(props);

    OnDisconnect od = ref.onDisconnect();
    od.setValue(m, new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError databaseError, DatabaseReference databaseReference) {
        handleCallback("onDisconnectSetObject", callback, databaseError, databaseReference);
      }
    });
  }

  @ReactMethod
  public void onDisconnectSetString(final String path, final String value, final Callback callback) {
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);

    OnDisconnect od = ref.onDisconnect();
    od.setValue(value, new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError databaseError, DatabaseReference databaseReference) {
        handleCallback("onDisconnectSetString", callback, databaseError, databaseReference);
      }
    });
  }

  @ReactMethod
  public void onDisconnectRemove(final String path, final Callback callback) {
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);

    OnDisconnect od = ref.onDisconnect();
    od.removeValue(new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError databaseError, DatabaseReference databaseReference) {
        handleCallback("onDisconnectRemove", callback, databaseError, databaseReference);
      }
    });
  }
  @ReactMethod
  public void onDisconnectCancel(final String path, final Callback callback) {
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);

    OnDisconnect od = ref.onDisconnect();
    od.cancel(new DatabaseReference.CompletionListener() {
      @Override
      public void onComplete(DatabaseError databaseError, DatabaseReference databaseReference) {
        handleCallback("onDisconnectCancel", callback, databaseError, databaseReference);
      }
    });
  }

  // Private helpers
  // private void handleDatabaseEvent(final String name, final DataSnapshot dataSnapshot) {
  //   WritableMap data = this.dataSnapshotToMap(name, dataSnapshot);
  //   WritableMap evt  = Arguments.createMap();
  //   evt.putString("eventName", name);
  //   evt.putMap("body", data);
  //   Utils.sendEvent(mReactContext, "database_event", evt);
  // }

  // private void handleDatabaseError(final String name, final DatabaseError error) {
  //   WritableMap err = Arguments.createMap();
  //   err.putInt("errorCode", error.getCode());
  //   err.putString("errorDetails", error.getDetails());
  //   err.putString("description", error.getMessage());

  //   WritableMap evt  = Arguments.createMap();
  //   evt.putString("eventName", name);
  //   evt.putMap("body", err);
  //   Utils.sendEvent(mReactContext, "database_error", evt);
  // }

  private void handleCallback(
          final String methodName,
          final Callback callback,
          final DatabaseError databaseError,
          final DatabaseReference databaseReference) {
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

  private FirestackDatabaseReference getDBHandle(final String path, final String modifiersString) {
    String key = this.getDBListenerKey(path, modifiersString);
    if (!mDBListeners.containsKey(key)) {
      ReactContext ctx = getReactApplicationContext();
      mDBListeners.put(key, new FirestackDatabaseReference(ctx, path));
    }

    return mDBListeners.get(key);
  }

  private void saveDBHandle(final String path, String modifiersString, final FirestackDatabaseReference dbRef) {
    String key = this.getDBListenerKey(path, modifiersString);
    mDBListeners.put(key, dbRef);
  }

  private String getDBListenerKey(String path, String modifiersString) {
    return path + " | " + modifiersString;
  }

  private void removeDBHandle(final String path, String modifiersString) {
    String key = this.getDBListenerKey(path, modifiersString);
    if (mDBListeners.containsKey(key)) {
      FirestackDatabaseReference r = mDBListeners.get(key);
      r.cleanup();
      mDBListeners.remove(key);
    }
  }

  private String keyPath(final String path, final String eventName) {
    return path + "-" + eventName;
  }

  // TODO: move to FirestackDatabaseReference?
  private DatabaseReference getDatabaseReferenceAtPath(final String path) {
    DatabaseReference mDatabase = FirebaseDatabase.getInstance().getReference(path);
    return mDatabase;
  }
}
