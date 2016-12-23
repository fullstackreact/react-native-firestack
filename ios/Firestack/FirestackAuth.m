//
//  FirestackAuth.m
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "FirestackAuth.h"
#import "FirestackErrors.h"
#import "FirestackEvents.h"

@implementation FirestackAuth

typedef void (^UserWithTokenResponse)(NSDictionary *, NSError *);

RCT_EXPORT_MODULE(FirestackAuth);

RCT_EXPORT_METHOD(signInAnonymously:
                  (RCTResponseSenderBlock) callback)
{
    @try {
    [[FIRAuth auth] signInAnonymouslyWithCompletion
     :^(FIRUser *user, NSError *error) {
         if (!user) {
             NSDictionary *evt = @{
                                   @"eventName": AUTH_ANONYMOUS_ERROR_EVENT,
                                   @"errorMessage": [error localizedDescription]
                                   };


             [self sendJSEvent:AUTH_CHANGED_EVENT
                  props: evt];

             callback(@[evt]);
         } else {
             NSDictionary *userProps = [self userPropsFromFIRUser:user];
             NSDictionary *responseProps = @{
                                             @"authenticated": @((BOOL) true),
                                             @"user": userProps
                                             };
             callback(@[[NSNull null], responseProps]);
        }
     }];
    } @catch(NSException *ex) {
        NSDictionary *eventError = @{
                                     @"eventName": AUTH_ANONYMOUS_ERROR_EVENT,
                                     @"errorMessage": ex.reason
                                     };

        [self sendJSEvent:AUTH_ERROR_EVENT
                    props:eventError];
        NSLog(@"An exception occurred: %@", ex);
        callback(@[eventError]);
    }
}

RCT_EXPORT_METHOD(signInWithCustomToken:
                  (NSString *)customToken
                  callback:(RCTResponseSenderBlock) callback)
{
    [[FIRAuth auth]
     signInWithCustomToken:customToken
     completion:^(FIRUser *user, NSError *error) {

         if (user != nil) {
             NSDictionary *userProps = [self userPropsFromFIRUser:user];
             NSDictionary *responseProps = @{
                                             @"authenticated": @((BOOL) true),
                                             @"user": userProps
                                             };
             callback(@[[NSNull null], responseProps]);
         } else {
             NSDictionary *err =
             [FirestackErrors handleFirebaseError:AUTH_ERROR_EVENT
                                 error:error
                              withUser:user];
             callback(@[err]);
         }
     }];
}

RCT_EXPORT_METHOD(signInWithProvider:
                  (NSString *)provider
                  token:(NSString *)authToken
                  secret:(NSString *)authTokenSecret
                  callback:(RCTResponseSenderBlock)callback)
{
    FIRAuthCredential *credential = [self getCredentialForProvider:provider
                                                             token:authToken
                                                            secret:authTokenSecret];
    if (credential == nil) {
        NSDictionary *err = @{
                              @"error": @"Unhandled provider"
                              };
        return callback(@[err]);
    }

    @try {
        [[FIRAuth auth] signInWithCredential:credential
                                  completion:^(FIRUser *user, NSError *error) {
                                      if (user != nil) {
                                          // User is signed in.
                                          NSDictionary *userProps = [self userPropsFromFIRUser:user];
                                          NSDictionary *responseProps = @{
                                                                          @"authenticated": @((BOOL) true),
                                                                          @"user": userProps
                                                                          };
                                          callback(@[[NSNull null], responseProps]);
                                      } else {
                                          NSLog(@"An error occurred: %@", [error localizedDescription]);
                                          NSLog(@"[Error signInWithProvider]: %@", [error userInfo]);
                                          NSLog(@"%@", [NSThread callStackSymbols]);
                                          // No user is signed in.
                                          NSDictionary *err = @{
                                                                @"error": @"No user signed in",
                                                                @"description": [error localizedDescription]
                                                                };
                                          callback(@[err]);
                                      }
                                  }];
    } @catch (NSException *exception) {
        [FirestackErrors handleException:exception
                            withCallback:callback];
    }
}

RCT_EXPORT_METHOD(signOut:(RCTResponseSenderBlock)callback)
{
    NSError *error;
    [[FIRAuth auth] signOut:&error];
    if (!error) {
        // Sign-out succeeded
        callback(@[[NSNull null], @YES]);
    } else {
        NSDictionary *err = @{
                              @"error": @"Signout error",
                              @"name": @([error code]),
                              @"description": [error description]
                              };
        callback(@[err]);
    }
}

RCT_EXPORT_METHOD(listenForAuth)
{
    self->listening = true;
    self->authListenerHandle =
    [[FIRAuth auth] addAuthStateDidChangeListener:^(FIRAuth *_Nonnull auth,
                                                    FIRUser *_Nullable user) {

        if (user != nil) {
            // User is signed in.
            [self userPropsFromFIRUserWithToken:user
                                    andCallback:^(NSDictionary *userProps, NSError * error) {
                                        if (error != nil) {
                                            [self
                                             sendJSEvent:AUTH_CHANGED_EVENT
                                             props: @{
                                                      @"eventName": @"userTokenError",
                                                      @"authenticated": @((BOOL)false),
                                                      @"errorMessage": [error localizedFailureReason]
                                                      }];
                                        } else {
                                            [self
                                             sendJSEvent:AUTH_CHANGED_EVENT
                                             props: @{
                                                      @"eventName": @"user",
                                                      @"authenticated": @((BOOL)true),
                                                      @"user": userProps
                                                      }];
                                        }
                                    }];
        } else {
            // TODO: Update this with different error states
            NSDictionary *err = @{
                                  @"error": @"No user logged in"
                                  };
            [self sendJSEvent:AUTH_CHANGED_EVENT
                        props:@{
                                @"eventName": @"no_user",
                                @"authenticated": @((BOOL)false),
                                @"error": err
                                }];
        }
    }];
}

RCT_EXPORT_METHOD(unlistenForAuth:(RCTResponseSenderBlock)callback)
{
    if (self->authListenerHandle != nil) {
        [[FIRAuth auth] removeAuthStateDidChangeListener:self->authListenerHandle];
        self->listening = false;
        callback(@[[NSNull null]]);
    }
}

RCT_EXPORT_METHOD(getCurrentUser:(RCTResponseSenderBlock)callback)
{
    FIRUser *user = [FIRAuth auth].currentUser;

    if (user != nil) {
        NSDictionary *userProps = [self userPropsFromFIRUser:user];
        NSDictionary *responseProps = @{
                                            @"authenticated": @((BOOL) true),
                                            @"user": userProps
                                            };
        callback(@[[NSNull null], responseProps]);
    } else {
        // No user is signed in.
        NSDictionary *err = @{
                              @"authenticated": @((BOOL) false),
                              @"user": @"No user logged in"
                              };
        callback(@[err]);
    }
}

RCT_EXPORT_METHOD(createUserWithEmail:(NSString *)email
                  pass:(NSString *)password
                  callback:(RCTResponseSenderBlock) callback)
{
    [[FIRAuth auth]
     createUserWithEmail:email
     password:password
     completion:^(FIRUser *_Nullable user,
                  NSError *_Nullable error) {
         if (user != nil) {
             NSDictionary *userProps = [self userPropsFromFIRUser:user];
             callback(@[[NSNull null], userProps]);
         } else {
             NSDictionary *err = @{
                                   @"error": @"createUserWithEmailError",
                                   @"name": @([error code]),
                                   @"description": [error localizedDescription]
                                   };
             callback(@[err]);
         }
     }];
}

RCT_EXPORT_METHOD(signInWithEmail:(NSString *)email
                  pass:(NSString *)password
                  callback:(RCTResponseSenderBlock) callback)
{
    [[FIRAuth auth] signInWithEmail:email
                           password:password
                         completion:^(FIRUser *user, NSError *error) {
                             if (user != nil) {
                                 NSDictionary *userProps = [self userPropsFromFIRUser:user];
                                 NSDictionary *responseProps = @{
                                                                 @"authenticated": @((BOOL) true),
                                                                 @"user": userProps
                                                                 };
                                 callback(@[[NSNull null], responseProps]);
                             } else {
                                 NSDictionary *err =
                                 [FirestackErrors handleFirebaseError:@"signinError"
                                                     error:error
                                                  withUser:user];
                                 callback(@[err]);
                             }
                         }];
}

RCT_EXPORT_METHOD(updateUserEmail:(NSString *)email
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRUser *user = [FIRAuth auth].currentUser;

    [user updateEmail:email completion:^(NSError *_Nullable error) {
        if (error) {
            // An error happened.
            NSDictionary *err =
            [FirestackErrors handleFirebaseError:@"updateEmailError"
                                error:error
                             withUser:user];
            callback(@[err]);
        } else {
            // Email updated.
            NSDictionary *userProps = [self userPropsFromFIRUser:user];
            callback(@[[NSNull null], userProps]);
        }
    }];
}

RCT_EXPORT_METHOD(updateUserPassword:(NSString *)newPassword
                  callback:(RCTResponseSenderBlock) callback)
{

    FIRUser *user = [FIRAuth auth].currentUser;

    [user updatePassword:newPassword completion:^(NSError *_Nullable error) {
        if (error) {
            // An error happened.
            NSDictionary *err =
            [FirestackErrors handleFirebaseError:@"updateUserPasswordError"
                                error:error
                             withUser:user];
            callback(@[err]);
        } else {
            // Email updated.
            NSDictionary *userProps = [self userPropsFromFIRUser:user];
            callback(@[[NSNull null], userProps]);
        }
    }];
}

RCT_EXPORT_METHOD(sendPasswordResetWithEmail:(NSString *)email
                  callback:(RCTResponseSenderBlock) callback)
{

    [[FIRAuth auth] sendPasswordResetWithEmail:email
                                    completion:^(NSError *_Nullable error) {
                                        if (error) {
                                            // An error happened.
                                            NSDictionary *err = @{
                                                                  @"error": @"sendPasswordResetWithEmailError",
                                                                  @"description": error.localizedDescription
                                                                  };
                                            callback(@[err]);
                                        } else {
                                            // Email updated.
                                            callback(@[[NSNull null], @{
                                                           @"result": @(true)
                                                           }]);
                                        }
                                    }];
}

RCT_EXPORT_METHOD(deleteUser:(RCTResponseSenderBlock) callback)
{
    FIRUser *user = [FIRAuth auth].currentUser;

    [user deleteWithCompletion:^(NSError *_Nullable error) {
        if (error) {
            NSDictionary *err =
            [FirestackErrors handleFirebaseError:@"deleteUserError"
                                error:error
                             withUser:user];
            callback(@[err]);
        } else {
            callback(@[[NSNull null], @{@"result": @(true)}]);
        }
    }];
}

RCT_EXPORT_METHOD(getToken:(RCTResponseSenderBlock) callback)
{
    FIRUser *user = [FIRAuth auth].currentUser;

    [user getTokenWithCompletion:^(NSString *token, NSError *_Nullable error) {
        if (error) {
            NSDictionary *err =
            [FirestackErrors handleFirebaseError:@"getTokenError"
                                error:error
                             withUser:user];
            callback(@[err]);
        } else {
            NSDictionary *userProps = [self userPropsFromFIRUser:user];
            callback(@[[NSNull null], @{@"token": token, @"user": userProps}]);
        }
    }];
}

RCT_EXPORT_METHOD(getTokenWithCompletion:(RCTResponseSenderBlock) callback)
{
    FIRUser *user = [FIRAuth auth].currentUser;

    [user getTokenWithCompletion:^(NSString *token , NSError *_Nullable error) {
        if (error) {
            NSDictionary *err =
            [FirestackErrors handleFirebaseError:@"getTokenWithCompletion"
                                error:error
                             withUser:user];
            callback(@[err]);
        } else {
            NSDictionary *userProps = [self userPropsFromFIRUser:user];
            callback(@[[NSNull null], @{@"token": token, @"user": userProps}]);
        }
    }];
}

RCT_EXPORT_METHOD(reauthenticateWithCredentialForProvider:
                  (NSString *)provider
                  token:(NSString *)authToken
                  secret:(NSString *)authTokenSecret
                  callback:(RCTResponseSenderBlock)callback)
{
    FIRAuthCredential *credential = [self getCredentialForProvider:provider
                                                             token:authToken
                                                            secret:authTokenSecret];
    if (credential == nil) {
        NSDictionary *err = @{
                              @"error": @"Unhandled provider"
                              };
        return callback(@[err]);
    }

    FIRUser *user = [FIRAuth auth].currentUser;

    [user reauthenticateWithCredential:credential completion:^(NSError *_Nullable error) {
        if (error) {
            NSDictionary *err =
            [FirestackErrors handleFirebaseError:@"reauthenticateWithCredentialForProviderError"
                                error:error
                             withUser:user];
            callback(@[err]);
        } else {
            callback(@[[NSNull null], @{@"result": @(true)}]);
        }
    }];
}


RCT_EXPORT_METHOD(updateUserProfile:(NSDictionary *)userProps
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRUser *user = [FIRAuth auth].currentUser;
    FIRUserProfileChangeRequest *changeRequest = [user profileChangeRequest];

    NSMutableArray *allKeys = [[userProps allKeys] mutableCopy];
    for (NSString *key in allKeys) {
        // i.e. changeRequest.displayName = userProps[displayName];
        @try {
            if ([key isEqualToString:@"photoURL"]) {
                NSURL *url = [NSURL URLWithString:[userProps valueForKey:key]];
                [changeRequest setValue:url forKey:key];
            } else {
                [changeRequest setValue:[userProps objectForKey:key] forKey:key];
            }
        }
        @catch (NSException *exception) {
            NSLog(@"Exception occurred while configuring: %@", exception);
        }
        @finally {
            [changeRequest commitChangesWithCompletion:^(NSError *_Nullable error) {
                if (error) {
                    // An error happened.
                    NSDictionary *err =
                    [FirestackErrors handleFirebaseError:@"updateEmailError"
                                        error:error
                                     withUser:user];
                    callback(@[err]);
                } else {
                    // Profile updated.
                    NSDictionary *userProps = [self userPropsFromFIRUser:user];
                    callback(@[[NSNull null], userProps]);
                }
            }];
        }
    }
}

- (NSDictionary *) userPropsFromFIRUser:(FIRUser *) user
{
    NSMutableDictionary *userProps = [@{
                                        @"uid": user.uid,
                                        @"email": user.email ? user.email : @"",
                                        @"emailVerified": @(user.emailVerified),
                                        @"anonymous": @(user.anonymous),
                                        @"displayName": user.displayName ? user.displayName : @"",
                                        @"refreshToken": user.refreshToken,
                                        @"providerID": user.providerID
                                        } mutableCopy];

    if ([user valueForKey:@"photoURL"] != nil) {
        [userProps setValue: [NSString stringWithFormat:@"%@", user.photoURL]
                     forKey:@"photoURL"];
    }

    return userProps;
}

- (void) userPropsFromFIRUserWithToken:(FIRUser *) user
                           andCallback:(UserWithTokenResponse) callback
{
    NSMutableDictionary *userProps = [[self userPropsFromFIRUser:user] mutableCopy];
    [user getTokenWithCompletion:^(NSString * _Nullable token, NSError * _Nullable error) {
        if (error != nil) {
            return callback(nil, error);
        }

        [userProps setValue:token forKey:@"idToken"];
        callback(userProps, nil);
    }];
}

- (FIRAuthCredential *)getCredentialForProvider:(NSString *)provider
                                          token:(NSString *)authToken
                                         secret:(NSString *)authTokenSecret
{
    FIRAuthCredential *credential;
    if ([provider compare:@"twitter" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
        credential = [FIRTwitterAuthProvider credentialWithToken:authToken
                                                          secret:authTokenSecret];
    } else if ([provider compare:@"facebook" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
        credential = [FIRFacebookAuthProvider credentialWithAccessToken:authToken];
    } else if ([provider compare:@"google" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
        credential = [FIRGoogleAuthProvider credentialWithIDToken:authToken
                                                      accessToken:authTokenSecret];
    } else if ([provider compare:@"github" options:NSCaseInsensitiveSearch] == NSOrderedSame) {
        credential = [FIRGitHubAuthProvider credentialWithToken:authToken];
    } else {
        NSLog(@"Provider not yet handled: %@", provider);
    }
    return credential;
}

// Not sure how to get away from this... yet
- (NSArray<NSString *> *)supportedEvents {
    return @[AUTH_CHANGED_EVENT, AUTH_ANONYMOUS_ERROR_EVENT, AUTH_ERROR_EVENT];
}

- (void) sendJSEvent:(NSString *)title
               props:(NSDictionary *)props
{
    @try {
      if (self->listening) {
        [self sendEventWithName:title
                           body:props];
      }
    }
    @catch (NSException *err) {
        NSLog(@"An error occurred in sendJSEvent: %@", [err debugDescription]);
    }
}


@end
