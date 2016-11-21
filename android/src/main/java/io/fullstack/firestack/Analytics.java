package io.fullstack.firestack;

import java.util.Map;
import android.util.Log;
import android.os.Bundle;
import android.app.Activity;

import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

class Analytics extends ReactContextBaseJavaModule {

  private static final String TAG = "FirestackAnalytics";

  private ReactApplicationContext context;
  private FirebaseAnalytics mFirebaseAnalytics;

  public Analytics(ReactApplicationContext reactContext) {
    super(reactContext);
    context = reactContext;
    Log.d(TAG, "New instance");
    mFirebaseAnalytics = FirebaseAnalytics.getInstance(this.context);
  }

  /**
   *
   * @return
   */
  @Override
  public String getName() {
    return TAG;
  }

  @ReactMethod
  public void logEvent(final String name, final ReadableMap params) {
    Map<String, Object> m = Utils.recursivelyDeconstructReadableMap(params);
    final Bundle bundle = makeEventBundle(name, m);
    Log.d(TAG, "Logging event " + name);
    mFirebaseAnalytics.logEvent(name, bundle);
  }

  /**
   *
   * @param enabled
   */
  @ReactMethod
  public void setAnalyticsCollectionEnabled(final Boolean enabled) {
    mFirebaseAnalytics.setAnalyticsCollectionEnabled(enabled);
  }

  /**
   *
   * @param screenName
   * @param screenClassOverride
   */
  @ReactMethod
  public void setCurrentScreen(final String screenName, final String screenClassOverride) {
    final Activity activity = getCurrentActivity();
    if (activity != null) {
      Log.d(TAG, "setCurrentScreen " + screenName + " - " + screenClassOverride);
      // needs to be run on main thread
      activity.runOnUiThread(new Runnable() {
        @Override
        public void run() {
          mFirebaseAnalytics.setCurrentScreen(activity, screenName, screenClassOverride);
        }
      });
    }
  }

  /**
   *
   * @param milliseconds
   */
  @ReactMethod
  public void setMinimumSessionDuration(final double milliseconds) {
    mFirebaseAnalytics.setMinimumSessionDuration((long) milliseconds);
  }

  /**
   *
   * @param milliseconds
   */
  @ReactMethod
  public void setSessionTimeoutDuration(final double milliseconds) {
    mFirebaseAnalytics.setSessionTimeoutDuration((long) milliseconds);
  }

  /**
   *
   * @param id
   */
  @ReactMethod
  public void setUserId(final String id) {
    mFirebaseAnalytics.setUserId(id);
  }

  /**
   *
   * @param name
   * @param value
   */
  @ReactMethod
  public void setUserProperty(final String name, final String value) {
    mFirebaseAnalytics.setUserProperty(name, value);
  }

  // todo refactor/clean me
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
      long val = (long) map.get("quantity");
      bundle.putLong(FirebaseAnalytics.Param.QUANTITY, val);
    }
    if (map.containsKey("price")) {
      long val = (long) map.get("price");
      bundle.putLong(FirebaseAnalytics.Param.PRICE, val);
    }
    if (map.containsKey("value")) {
      long val = (long) map.get("value");
      bundle.putLong(FirebaseAnalytics.Param.VALUE, val);
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
      bundle.putDouble(FirebaseAnalytics.Param.NUMBER_OF_PASSENGERS, val);
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

    for (Map.Entry<String, Object> entry : map.entrySet()) {
      if (bundle.getBundle(entry.getKey()) == null) {
        bundle.putString(entry.getKey(), entry.getValue().toString());
      }
    }

    return bundle;
  }
}
