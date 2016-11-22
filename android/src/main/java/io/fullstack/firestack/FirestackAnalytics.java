package io.fullstack.firestack;

import android.content.Context;
import android.util.Log;
import android.os.Bundle;
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
import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.analytics.FirebaseAnalytics.Event.*;
import com.google.firebase.analytics.FirebaseAnalytics.Param;

class FirestackAnalyticsModule extends ReactContextBaseJavaModule {

  private static final String TAG = "FirestackAnalytics";

  private Context context;
  private ReactContext mReactContext;
  private FirebaseAnalytics mFirebaseAnalytics;

  public FirestackAnalyticsModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext;
    mReactContext = reactContext;

    Log.d(TAG, "New instance");
    mFirebaseAnalytics = FirebaseAnalytics.getInstance(this.context);
  }

  @Override
  public String getName() {
    return TAG;
  }

  @ReactMethod
  public void logEventWithName(final String name, final ReadableMap props, final Callback callback) {
    // TODO
    // FirestackUtils.todoNote(TAG, "logEventWithName", callback);
    Map<String, Object> m = FirestackUtils.recursivelyDeconstructReadableMap(props);
    final String eventName = getEventName(name);
    final Bundle bundle = makeEventBundle(name, m);
    Log.d(TAG, "Logging event " + eventName);
    mFirebaseAnalytics.logEvent(name, bundle);
  }

  private String getEventName(final String name) {
    if (name == FirebaseAnalytics.Event.ADD_PAYMENT_INFO) {return FirebaseAnalytics.Event.ADD_PAYMENT_INFO; }
    else if (name == FirebaseAnalytics.Event.ADD_TO_CART) {return FirebaseAnalytics.Event.ADD_TO_CART;} 
    else if (name == FirebaseAnalytics.Event.ADD_TO_WISHLIST) {return FirebaseAnalytics.Event.ADD_TO_WISHLIST;} 
    else if (name == FirebaseAnalytics.Event.APP_OPEN) {return FirebaseAnalytics.Event.APP_OPEN;}
    else if (name == FirebaseAnalytics.Event.BEGIN_CHECKOUT) {return FirebaseAnalytics.Event.BEGIN_CHECKOUT;}
    else if (name == FirebaseAnalytics.Event.ECOMMERCE_PURCHASE) {return FirebaseAnalytics.Event.ECOMMERCE_PURCHASE;}
    else if (name == FirebaseAnalytics.Event.GENERATE_LEAD) {return FirebaseAnalytics.Event.GENERATE_LEAD;}
    else if (name == FirebaseAnalytics.Event.JOIN_GROUP) {return FirebaseAnalytics.Event.JOIN_GROUP;}
    else if (name == FirebaseAnalytics.Event.LEVEL_UP) {return FirebaseAnalytics.Event.LEVEL_UP;}
    else if (name == FirebaseAnalytics.Event.LOGIN) {return FirebaseAnalytics.Event.LOGIN;}
    else if (name == FirebaseAnalytics.Event.POST_SCORE) {return FirebaseAnalytics.Event.POST_SCORE;}
    else if (name == FirebaseAnalytics.Event.PRESENT_OFFER) {return FirebaseAnalytics.Event.PRESENT_OFFER;}
    else if (name == FirebaseAnalytics.Event.PURCHASE_REFUND) {return FirebaseAnalytics.Event.PURCHASE_REFUND;}
    else if (name == FirebaseAnalytics.Event.SEARCH) {return FirebaseAnalytics.Event.SEARCH;}
    else if (name == FirebaseAnalytics.Event.SELECT_CONTENT) {return FirebaseAnalytics.Event.SELECT_CONTENT;}
    else if (name == FirebaseAnalytics.Event.SHARE) {return FirebaseAnalytics.Event.SHARE;}
    else if (name == FirebaseAnalytics.Event.SIGN_UP) {return FirebaseAnalytics.Event.SIGN_UP;}
    else if (name == FirebaseAnalytics.Event.SPEND_VIRTUAL_CURRENCY) {return FirebaseAnalytics.Event.SPEND_VIRTUAL_CURRENCY;}
    else if (name == FirebaseAnalytics.Event.TUTORIAL_BEGIN) {return FirebaseAnalytics.Event.TUTORIAL_BEGIN;}
    else if (name == FirebaseAnalytics.Event.TUTORIAL_COMPLETE) {return FirebaseAnalytics.Event.TUTORIAL_COMPLETE;}
    else if (name == FirebaseAnalytics.Event.UNLOCK_ACHIEVEMENT) {return FirebaseAnalytics.Event.UNLOCK_ACHIEVEMENT;}
    else if (name == FirebaseAnalytics.Event.VIEW_ITEM) {return FirebaseAnalytics.Event.VIEW_ITEM;}
    else if (name == FirebaseAnalytics.Event.VIEW_ITEM_LIST) {return FirebaseAnalytics.Event.VIEW_ITEM_LIST;}
    else if (name == FirebaseAnalytics.Event.VIEW_SEARCH_RESULTS) {return FirebaseAnalytics.Event.VIEW_SEARCH_RESULTS;}
    else return name;
  }

  private Bundle makeEventBundle(final String name, final Map<String, Object> map) {
    Bundle bundle = new Bundle();
    // Available from the Analytics event
    if (map.containsKey("id")) {
      String id = (String) map.get("id");
      bundle.putString(FirebaseAnalytics.Param.ITEM_ID, id);
    }
    if (map.containsKey("name")) {
      String val = (String) map.get("name");
      bundle.putString(FirebaseAnalytics.Param.ITEM_NAME, val);
    }
    if (map.containsKey("category")) {
      String val = (String) map.get("category");
      bundle.putString(FirebaseAnalytics.Param.ITEM_NAME, val);
    }
    if (map.containsKey("quantity")) {
      double val = (double) map.get("quantity");
      bundle.putDouble(FirebaseAnalytics.Param.QUANTITY, val);
    }
    if (map.containsKey("price")) {
      double val = (double) map.get("price");
      bundle.putDouble(FirebaseAnalytics.Param.PRICE, val);
    }
    if (map.containsKey("value")) {
      double val = (double) map.get("value");
      bundle.putDouble(FirebaseAnalytics.Param.VALUE, val);
    }
    if (map.containsKey("currency")) {
      String val = (String) map.get("currency");
      bundle.putString(FirebaseAnalytics.Param.CURRENCY, val);
    }
    if (map.containsKey("origin")) {
      String val = (String) map.get("origin");
      bundle.putString(FirebaseAnalytics.Param.ORIGIN, val);
    }
    if (map.containsKey("item_location_id")) {
      String val = (String) map.get("item_location_id");
      bundle.putString(FirebaseAnalytics.Param.ITEM_LOCATION_ID, val);
    }
    if (map.containsKey("location")) {
      String val = (String) map.get("location");
      bundle.putString(FirebaseAnalytics.Param.LOCATION, val);
    }
    if (map.containsKey("destination")) {
      String val = (String) map.get("destination");
      bundle.putString(FirebaseAnalytics.Param.DESTINATION, val);
    }
    if (map.containsKey("start_date")) {
      String val = (String) map.get("start_date");
      bundle.putString(FirebaseAnalytics.Param.START_DATE, val);
    }
    if (map.containsKey("end_date")) {
      String val = (String) map.get("end_date");
      bundle.putString(FirebaseAnalytics.Param.END_DATE, val);
    }
    if (map.containsKey("transaction_id")) {
      String val = (String) map.get("transaction_id");
      bundle.putString(FirebaseAnalytics.Param.TRANSACTION_ID, val);
    }
    if (map.containsKey("number_of_nights")) {
      long val = (long) map.get("number_of_nights");
      bundle.putLong(FirebaseAnalytics.Param.NUMBER_OF_NIGHTS, val);
    }
    if (map.containsKey("number_of_rooms")) {
      long val = (long) map.get("number_of_rooms");
      bundle.putLong(FirebaseAnalytics.Param.NUMBER_OF_ROOMS, val);
    }
    if (map.containsKey("number_of_passengers")) {
      long val = (long) map.get("number_of_passengers");
      bundle.putLong(FirebaseAnalytics.Param.NUMBER_OF_PASSENGERS, val);
    }
    if (map.containsKey("travel_class")) {
      String val = (String) map.get("travel_class");
      bundle.putString(FirebaseAnalytics.Param.TRAVEL_CLASS, val);
    }
    if (map.containsKey("coupon")) {
      String val = (String) map.get("coupon");
      bundle.putString(FirebaseAnalytics.Param.COUPON, val);
    }
    if (map.containsKey("tax")) {
      long val = (long) map.get("tax");
      bundle.putLong(FirebaseAnalytics.Param.TAX, val);
    }
    if (map.containsKey("shipping")) {
      double val = (double) map.get("shipping");
      bundle.putDouble(FirebaseAnalytics.Param.SHIPPING, val);
    }
    if (map.containsKey("group_id")) {
      String val = (String) map.get("group_id");
      bundle.putString(FirebaseAnalytics.Param.GROUP_ID, val);
    }
    if (map.containsKey("level")) {
      long val = (long) map.get("level");
      bundle.putLong(FirebaseAnalytics.Param.LEVEL, val);
    }
    if (map.containsKey("character")) {
      String val = (String) map.get("character");
      bundle.putString(FirebaseAnalytics.Param.CHARACTER, val);
    }
    if (map.containsKey("score")) {
      long val = (long) map.get("score");
      bundle.putLong(FirebaseAnalytics.Param.SCORE, val);
    }
    if (map.containsKey("search_term")) {
      String val = (String) map.get("search_term");
      bundle.putString(FirebaseAnalytics.Param.SEARCH_TERM, val);
    }
    if (map.containsKey("content_type")) {
      String val = (String) map.get("content_type");
      bundle.putString(FirebaseAnalytics.Param.CONTENT_TYPE, val);
    }
    if (map.containsKey("sign_up_method")) {
      String val = (String) map.get("sign_up_method");
      bundle.putString(FirebaseAnalytics.Param.SIGN_UP_METHOD, val);
    }
    if (map.containsKey("virtual_currency_name")) {
      String val = (String) map.get("virtual_currency_name");
      bundle.putString(FirebaseAnalytics.Param.VIRTUAL_CURRENCY_NAME, val);
    }
    if (map.containsKey("achievement_id")) {
      String val = (String) map.get("achievement_id");
      bundle.putString(FirebaseAnalytics.Param.ACHIEVEMENT_ID, val);
    }
    if (map.containsKey("flight_number")) {
      String val = (String) map.get("flight_number");
      bundle.putString(FirebaseAnalytics.Param.FLIGHT_NUMBER, val);
    }

    Iterator<Map.Entry<String, Object>> entries = map.entrySet().iterator();
    while (entries.hasNext()) {
      Map.Entry<String, Object> entry = entries.next();
      if (bundle.getBundle(entry.getKey()) == null) {
        bundle.putString(entry.getKey(), entry.getValue().toString());
      }
    }
    return bundle;
  }
}
