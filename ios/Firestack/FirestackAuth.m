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
                  (RCTResponseSenderBlock) callBack)
{
    @try {
        [[FIRAuth auth] signInAnonymouslyWithCompletion
         :^(FIRUser *user, NSError *error) {
             if (!user) {
                 NSDictionary *evt = @{
                                       @"eventName": AUTH_ANONYMOUS_ERROR_EVENT,
                                       @"msg": [error localizedDescription]
                                       };
                 
                 
                 [self sendJSEvent:AUTH_CHANGED_EVENT
                             props: evt];
                 
                 callBack(@[evt]);
             } else {
                 [self userCallback:callBack user:user];
             }
         }];
    } @catch(NSException *ex) {
        NSDictionary *eventError = @{
                                     @"eventName": AUTH_ANONYMOUS_ERROR_EVENT,
                                     @"msg": ex.reason
                                     };
        
        [self sendJSEvent:AUTH_ERROR_EVENT
                    props:eventError];
        NSLog(@"An exception occurred: %@", ex);
        callBack(@[eventError]);
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
             [self userCallback:callback user:user];
         } else {
             [self userErrorCallback:callback error:error user:user msg:AUTH_ERROR_EVENT];
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
                                          [self userCallback:callback user:user];
                                      } else {
                                          NSLog(@"An error occurred: %@", [error localizedDescription]);
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
                                                      @"msg": [error localizedDescription]
                                                      }];
                                        } else {
                                            [self
                                             sendJSEvent:AUTH_CHANGED_EVENT
                                             props: @{
                                                      @"eventName": @"user",
                                                      @"authenticated": @(true),
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
                                @"authenticated": @(false),
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
        [self userCallback:callback user:user];
    } else {
        // No user is signed in.
        NSDictionary *err = @{
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
             [self userCallback:callback user:user];
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
                                 [self userCallback:callback user:user];
                             } else {
                                 [self userErrorCallback:callback error:error user:user msg:@"signinError"];
                             }
                         }];
}

RCT_EXPORT_METHOD(updateUserEmail:(NSString *)email
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRUser *user = [FIRAuth auth].currentUser;
    
    if (user) {
        [user updateEmail:email completion:^(NSError *_Nullable error) {
            if (error) {
                // An error happened.
                [self userErrorCallback:callback error:error user:user msg:@"updateEmailError"];
            } else {
                // Email updated.
                [self userCallback:callback user:user];
            }
        }];
    } else {
        [self noUserCallback:callback isError:true];
    }
}

RCT_EXPORT_METHOD(updateUserPassword:(NSString *)newPassword
                  callback:(RCTResponseSenderBlock) callback)
{
    
    FIRUser *user = [FIRAuth auth].currentUser;
    
    if (user) {
        [user updatePassword:newPassword completion:^(NSError *_Nullable error) {
            if (error) {
                // An error happened.
                [self userErrorCallback:callback error:error user:user msg:@"updateUserPasswordError"];
            } else {
                // Email updated.
                [self userCallback:callback user:user];
            }
        }];
    } else {
        [self noUserCallback:callback isError:true];
    }
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
    
    if (user) {
        [user deleteWithCompletion:^(NSError *_Nullable error) {
            if (error) {
                [self userErrorCallback:callback error:error user:user msg:@"deleteUserError"];
            } else {
                callback(@[[NSNull null], @{@"result": @(true)}]);
            }
        }];
    } else {
        [self noUserCallback:callback isError:true];
    }
}

RCT_EXPORT_METHOD(getToken:(RCTResponseSenderBlock) callback)
{
    FIRUser *user = [FIRAuth auth].currentUser;
    
    if (user) {
        [user getTokenWithCompletion:^(NSString *token, NSError *_Nullable error) {
            if (error) {
                [self userErrorCallback:callback error:error user:user msg:@"getTokenError"];
            } else {
                callback(@[[NSNull null], token]);
            }
        }];
    } else {
        [self noUserCallback:callback isError:true];
    }
}

RCT_EXPORT_METHOD(getTokenWithCompletion:(RCTResponseSenderBlock) callback)
{
    FIRUser *user = [FIRAuth auth].currentUser;
    
    if (user) {
        [user getTokenWithCompletion:^(NSString *token , NSError *_Nullable error) {
            if (error) {
                [self userErrorCallback:callback error:error user:user msg:@"getTokenWithCompletion"];
            } else {
                callback(@[[NSNull null], token]);
            }
        }];
    } else {
        [self noUserCallback:callback isError:true];
    }
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
            [self userErrorCallback:callback error:error user:user msg:@"reauthenticateWithCredentialForProviderError"];
        } else {
            callback(@[[NSNull null], @{@"result": @(true)}]);
        }
    }];
}


RCT_EXPORT_METHOD(updateUserProfile:(NSDictionary *)userProps
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRUser *user = [FIRAuth auth].currentUser;
    
    if (user) {
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
                        [self userErrorCallback:callback error:error user:user msg:@"updateEmailError"];
                    } else {
                        // Profile updated.
                        [self userCallback:callback user:user];
                    }
                }];
            }
        }
    } else {
        [self noUserCallback:callback isError:true];
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

- (void) userCallback:(RCTResponseSenderBlock) callback
                 user:(FIRUser *) user {
    NSDictionary *userProps = [self userPropsFromFIRUser:user];
    callback(@[[NSNull null], userProps]);
}

- (void) noUserCallback:(RCTResponseSenderBlock) callback
                isError:(Boolean) isError {
    if (isError) {
        NSDictionary *err = @{
                              @"error": @"Unhandled provider"
                              };
        return callback(@[err]);
        
    }
    return callback(@[[NSNull null], [NSNull null]]);
}

- (void) userErrorCallback:(RCTResponseSenderBlock) callback
                     error:(NSError *)error
                      user:(FIRUser *) user
                       msg:(NSString *) msg {
    // An error happened.
    NSDictionary *err = [FirestackErrors handleFirebaseError:msg
                                                       error:error
                                                    withUser:user];
    callback(@[err]);
}


@end
