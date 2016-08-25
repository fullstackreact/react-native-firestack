package io.fullstack.firestack;

import android.content.Context;
import android.util.Log;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
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

class FirestackAuthModule extends ReactContextBaseJavaModule {
  private static final String TAG = "FirestackAuth";

  private Context context;
  private ReactContext mReactContext;
  private FirebaseAuth mAuth;
  private FirebaseApp app;
  private FirebaseUser user;
  private FirebaseAuth.AuthStateListener mAuthListener;

  public FirestackAuthModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext;
    mReactContext = reactContext;

    Log.d(TAG, "New FirestackAuth instance");
  }

  @Override
  public String getName() {
    return TAG;
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

            FirestackUtils.sendEvent(mReactContext, "listenForAuth", msgMap);
        } else {
            msgMap.putBoolean("authenticated", false);
            FirestackUtils.sendEvent(mReactContext, "listenForAuth", msgMap);
        }
        }
      };
    }

    @ReactMethod
    public void createUserWithEmail(final String email, final String password, final Callback onComplete) {
      mAuth = FirebaseAuth.getInstance();

      mAuth.createUserWithEmailAndPassword(email, password)
              .addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                  @Override
                  public void onComplete(@NonNull Task<AuthResult> task) {
                      if (task.isSuccessful()) {
                          user = task.getResult().getUser();
                          userCallback(user, onComplete);
                      }else{
                          userErrorCallback(task, onComplete);
                      }
                  }
              });
    }

    @ReactMethod
    public void signInWithEmail(final String email, final String password, final Callback callback) {
        mAuth = FirebaseAuth.getInstance();

        mAuth.signInWithEmailAndPassword(email, password)
                .addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                    @Override
                    public void onComplete(@NonNull Task<AuthResult> task) {
                        if (task.isSuccessful()) {
                            user = task.getResult().getUser();
                            userCallback(user, callback);
                        } else {
                            userErrorCallback(task, callback);
                        }
                    }
                });
    }

    @ReactMethod
    public void signInWithProvider(final String provider, final String authToken, final String authSecret, final Callback callback) {
      // TODO
      FirestackUtils.todoNote(TAG, "signInWithProvider", callback);
    }

    @ReactMethod
    public void signInWithCustomToken(final String customToken, final Callback callback) {
      // TODO
      FirestackUtils.todoNote(TAG, "signInWithCustomToken", callback);
    }

    @ReactMethod
    public void reauthenticateWithCredentialForProvider(final String provider, final String authToken, final String authSecret, final Callback callback) {
      // TODO:
      FirestackUtils.todoNote(TAG, "reauthenticateWithCredentialForProvider", callback);
    }

    @ReactMethod
    public void updateUserEmail(final String email, final Callback callback) {
      // TODO
      FirestackUtils.todoNote(TAG, "updateUserEmail", callback);
    }

    @ReactMethod
    public void updateUserPassword(final String newPassword, final Callback callback) {
      // TODO
      FirestackUtils.todoNote(TAG, "updateUserPassword", callback);
    }

    @ReactMethod
    public void sendPasswordResetWithEmail(final String email, final Callback callback) {
        mAuth = FirebaseAuth.getInstance();

        mAuth.sendPasswordResetEmail(email)
                .addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        if(task.isSuccessful()){
                            WritableMap resp = Arguments.createMap();
                            resp.putString("status", "complete");
                            callback.invoke(null, resp);
                        }else{
                            callback.invoke(task.getException().toString());
                        }
                    }
                });
    }

    @ReactMethod
    public void deleteUser(final Callback callback) {
      // TODO
      FirestackUtils.todoNote(TAG, "deleteUser", callback);
    }

    @ReactMethod
    public void getToken(final Callback callback) {
      // TODO
      FirestackUtils.todoNote(TAG, "getToken", callback);
    }

    @ReactMethod
    public void updateUserProfile(final ReadableMap props, final Callback callback) {
      // TODO
      FirestackUtils.todoNote(TAG, "updateUserProfile", callback);
    }

    @ReactMethod
    public void signOut(final Callback callback) {
      // TODO
      FirestackUtils.todoNote(TAG, "signOut", callback);
    }

    @ReactMethod
    public void getCurrentUser(final Callback callback) {
        mAuth = FirebaseAuth.getInstance();

        user = mAuth.getCurrentUser();
        if(user == null){
            noUserCallback(callback);
        }else{
            userCallback(user, callback);
        }
    }

    @ReactMethod
    public void logEventWithName(final String name, final String props, final Callback callback) {
      // TODO
      FirestackUtils.todoNote(TAG, "logEventWithName", callback);
    }


    // TODO: Check these things
    @ReactMethod
    public void googleLogin(String IdToken, final Callback callback) {
        mAuth = FirebaseAuth.getInstance();

        AuthCredential credential = GoogleAuthProvider.getCredential(IdToken, null);
        mAuth.signInWithCredential(credential)
                .addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                    @Override
                    public void onComplete(@NonNull Task<AuthResult> task) {
                        if (task.isSuccessful()) {
                            user = task.getResult().getUser();
                            userCallback(user, callback);
                        }else{
                            userErrorCallback(task, callback);
                        }
                    }
                });
    }

    @ReactMethod
    public void facebookLogin(String Token, final Callback callback) {
        mAuth = FirebaseAuth.getInstance();

        AuthCredential credential = FacebookAuthProvider.getCredential(Token);
        mAuth.signInWithCredential(credential)
                .addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                    @Override
                    public void onComplete(@NonNull Task<AuthResult> task) {
                        if (task.isSuccessful()) {
                            user = task.getResult().getUser();
                            userCallback(user, callback);
                        }else{
                            userErrorCallback(task, callback);
                        }
                    }
                });
    }

    // Internal helpers
    public void userCallback(FirebaseUser passedUser, final Callback onComplete) {
        WritableMap userMap = getUserMap();

        if (passedUser == null) {
          mAuth = FirebaseAuth.getInstance();
          final FirebaseUser user = mAuth.getCurrentUser();
        } else {
          final FirebaseUser user = passedUser;
        }

        user.getToken(true).addOnCompleteListener(new OnCompleteListener<GetTokenResult>() {
            @Override
            public void onComplete(@NonNull Task<GetTokenResult> task) {
                WritableMap userMap = Arguments.createMap();

                final String token = task.getResult().getToken();
                final String email = user.getEmail();
                final String uid   = user.getUid();
                final String provider = user.getProviderId();

                userMap.putString("token", token);
                userMap.putString("email", email);
                userMap.putString("uid", uid);
                userMap.putString("provider", provider);

                onComplete.invoke(null, userMap);
            }
        });
    }

    public void noUserCallback(final Callback callback) {
        WritableMap message = Arguments.createMap();

        message.putString("errorMessage", "no_user");
        message.putString("eventName", "no_user");
        message.putBoolean("authenticated", false);

        callback.invoke(null, message);
    }

    public void userErrorCallback(Task<AuthResult> task, final Callback onFail) {
        WritableMap error = Arguments.createMap();
        error.putInt("errorCode", task.getException().hashCode());
        error.putString("errorMessage", task.getException().getMessage());
        error.putString("allErrorMessage", task.getException().toString());

        onFail.invoke(error);
    }

    private WritableMap getUserMap() {
        WritableMap userMap = Arguments.createMap();

        userMap.putString("email", user.getEmail());
        userMap.putString("uid", user.getUid());
        userMap.putString("provider", user.getProviderId());

        return userMap;
    }


}