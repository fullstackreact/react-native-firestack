package io.fullstack.firestack;

import android.content.Context;
import android.util.Log;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactContext;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FacebookAuthProvider;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GetTokenResult;
import com.google.firebase.auth.GoogleAuthProvider;

class FirestackModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
  private static final String TAG = "FirestackModule";
  private Context context;
  private ReactContext mReactContext;
  private FirebaseAuth mAuth;
  private FirebaseApp app;
  private FirebaseUser user;
  private FirebaseAuth.AuthStateListener mAuthListener;

  public FirestackModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext;
    mReactContext = reactContext;

    Log.d(TAG, "New FirestackModule instance");
  }

  @Override
  public String getName() {
    return "Firestack";
  }

  @ReactMethod
  public void configureWithOptions(ReadableMap params, @Nullable final Callback onComplete) {
    Log.i(TAG, "configureWithOptions");

    FirebaseOptions.Builder builder = new FirebaseOptions.Builder();

    if (params.hasKey("applicationId")) {
      final String applicationId = params.getString("applicationId");
      Log.d(TAG, "Setting applicationId from params " + applicationId);
      builder.setApplicationId(applicationId);
    }
    if (params.hasKey("apiKey")) {
      final String apiKey = params.getString("apiKey");
      Log.d(TAG, "Setting API key from params " + apiKey);
      builder.setApiKey(apiKey);
    }
    if (params.hasKey("gcmSenderID")) {
      final String gcmSenderID = params.getString("gcmSenderID");
      Log.d(TAG, "Setting gcmSenderID from params " + gcmSenderID );
      builder.setGcmSenderId(gcmSenderID);
    }
    if (params.hasKey("storageBucket")) {
      final String storageBucket = params.getString("storageBucket");
      Log.d(TAG, "Setting storageBucket from params " + storageBucket);
      builder.setStorageBucket(storageBucket);
    }
    if (params.hasKey("databaseURL")) {
      final String databaseURL = params.getString("databaseURL");
      Log.d(TAG, "Setting databaseURL from params " + databaseURL);
      builder.setDatabaseUrl(databaseURL);
    }
    if (params.hasKey("clientID")) {
      final String clientID = params.getString("clientID");
      Log.d(TAG, "Setting clientID from params " + clientID);
      builder.setApplicationId(clientID);
    }

    try {
        Log.i(TAG, "Configuring app");
        if (app == null) {
          app = FirebaseApp.initializeApp(mReactContext, builder.build());
        }
        Log.i(TAG, "Configured");
        System.out.println("Configured");

        WritableMap resp = Arguments.createMap();
        resp.putString("msg", "success");
        onComplete.invoke(null, resp);
    }
    catch (Exception ex){
        Log.e(TAG, "ERROR configureWithOptions");
        Log.e(TAG, ex.getMessage());

        WritableMap resp = Arguments.createMap();
        resp.putString("msg", ex.getMessage());

        onComplete.invoke(resp);
    }
  }

  @ReactMethod
  public void listenForAuth() {
    mAuthListener = new FirebaseAuth.AuthStateListener() {

    @Override
    public void onAuthStateChanged(@NonNull FirebaseAuth firebaseAuth) {
        WritableMap msgMap = Arguments.createMap();
        msgMap.putString("eventName", "listenForAuth");

        FirebaseUser user = firebaseAuth.getCurrentUser();
        if (user != null) {
            WritableMap userMap = getUserMap();

            msgMap.putBoolean("authenticated", true);
            msgMap.putMap("user", userMap);

            sendEvent("listenForAuth", msgMap);
        } else {
            msgMap.putBoolean("authenticated", false);
            sendEvent("listenForAuth", msgMap);
        }
        }
      };
    }

    @ReactMethod
    public void createUserWithEmailAndPassword(final String email, final String password, final Callback onSuccess, final Callback onFail) {
      mAuth = FirebaseAuth.getInstance();

      mAuth.createUserWithEmailAndPassword(email, password)
              .addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                  @Override
                  public void onComplete(@NonNull Task<AuthResult> task) {
                      if (task.isSuccessful()) {
                          user = task.getResult().getUser();
                          userCallback(onSuccess);
                      }else{
                          userErrorCallback(task, onFail);
                      }
                  }
              });
    }

    @ReactMethod
    public void signInWithEmailAndPassword(final String email, final String password, final Callback onSuccess, final Callback onFail) {
        mAuth = FirebaseAuth.getInstance();

        mAuth.signInWithEmailAndPassword(email, password)
                .addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                    @Override
                    public void onComplete(@NonNull Task<AuthResult> task) {
                        if (task.isSuccessful()) {
                            user = task.getResult().getUser();
                            userCallback(onSuccess);
                        } else {
                            userErrorCallback(task, onFail);
                        }
                    }
                });
    }

    @ReactMethod
    public void getCurrentUser(final Callback onSuccess, final Callback onFail) {
        mAuth = FirebaseAuth.getInstance();

        user = mAuth.getCurrentUser();
        if(user == null){
            onFail.invoke("not logged in");
        }else{
            userCallback(onSuccess);
        }
    }

    @ReactMethod
    public void sendPasswordResetEmail(String email, final Callback onSuccess, final Callback onFail) {
        mAuth = FirebaseAuth.getInstance();

        mAuth.sendPasswordResetEmail(email)
                .addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        if(task.isSuccessful()){
                            onSuccess.invoke("complete");
                        }else{
                            onFail.invoke(task.getException().toString());
                        }
                    }
                });
    }

    @ReactMethod
    public void googleLogin(String IdToken, final Callback onSuccess, final Callback onFail) {
        mAuth = FirebaseAuth.getInstance();

        AuthCredential credential = GoogleAuthProvider.getCredential(IdToken, null);
        mAuth.signInWithCredential(credential)
                .addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                    @Override
                    public void onComplete(@NonNull Task<AuthResult> task) {
                        if (task.isSuccessful()) {
                            user = task.getResult().getUser();
                            userCallback(onSuccess);
                        }else{
                            userErrorCallback(task, onFail);
                        }
                    }
                });
    }

    @ReactMethod
    public void facebookLogin(String Token, final Callback onSuccess, final Callback onFail) {
        mAuth = FirebaseAuth.getInstance();

        AuthCredential credential = FacebookAuthProvider.getCredential(Token);
        mAuth.signInWithCredential(credential)
                .addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                    @Override
                    public void onComplete(@NonNull Task<AuthResult> task) {
                        if (task.isSuccessful()) {
                            user = task.getResult().getUser();
                            userCallback(onSuccess);
                        }else{
                            userErrorCallback(task, onFail);
                        }
                    }
                });
    }

    public void userCallback(final Callback onSuccess) {
        mAuth = FirebaseAuth.getInstance();
        WritableMap userMap = getUserMap();

        user.getToken(true).addOnCompleteListener(new OnCompleteListener<GetTokenResult>() {
            @Override
            public void onComplete(@NonNull Task<GetTokenResult> task) {
                WritableMap userMap = Arguments.createMap();

                userMap.putString("token", task.getResult().getToken());
                userMap.putString("email", user.getEmail());
                userMap.putString("uid", user.getUid());
                userMap.putString("provider", user.getProviderId());

                onSuccess.invoke(userMap);
            }
        });
    }

    private WritableMap getUserMap() {
        WritableMap userMap = Arguments.createMap();

        userMap.putString("email", user.getEmail());
        userMap.putString("uid", user.getUid());
        userMap.putString("provider", user.getProviderId());

        return userMap;
    }

    /**
    * send a JS event
    **/
    private void sendEvent(String eventName,
                       WritableMap params) {
        mReactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }

    public void noUserCallback(final Callback callback) {
        WritableMap message = Arguments.createMap();

        message.putString("errorMessage", "no_user");
        message.putString("eventName", "no_user");
        message.putBoolean("authenticated", false);

        callback.invoke(message);
    }

    public void userErrorCallback(Task<AuthResult> task, final Callback onFail) {
        WritableMap error = Arguments.createMap();
        error.putInt("errorCode", task.getException().hashCode());
        error.putString("errorMessage", task.getException().getMessage());
        error.putString("allErrorMessage", task.getException().toString());

        onFail.invoke(error);
    }

    @Override
    public void onHostResume() {
        WritableMap params = Arguments.createMap();
        params.putBoolean("isForground", true);
        sendEvent("FirestackAppState", params);
    }

    @Override
    public void onHostPause() {
        WritableMap params = Arguments.createMap();
        params.putBoolean("isForground", false);
        sendEvent("FirestackAppState", params);
    }

    @Override
    public void onHostDestroy() {

    }
}