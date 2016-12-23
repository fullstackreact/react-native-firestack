
package io.fullstack.firestack;

import android.content.Context;
import android.util.Log;
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
import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactContext;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.UserProfileChangeRequest;
import com.google.firebase.auth.FacebookAuthProvider;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GetTokenResult;
import com.google.firebase.auth.GoogleAuthProvider;
import com.google.firebase.auth.FirebaseAuthException;

class FirestackAuthModule extends ReactContextBaseJavaModule {
  private final int NO_CURRENT_USER = 100;
  private final int ERROR_FETCHING_TOKEN = 101;

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

        if (firebaseAuth.getCurrentUser() != null) {
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

      mAuth = FirebaseAuth.getInstance();
      mAuth.addAuthStateListener(mAuthListener);
    }

    @ReactMethod
    public void unlistenForAuth(final Callback callback) {
      if (mAuthListener != null) {
        mAuth.removeAuthStateListener(mAuthListener);

        WritableMap resp = Arguments.createMap();
        resp.putString("status", "complete");

        callback.invoke(null, resp);
      }
    }

    @ReactMethod
    public void createUserWithEmail(final String email, final String password, final Callback callback) {
      mAuth = FirebaseAuth.getInstance();

      mAuth.createUserWithEmailAndPassword(email, password)
              .addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                  @Override
                  public void onComplete(@NonNull Task<AuthResult> task) {
                      if (task.isSuccessful()) {
                        FirestackAuthModule.this.user = task.getResult().getUser();
                        userCallback(FirestackAuthModule.this.user, callback);
                      } else {
                        // userErrorCallback(task, callback);
                      }
                  }
            }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception ex) {
                userExceptionCallback(ex, callback);
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
                    FirestackAuthModule.this.user = task.getResult().getUser();
                    userCallback(FirestackAuthModule.this.user, callback);
                  } else {
                    // userErrorCallback(task, callback);
                  }
                }
            }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception ex) {
                Log.e(TAG, "An exception occurred: " + ex.getMessage());
                userExceptionCallback(ex, callback);
              }
            });
    }

    @ReactMethod
    public void signInWithProvider(final String provider, final String authToken, final String authSecret, final Callback callback) {
      if (provider.equals("facebook")) {
           this.facebookLogin(authToken,callback);
      } else if (provider.equals("google")) {
           this.googleLogin(authToken,callback);
      } else
      // TODO
      FirestackUtils.todoNote(TAG, "signInWithProvider", callback);
    }

    @ReactMethod
    public void signInAnonymously(final Callback callback) {
        mAuth = FirebaseAuth.getInstance();

        mAuth.signInAnonymously()
                .addOnCompleteListener(new OnCompleteListener<AuthResult>() {
                    @Override
                    public void onComplete(@NonNull Task<AuthResult> task) {
                        Log.d(TAG, "signInAnonymously:onComplete:" + task.isSuccessful());

                        if (task.isSuccessful()) {
                          FirestackAuthModule.this.user = task.getResult().getUser();
                          userCallback(FirestackAuthModule.this.user, callback);
                        } else {
                          // userErrorCallback(task, callback);
                        }
                      }
              }).addOnFailureListener(new OnFailureListener() {
                @Override
                public void onFailure(@NonNull Exception ex) {
                  userExceptionCallback(ex, callback);
                }
              });
    }

    @ReactMethod
    public void signInWithCustomToken(final String customToken, final Callback callback) {
      mAuth = FirebaseAuth.getInstance();

      mAuth.signInWithCustomToken(customToken)
        .addOnCompleteListener(new OnCompleteListener<AuthResult>() {
            @Override
            public void onComplete(@NonNull Task<AuthResult> task) {
                Log.d(TAG, "signInWithCustomToken:onComplete:" + task.isSuccessful());
                  if (task.isSuccessful()) {
                      FirestackAuthModule.this.user = task.getResult().getUser();
                    userCallback(FirestackAuthModule.this.user, callback);
                  } else {
                      // userErrorCallback(task, callback);
                  }
            }
        }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception ex) {
                userExceptionCallback(ex, callback);
              }
            });
    }

    @ReactMethod
    public void reauthenticateWithCredentialForProvider(final String provider, final String authToken, final String authSecret, final Callback callback) {
        AuthCredential credential;

        if (provider.equals("facebook")) {
            credential = FacebookAuthProvider.getCredential(authToken);
        } else if (provider.equals("google")) {
            credential = GoogleAuthProvider.getCredential(authToken, null);
        } else {
            // TODO:
            FirestackUtils.todoNote(TAG, "reauthenticateWithCredentialForProvider", callback);
            // AuthCredential credential;
            // Log.d(TAG, "reauthenticateWithCredentialForProvider called with: " + provider);
            return;
        }

        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        if (user != null) {
            user.reauthenticate(credential)
                .addOnCompleteListener(new OnCompleteListener<Void>() {
                    @Override
                    public void onComplete(@NonNull Task<Void> task) {
                        if (task.isSuccessful()) {
                            Log.d(TAG, "User re-authenticated with " + provider);
                            FirebaseUser u = FirebaseAuth.getInstance().getCurrentUser();
                            userCallback(u, callback);
                        } else {
                            // userErrorCallback(task, callback);
                        }
                    }
                });
        } else {
            WritableMap err = Arguments.createMap();
            err.putInt("errorCode", NO_CURRENT_USER);
            err.putString("errorMessage", "No current user");
            callback.invoke(err);
        }
    }

    @ReactMethod
    public void updateUserEmail(final String email, final Callback callback) {
      FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();

      if (user != null) {
        user.updateEmail(email)
          .addOnCompleteListener(new OnCompleteListener<Void>() {
            @Override
            public void onComplete(@NonNull Task<Void> task) {
              if (task.isSuccessful()) {
                Log.d(TAG, "User email address updated");
                FirebaseUser u = FirebaseAuth.getInstance().getCurrentUser();
                userCallback(u, callback);
              } else {
                // userErrorCallback(task, callback);
              }
            }
          }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception ex) {
                userExceptionCallback(ex, callback);
              }
            });
      } else {
        WritableMap err = Arguments.createMap();
        err.putInt("errorCode", NO_CURRENT_USER);
        err.putString("errorMessage", "No current user");
        callback.invoke(err);
      }
    }

    @ReactMethod
    public void updateUserPassword(final String newPassword, final Callback callback) {
      FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();

      if (user != null) {
        user.updatePassword(newPassword)
          .addOnCompleteListener(new OnCompleteListener<Void>() {
            @Override
            public void onComplete(@NonNull Task<Void> task) {
              if (task.isSuccessful()) {
                Log.d(TAG, "User password updated");

                FirebaseUser u = FirebaseAuth.getInstance().getCurrentUser();
                userCallback(u, callback);
              } else {
                // userErrorCallback(task, callback);
              }
            }
          }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception ex) {
                userExceptionCallback(ex, callback);
              }
            });
      } else {
        WritableMap err = Arguments.createMap();
        err.putInt("errorCode", NO_CURRENT_USER);
        err.putString("errorMessage", "No current user");
        callback.invoke(err);
      }
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
                        } else {
                            callback.invoke(task.getException().toString());
                        }
                    }
              }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception ex) {
                userExceptionCallback(ex, callback);
              }
            });
    }

    @ReactMethod
    public void deleteUser(final Callback callback) {
      FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();

      if (user != null) {
        user.delete()
          .addOnCompleteListener(new OnCompleteListener<Void>() {
            @Override
            public void onComplete(@NonNull Task<Void> task) {
              if (task.isSuccessful()) {
                Log.d(TAG, "User account deleted");
                WritableMap resp = Arguments.createMap();
                resp.putString("status", "complete");
                resp.putString("msg", "User account deleted");
                callback.invoke(null, resp);
              } else {
                // userErrorCallback(task, callback);
              }
            }
          }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception ex) {
                userExceptionCallback(ex, callback);
              }
            });
      } else {
        WritableMap err = Arguments.createMap();
        err.putInt("errorCode", NO_CURRENT_USER);
        err.putString("errorMessage", "No current user");
        callback.invoke(err);
      }
    }

    @ReactMethod
    public void getToken(final Callback callback) {
      FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();

      user.getToken(true)
        .addOnCompleteListener(new OnCompleteListener<GetTokenResult>() {
          @Override
          public void onComplete(@NonNull Task<GetTokenResult> task) {
            if (task.isSuccessful()) {
              String token = task.getResult().getToken();
              WritableMap resp = Arguments.createMap();
              resp.putString("status", "complete");
              resp.putString("token", token);
              callback.invoke(null, resp);
            } else {
              WritableMap err = Arguments.createMap();
              err.putInt("errorCode", ERROR_FETCHING_TOKEN);
              err.putString("errorMessage", task.getException().getMessage());
              callback.invoke(err);
            }
          }
        }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception ex) {
                userExceptionCallback(ex, callback);
              }
            });
    }

    @ReactMethod
    public void updateUserProfile(ReadableMap props, final Callback callback) {
      FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();

      UserProfileChangeRequest.Builder profileBuilder = new UserProfileChangeRequest.Builder();

      Map<String, Object> m = FirestackUtils.recursivelyDeconstructReadableMap(props);

      if (m.containsKey("displayName")) {
        String displayName = (String) m.get("displayName");
        profileBuilder.setDisplayName(displayName);
      }

      if (m.containsKey("photoUri")) {
        String photoUriStr = (String) m.get("photoUri");
        Uri uri = Uri.parse(photoUriStr);
        profileBuilder.setPhotoUri(uri);
      }

      UserProfileChangeRequest profileUpdates = profileBuilder.build();

      user.updateProfile(profileUpdates)
        .addOnCompleteListener(new OnCompleteListener<Void>() {
          @Override
          public void onComplete(@NonNull Task<Void> task) {
            if (task.isSuccessful()) {
              Log.d(TAG, "User profile updated");
              FirebaseUser u = FirebaseAuth.getInstance().getCurrentUser();
              userCallback(u, callback);
            } else {
              // userErrorCallback(task, callback);
            }
          }
        }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception ex) {
                userExceptionCallback(ex, callback);
              }
            });
    }

    @ReactMethod
    public void signOut(final Callback callback) {
      FirebaseAuth.getInstance().signOut();
      this.user = null;

      WritableMap resp = Arguments.createMap();
      resp.putString("status", "complete");
      resp.putString("msg", "User signed out");
      callback.invoke(null, resp);
    }

    @ReactMethod
    public void getCurrentUser(final Callback callback) {
        mAuth = FirebaseAuth.getInstance();

        this.user = mAuth.getCurrentUser();
        if(this.user == null){
            noUserCallback(callback);
        }else{
            userCallback(this.user, callback);
        }
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
                          FirestackAuthModule.this.user = task.getResult().getUser();
                          userCallback(FirestackAuthModule.this.user, callback);
                      }else{
                          // userErrorCallback(task, callback);
                      }
                    }
                }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception ex) {
                userExceptionCallback(ex, callback);
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
                          FirestackAuthModule.this.user = task.getResult().getUser();
                          userCallback(FirestackAuthModule.this.user, callback);
                      }else{
                          // userErrorCallback(task, callback);
                      }
                    }
                }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception ex) {
                userExceptionCallback(ex, callback);
              }
            });
    }

    // Internal helpers
    public void userCallback(FirebaseUser passedUser, final Callback callback) {

        if (passedUser == null) {
          mAuth = FirebaseAuth.getInstance();
          this.user = mAuth.getCurrentUser();
        } else {
          this.user = passedUser;
        }

        this.user.getToken(false).addOnCompleteListener(new OnCompleteListener<GetTokenResult>() {
            @Override
            public void onComplete(@NonNull Task<GetTokenResult> task) {
                WritableMap msgMap = Arguments.createMap();
                WritableMap userMap = getUserMap();
                boolean authenticated = false;
                if (FirestackAuthModule.this.user != null) {
                    final String token = task.getResult().getToken();
                    userMap.putString("token", token);
                    authenticated = true;
                }

                msgMap.putMap("user", userMap);
                msgMap.putBoolean("authenticated", authenticated);
                callback.invoke(null, msgMap);
            }
        }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception ex) {
                userExceptionCallback(ex, callback);
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

    public void userErrorCallback(Task task, final Callback onFail) {
      userExceptionCallback(task.getException(), onFail);
    }

    public void userExceptionCallback(Exception exp, final Callback onFail) {
      WritableMap error = Arguments.createMap();
      error.putString("errorMessage",     exp.getMessage());
      error.putString("allErrorMessage",  exp.toString());

      try {
        throw exp;
      } catch (FirebaseAuthException ex) {
        error.putString("errorCode", ex.getErrorCode());
      } catch (Exception ex) {
        Log.e(TAG, ex.getMessage());
      }

      onFail.invoke(error);
    }

    private WritableMap getUserMap() {
        WritableMap userMap = Arguments.createMap();

        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();

        if (user != null) {
          final String email = user.getEmail();
          final String uid   = user.getUid();
          final String provider = user.getProviderId();
          final String name = user.getDisplayName();
          final Uri photoUrl = user.getPhotoUrl();

          userMap.putString("email", email);
          userMap.putString("uid", uid);
          userMap.putString("providerId", provider);
          userMap.putBoolean("emailVerified", user.isEmailVerified());
          userMap.putBoolean("anonymous", user.isAnonymous());
          if (name != null) {
            userMap.putString("displayName", name);
          }

          if (photoUrl != null) {
            userMap.putString("photoUrl", photoUrl.toString());
          }
        } else {
          userMap.putString("msg", "no user");
        }

        return userMap;
    }
}
