package io.fullstack.firestack.database;

import java.util.List;
import android.util.Log;
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
  private static final String TAG = "FirestackDBReference";

  private Query mQuery;
  private String mPath;
  private String mModifiersString;
  private ChildEventListener mEventListener;
  private ValueEventListener mValueListener;
  private ReactContext mReactContext;

  public FirestackDatabaseReference(final ReactContext context,
                                    final FirebaseDatabase firebaseDatabase,
                                    final String path,
                                    final ReadableArray modifiersArray,
                                    final String modifiersString) {
    mReactContext = context;
    mPath = path;
    mModifiersString = modifiersString;
    mQuery = this.buildDatabaseQueryAtPathAndModifiers(firebaseDatabase, path, modifiersArray);
  }

  public void addChildEventListener(final String name) {
    if (mEventListener == null) {
      mEventListener = new ChildEventListener() {
        @Override
        public void onChildAdded(DataSnapshot dataSnapshot, String previousChildName) {
          handleDatabaseEvent("child_added", dataSnapshot);
        }

        @Override
        public void onChildChanged(DataSnapshot dataSnapshot, String previousChildName) {
          handleDatabaseEvent("child_changed", dataSnapshot);
        }

        @Override
        public void onChildRemoved(DataSnapshot dataSnapshot) {
          handleDatabaseEvent("child_removed", dataSnapshot);
        }

        @Override
        public void onChildMoved(DataSnapshot dataSnapshot, String previousChildName) {
          handleDatabaseEvent("child_moved", dataSnapshot);
        }

        @Override
        public void onCancelled(DatabaseError error) {
          handleDatabaseError(name, error);
        }
      };
      mQuery.addChildEventListener(mEventListener);
      Log.d(TAG, "Added ChildEventListener for path: " + mPath + " with modifiers: "+ mModifiersString);
    } else {
      Log.w(TAG, "Trying to add duplicate ChildEventListener for path: " + mPath + " with modifiers: "+ mModifiersString);
    }
  }

  public void addValueEventListener() {
    if (mValueListener == null) {
      mValueListener = new ValueEventListener() {
        @Override
        public void onDataChange(DataSnapshot dataSnapshot) {
          handleDatabaseEvent("value", dataSnapshot);
        }

        @Override
        public void onCancelled(DatabaseError error) {
          handleDatabaseError("value", error);
        }
      };
      mQuery.addValueEventListener(mValueListener);
      Log.d(TAG, "Added ValueEventListener for path: " + mPath + " with modifiers: "+ mModifiersString);
      //this.setListeningTo(mPath, modifiersString, "value");
    } else {
      Log.w(TAG, "trying to add duplicate ValueEventListener for path: " + mPath + " with modifiers: "+ mModifiersString);
    }
  }

  public void addOnceValueEventListener(final Callback callback) {
    final ValueEventListener onceValueEventListener = new ValueEventListener() {
      @Override
      public void onDataChange(DataSnapshot dataSnapshot) {
        WritableMap data = Utils.dataSnapshotToMap("value", mPath, mModifiersString, dataSnapshot);
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
    mQuery.addListenerForSingleValueEvent(onceValueEventListener);
    Log.d(TAG, "Added OnceValueEventListener for path: " + mPath + " with modifiers " + mModifiersString);
  }

  public void cleanup() {
    Log.d(TAG, "cleaning up database reference " + this);
    this.removeChildEventListener();
    this.removeValueEventListener();
  }

  private void removeChildEventListener() {
    if (mEventListener != null) {
      mQuery.removeEventListener(mEventListener);
      mEventListener = null;
    }
  }

  private void removeValueEventListener() {
    if (mValueListener != null) {
      mQuery.removeEventListener(mValueListener);
      mValueListener = null;
    }
  }

  private void handleDatabaseEvent(final String name, final DataSnapshot dataSnapshot) {
    WritableMap data = Utils.dataSnapshotToMap(name, mPath, mModifiersString, dataSnapshot);
    WritableMap evt = Arguments.createMap();
    evt.putString("eventName", name);
    evt.putString("path", mPath);
    evt.putString("modifiersString", mModifiersString);
    evt.putMap("body", data);

    Utils.sendEvent(mReactContext, "database_event", evt);
  }

  private void handleDatabaseError(final String name, final DatabaseError error) {
    WritableMap err = Arguments.createMap();
    err.putInt("errorCode", error.getCode());
    err.putString("errorDetails", error.getDetails());
    err.putString("description", error.getMessage());

    WritableMap evt  = Arguments.createMap();
    evt.putString("eventName", name);
    evt.putString("path", mPath);
    evt.putMap("body", err);

    Utils.sendEvent(mReactContext, "database_error", evt);
  }

  private Query buildDatabaseQueryAtPathAndModifiers(final FirebaseDatabase firebaseDatabase,
                                                     final String path,
                                                     final ReadableArray modifiers) {
    Query query = firebaseDatabase.getReference(path);
    List<Object> strModifiers = Utils.recursivelyDeconstructReadableArray(modifiers);
    ListIterator<Object> it = strModifiers.listIterator();

    while(it.hasNext()) {
      String str = (String) it.next();

      String[] strArr = str.split(":");
      String methStr = strArr[0];

      if (methStr.equalsIgnoreCase("orderByKey")) {
        query = query.orderByKey();
      } else if (methStr.equalsIgnoreCase("orderByValue")) {
        query = query.orderByValue();
      } else if (methStr.equalsIgnoreCase("orderByPriority")) {
        query = query.orderByPriority();
      } else if (methStr.contains("orderByChild")) {
        String key = strArr[1];
        Log.d(TAG, "orderByChild: " + key);
        query = query.orderByChild(key);
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
