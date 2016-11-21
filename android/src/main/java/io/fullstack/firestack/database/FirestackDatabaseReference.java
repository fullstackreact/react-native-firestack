package io.fullstack.firestack.database;

import java.util.List;
import android.util.Log;
import java.util.HashMap;
import java.util.ListIterator;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;

import com.google.firebase.database.Query;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.ValueEventListener;

import io.fullstack.firestack.Utils;

public class FirestackDatabaseReference {
  private static final String TAG = "FirestackDatabaseReference";

  private String mPath;
  //  private ReadableArray mModifiers;
  private HashMap<String, Boolean> mListeners = new HashMap<String, Boolean>();
  private ChildEventListener mEventListener;
  private ValueEventListener mValueListener;
  private ValueEventListener mOnceValueListener;
  private ReactContext mReactContext;

  public FirestackDatabaseReference(final ReactContext context, final String path) {
    mReactContext = context;
    mPath = path;
  }

//  public void setModifiers(final ReadableArray modifiers) {
//    mModifiers = modifiers;
//  }

  public void addChildEventListener(final String name, final ReadableArray modifiersArray, final String modifiersString) {
    final FirestackDatabaseReference self = this;

    if (mEventListener == null) {
      mEventListener = new ChildEventListener() {
        @Override
        public void onChildAdded(DataSnapshot dataSnapshot, String previousChildName) {
          self.handleDatabaseEvent("child_added", mPath, modifiersString, dataSnapshot);
        }

        @Override
        public void onChildChanged(DataSnapshot dataSnapshot, String previousChildName) {
          self.handleDatabaseEvent("child_changed", mPath, modifiersString, dataSnapshot);
        }

        @Override
        public void onChildRemoved(DataSnapshot dataSnapshot) {
          self.handleDatabaseEvent("child_removed", mPath, modifiersString, dataSnapshot);
        }

        @Override
        public void onChildMoved(DataSnapshot dataSnapshot, String previousChildName) {
          self.handleDatabaseEvent("child_moved", mPath, modifiersString, dataSnapshot);
        }

        @Override
        public void onCancelled(DatabaseError error) {
          self.handleDatabaseError(name, mPath, error);
        }
      };
      Query ref = this.getDatabaseQueryAtPathAndModifiers(modifiersArray);
      ref.addChildEventListener(mEventListener);
    }
  }

  public void addValueEventListener(final String name, final ReadableArray modifiersArray, final String modifiersString) {
    final FirestackDatabaseReference self = this;

    mValueListener = new ValueEventListener() {
      @Override
      public void onDataChange(DataSnapshot dataSnapshot) {
        self.handleDatabaseEvent("value", mPath, modifiersString, dataSnapshot);
      }

      @Override
      public void onCancelled(DatabaseError error) {
        self.handleDatabaseError("value", mPath, error);
      }
    };

    Query ref = this.getDatabaseQueryAtPathAndModifiers(modifiersArray);
    ref.addValueEventListener(mValueListener);
    //this.setListeningTo(mPath, modifiersString, "value");
  }

  public void addOnceValueEventListener(final ReadableArray modifiersArray,
                                        final String modifiersString,
                                        final Callback callback) {
    final FirestackDatabaseReference self = this;

    mOnceValueListener = new ValueEventListener() {
      @Override
      public void onDataChange(DataSnapshot dataSnapshot) {
        WritableMap data = Utils.dataSnapshotToMap("value", mPath, modifiersString, dataSnapshot);
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

    Query ref = this.getDatabaseQueryAtPathAndModifiers(modifiersArray);
    ref.addListenerForSingleValueEvent(mOnceValueListener);
  }

  //public Boolean isListeningTo(final String path, String modifiersString, final String evtName) {
  //  String key = this.pathListeningKey(path, modifiersString, evtName);
  //  return mListeners.containsKey(key);
  //}

  /**
   * Note: these path/eventType listeners only get removed when javascript calls .off() and cleanup is run on the entire path
   */
  //public void setListeningTo(final String path, String modifiersString, final String evtName) {
  //  String key = this.pathListeningKey(path, modifiersString, evtName);
  //  mListeners.put(key, true);
  //}

  //public void notListeningTo(final String path, String modifiersString, final String evtName) {
  //  String key = this.pathListeningKey(path, modifiersString, evtName);
  //  mListeners.remove(key);
  //}

  //private String pathListeningKey(final String path, String modifiersString, final String eventName) {
  //return "listener/" + path + "/" + modifiersString + "/" + eventName;
  //}

  public void cleanup() {
    Log.d(TAG, "cleaning up database reference " + this);
    this.removeChildEventListener();
    this.removeValueEventListener();
  }

  public void removeChildEventListener() {
    if (mEventListener != null) {
      com.google.firebase.database.DatabaseReference ref = this.getDatabaseRef();
      ref.removeEventListener(mEventListener);
      //this.notListeningTo(mPath, "child_added");
      //this.notListeningTo(mPath, "child_changed");
      //this.notListeningTo(mPath, "child_removed");
      //this.notListeningTo(mPath, "child_moved");
      mEventListener = null;
    }
  }

  public void removeValueEventListener() {
    com.google.firebase.database.DatabaseReference ref = this.getDatabaseRef();
    if (mValueListener != null) {
      ref.removeEventListener(mValueListener);
      //this.notListeningTo(mPath, "value");
      mValueListener = null;
    }
    if (mOnceValueListener != null) {
      ref.removeEventListener(mOnceValueListener);
      mOnceValueListener = null;
    }
  }

  private void handleDatabaseEvent(final String name, final String path, final String modifiersString, final DataSnapshot dataSnapshot) {
    //if (!FirestackDatabaseReference.this.isListeningTo(path, modifiersString, name)) {
    //return;
    //}
    WritableMap data = Utils.dataSnapshotToMap(name, path, modifiersString, dataSnapshot);
    WritableMap evt = Arguments.createMap();
    evt.putString("eventName", name);
    evt.putString("path", path);
    evt.putString("modifiersString", modifiersString);
    evt.putMap("body", data);

    Utils.sendEvent(mReactContext, "database_event", evt);
  }

  private void handleDatabaseError(final String name, final String path, final DatabaseError error) {
    WritableMap err = Arguments.createMap();
    err.putInt("errorCode", error.getCode());
    err.putString("errorDetails", error.getDetails());
    err.putString("description", error.getMessage());

    WritableMap evt  = Arguments.createMap();
    evt.putString("eventName", name);
    evt.putString("path", path);
    evt.putMap("body", err);

    Utils.sendEvent(mReactContext, "database_error", evt);
  }

  public com.google.firebase.database.DatabaseReference getDatabaseRef() {
    return FirebaseDatabase.getInstance().getReference(mPath);
  }

  private Query getDatabaseQueryAtPathAndModifiers(final ReadableArray modifiers) {
    com.google.firebase.database.DatabaseReference ref = this.getDatabaseRef();

    List<Object> strModifiers = Utils.recursivelyDeconstructReadableArray(modifiers);
    ListIterator<Object> it = strModifiers.listIterator();
    Query query = ref.orderByKey();

    while(it.hasNext()) {
      String str = (String) it.next();

      String[] strArr = str.split(":");
      String methStr = strArr[0];

      if (methStr.equalsIgnoreCase("orderByKey")) {
        query = ref.orderByKey();
      } else if (methStr.equalsIgnoreCase("orderByValue")) {
        query = ref.orderByValue();
      } else if (methStr.equalsIgnoreCase("orderByPriority")) {
        query = ref.orderByPriority();
      } else if (methStr.contains("orderByChild")) {
        String key = strArr[1];
        Log.d(TAG, "orderByChild: " + key);
        query = ref.orderByChild(key);
      } else if (methStr.contains("limitToLast")) {
        String key = strArr[1];
        int limit = Integer.parseInt(key);
        Log.d(TAG, "limitToLast: " + limit);
        query = query.limitToLast(limit);
      } else if (methStr.contains("limitToFirst")) {
        String key = strArr[1];
        int limit = Integer.parseInt(key);
        Log.d(TAG, "limitToFirst: " + limit);
        query = query.limitToFirst(limit);
      } else if (methStr.contains("equalTo")) {
        String value = strArr[1];
        String key = strArr.length >= 3 ? strArr[2] : null;
        if (key == null) {
          query = query.equalTo(value);
        } else {
          query = query.equalTo(value, key);
        }
      } else if (methStr.contains("endAt")) {
        String value = strArr[1];
        String key = strArr.length >= 3 ? strArr[2] : null;
        if (key == null) {
          query = query.endAt(value);
        } else {
          query = query.endAt(value, key);
        }
      } else if (methStr.contains("startAt")) {
        String value = strArr[1];
        String key = strArr.length >= 3 ? strArr[2] : null;
        if (key == null) {
          query = query.startAt(value);
        } else {
          query = query.startAt(value, key);
        }
      }
    }

    return query;
  }

}
