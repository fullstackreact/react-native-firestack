package io.fullstack.firestack;

import android.content.Context;
import android.util.Log;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import android.net.Uri;

import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReactContext;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.FirebaseApp;

import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;

class FirestackDatabaseModule extends ReactContextBaseJavaModule {

  private static final String TAG = "FirestackDatabase";

  private Context context;
  private ReactContext mReactContext;
  private Map<String, Integer> mDBListeners = new HashMap<String, Integer>();

  public FirestackDatabaseModule(ReactApplicationContext reactContext) {
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
  public void set(final String path, final ReadableMap props, final Callback callback) {
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);
    final FirestackDatabaseModule self = this;
    Map<String, Object> m = FirestackUtils.recursivelyDeconstructReadableMap(props);

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
          callback.invoke(null, res);
        }
      }
    };

    ref.setValue(m, listener);
  }

  @ReactMethod
  public void update(final String path, final ReadableMap props, final Callback callback) {
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);
    final FirestackDatabaseModule self = this;
    Map<String, Object> m = FirestackUtils.recursivelyDeconstructReadableMap(props);

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
          callback.invoke(null, res);
        }
      }
    };

    ref.updateChildren(m, listener);
  }

  @ReactMethod
  public void remove(final String path, final Callback callback) {
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);
    final FirestackDatabaseModule self = this;
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
          callback.invoke(null, res);
        }
      }
    };

    ref.removeValue(listener);
  }

  @ReactMethod
  public void push(final String path, final ReadableMap props, final Callback callback) {
    Log.d(TAG, "Called push with " + path);
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);
    DatabaseReference newRef = ref.push();

    final Uri url = Uri.parse(newRef.toString());
    final String newPath = url.getPath();

    ReadableMapKeySetIterator iterator = props.keySetIterator();
    if (iterator.hasNextKey()) {
      Log.d(TAG, "Passed value to push");
      // lame way to check if the `props` are empty
      final FirestackDatabaseModule self = this;
      Map<String, Object> m = FirestackUtils.recursivelyDeconstructReadableMap(props);

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
  public void on(final String path, final String name, final Callback callback) {
    Log.d(TAG, "Setting a listener on event: " + name + " for path " + path);
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);
    final FirestackDatabaseModule self = this;

    if (name.equals("value")) {
      ValueEventListener listener = new ValueEventListener() {
        @Override
        public void onDataChange(DataSnapshot dataSnapshot) {
            WritableMap data = self.dataSnapshotToMap(name, dataSnapshot);
            FirestackUtils.sendEvent(mReactContext, name, data);
        }

        @Override
        public void onCancelled(DatabaseError error) {
            // Failed to read value
          Log.w(TAG, "Failed to read value.", error.toException());
          WritableMap err = Arguments.createMap();
          err.putInt("errorCode", error.getCode());
          err.putString("errorDetails", error.getDetails());
          err.putString("description", error.getMessage());
          callback.invoke(err);
        }
      };
      ref.addValueEventListener(listener);
    } else {
      ChildEventListener listener = new ChildEventListener() {
        @Override
        public void onChildAdded(DataSnapshot dataSnapshot, String previousChildName) {
          if (name.equals("child_added")) {
            WritableMap data = self.dataSnapshotToMap(name, dataSnapshot);
            FirestackUtils.sendEvent(mReactContext, name, data);
          }
        }

        @Override
        public void onChildChanged(DataSnapshot dataSnapshot, String previousChildName) {
          if (name.equals("child_changed")) {
            WritableMap data = self.dataSnapshotToMap(name, dataSnapshot);
            FirestackUtils.sendEvent(mReactContext, name, data);
          }
        }

        @Override
        public void onChildRemoved(DataSnapshot dataSnapshot) {
          if (name.equals("child_removed")) {
            WritableMap data = self.dataSnapshotToMap(name, dataSnapshot);
            FirestackUtils.sendEvent(mReactContext, name, data);
          }
        }

        @Override
        public void onChildMoved(DataSnapshot dataSnapshot, String previousChildName) {
          if (name.equals("child_moved")) {
            WritableMap data = self.dataSnapshotToMap(name, dataSnapshot);
            FirestackUtils.sendEvent(mReactContext, name, data);
          }
        }

        @Override
        public void onCancelled(DatabaseError error) {
          WritableMap err = Arguments.createMap();
          err.putInt("errorCode", error.getCode());
          err.putString("errorDetails", error.getDetails());
          err.putString("description", error.getMessage());
          FirestackUtils.sendEvent(mReactContext, "error", err);
        }
      };
      ref.addChildEventListener(listener);
    }

    // TODO: Store handles in the mDBListeners hashmap
    // Store the key of the listener... somehow
    String key = "listener_" + path + "_" + name;
    // Integer code = listener.hashCode();
    // String key = code.toString();

    // mDBListeners.put(key, code);

    Log.d(TAG, "Added listener " + key);
    WritableMap resp = Arguments.createMap();
    resp.putString("handle", key);
    callback.invoke(null, resp);
  }

  @ReactMethod
  public void onOnce(final String path, final String name, final Callback callback) {
    Log.d(TAG, "Setting one-time listener on event: " + name + " for path " + path);
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);
    final FirestackDatabaseModule self = this;

    ValueEventListener listener = new ValueEventListener() {
      @Override
      public void onDataChange(DataSnapshot dataSnapshot) {
        WritableMap data = self.dataSnapshotToMap(name, dataSnapshot);
        callback.invoke(null, data);
      }

      @Override
      public void onCancelled(DatabaseError error) {
        WritableMap err = Arguments.createMap();
        err.putInt("errorCode", error.getCode());
        err.putString("errorDetails", error.getDetails());
        err.putString("description", error.getMessage());
        callback.invoke(err);
      }
    };

    ref.addListenerForSingleValueEvent(listener);
  }

  @ReactMethod
  public void off(final String path, final String name, final Callback callback) {
    // TODO
    FirestackUtils.todoNote(TAG, "on", callback);
  }

  @ReactMethod
  public void removeListeners(final String path, final String name, final Callback callback) {
    // TODO
    FirestackUtils.todoNote(TAG, "on", callback);
  }

  private DatabaseReference getDatabaseReferenceAtPath(final String path) {
    DatabaseReference mDatabase = FirebaseDatabase.getInstance().getReference(path);
    return mDatabase;
  }

  private WritableMap dataSnapshotToMap(String name, DataSnapshot dataSnapshot) {
    WritableMap data = Arguments.createMap();

    data.putString("key", dataSnapshot.getKey());
    data.putBoolean("exists", dataSnapshot.exists());
    data.putBoolean("hasChildren", dataSnapshot.hasChildren());

    data.putDouble("childrenCount", dataSnapshot.getChildrenCount());

    WritableMap valueMap = this.castSnapshotValue(dataSnapshot);
    data.putMap("value", valueMap);

    Object priority = dataSnapshot.getPriority();
    if (priority == null) {
      data.putString("priority", "null");
    } else {
      data.putString("priority", priority.toString());
    }

    WritableMap eventMap = Arguments.createMap();
    eventMap.putString("eventName", name);
    eventMap.putMap("snapshot", data);
    return eventMap;
  }

  private <Any> Any castSnapshotValue(DataSnapshot snapshot) {
      if (snapshot.hasChildren()) {
        WritableMap data = Arguments.createMap();
        for (DataSnapshot child : snapshot.getChildren()) {
            Any castedChild = castSnapshotValue(child);
            switch (castedChild.getClass().getName()) {
                case "java.lang.Boolean":
                    data.putBoolean(child.getKey(), (Boolean) castedChild);
                    break;
                case "java.lang.Integer":
                    data.putInt(child.getKey(), (Integer) castedChild);
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
            }
        }
        return (Any) data;
    } else {
      if (snapshot.getValue() != null) {
          String type = snapshot.getValue().getClass().getName();
          switch (type) {
              case "java.lang.Boolean":
                  return (Any)((Boolean) snapshot.getValue());
              case "java.lang.Long":
                  return (Any)((Integer)(((Long) snapshot.getValue()).intValue()));
              case "java.lang.Double":
                  return (Any)((Double) snapshot.getValue());
              case "java.lang.String":
                  return (Any)((String) snapshot.getValue());
              default:
                  return (Any) null;
          }
        } else {
          return (Any) null;
        }
    }
  }
}