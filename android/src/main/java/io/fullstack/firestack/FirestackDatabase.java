package io.fullstack.firestack;

import android.content.Context;
import android.util.Log;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

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
    // TODO
    FirestackUtils.todoNote(TAG, "set", callback);
  }

  @ReactMethod
  public void update(final String path, final ReadableMap props, final Callback callback) {
    // TODO
    FirestackUtils.todoNote(TAG, "update", callback);
  }

  @ReactMethod
  public void remove(final String path, final Callback callback) {
    // TODO
    FirestackUtils.todoNote(TAG, "remove", callback);
  }

  @ReactMethod
  public void on(final String path, final String name, final Callback callback) {
    // TODO
    // FirestackUtils.todoNote(TAG, "on", callback);
    Log.d(TAG, "Setting a listener on event: " + name + " for path " + path);
    DatabaseReference ref = this.getDatabaseReferenceAtPath(path);

    if (name == "value") {
      ValueEventListener listener = new ValueEventListener() {
        @Override
        public void onDataChange(DataSnapshot dataSnapshot) {
            // This method is called once with the initial value and again
            // whenever data at this location is updated.
            String value = dataSnapshot.getValue(String.class);
            Log.d(TAG, "Value is: " + value);
        }

        @Override
        public void onCancelled(DatabaseError error) {
            // Failed to read value
            Log.w(TAG, "Failed to read value.", error.toException());
        }
      };
      ref.addValueEventListener(listener);
    } else {
      ChildEventListener listener = new ChildEventListener() {
        @Override
        public void onChildAdded(DataSnapshot dataSnapshot, String previousChildName) {
          Log.d(TAG, "onChildAdded:" + dataSnapshot.getKey());
        }

        @Override
        public void onChildChanged(DataSnapshot dataSnapshot, String previousChildName) {
          Log.d(TAG, "onChildChanged:" + dataSnapshot.getKey());
        }

        @Override
        public void onChildRemoved(DataSnapshot dataSnapshot) {
          Log.d(TAG, "onChildRemoved:" + dataSnapshot.getKey());
        }

        @Override
        public void onChildMoved(DataSnapshot dataSnapshot, String previousChildName) {
          Log.d(TAG, "onChildMoved:" + dataSnapshot.getKey());
        }

        @Override
        public void onCancelled(DatabaseError databaseError) {
          Log.w(TAG, "onCancelled", databaseError.toException());
        }
      };
      ref.addChildEventListener(listener);
    }

    // Store the key of the listener... somehow
    String key = "listener_" + path + "_" + name;
    // Integer code = listener.hashCode();
    // String key = code.toString();

    // mDBListeners.put(key, code);

    WritableMap resp = Arguments.createMap();
    resp.putString("handle", key);
    callback.invoke(null, resp);
  }

  @ReactMethod
  public void onOnce(final String path, final String name, final Callback callback) {
    // TODO
    FirestackUtils.todoNote(TAG, "onOnce", callback);
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
}