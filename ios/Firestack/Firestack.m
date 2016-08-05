//
//  Firestack.m
//  Created by Ari Lerner on 5/31/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "Firestack.h"

@import Firebase;

@implementation Firestack

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(Firestack);

RCT_EXPORT_METHOD(configureWithOptions:(NSDictionary *) opts
                  callback:(RCTResponseSenderBlock)callback)
{
    // Are we debugging, yo?
    self.debug = [opts valueForKey:@"debug"] != nil ? YES : NO;
    
    FIROptions *firestackOptions = [FIROptions defaultOptions];
    // Bundle ID either from options OR from the main bundle
    NSString *bundleID;
    if ([opts valueForKey:@"bundleID"]) {
        bundleID = [opts valueForKey:@"bundleID"];
    } else {
        bundleID = [[NSBundle mainBundle] bundleIdentifier];
    }
    // Prefer the user configuration options over the default options
    NSArray *keyOptions = @[@"APIKey", @"clientID", @"trackingID",
                            @"GCMSenderID", @"androidClientID",
                            @"googleAppID", @"databaseURL",
                            @"deepLinkURLScheme", @"storageBucket"];
    
    NSMutableDictionary *props = [[NSMutableDictionary alloc] initWithCapacity:[keyOptions count]];
    for (int i=0; i < [keyOptions count]; i++) {
        // Traditional for loop here
        @try {
            NSString *key = [keyOptions objectAtIndex:i];
            NSString *value = [opts valueForKey:key];
            if (value != nil) {
                [props setObject:value forKey:key];
            } else if ([firestackOptions valueForKey:key] != nil) {
                [props setObject:[firestackOptions valueForKey:key] forKey:key];
            }
        }
        @catch (NSException *err) {
            // Uh oh?
            NSLog(@"An error occurred: %@", err);
        }
    }
    
    @try {
        FIROptions *finalOptions = [[FIROptions alloc] initWithGoogleAppID:[props valueForKey:@"googleAppID"]
                                                                  bundleID:bundleID
                                                               GCMSenderID:[props valueForKey:@"GCMSenderID"]
                                                                    APIKey:[props valueForKey:@"APIKey"]
                                                                  clientID:[props valueForKey:@"clientID"]
                                                                trackingID:[props valueForKey:@"trackingID"]
                                                           androidClientID:[props valueForKey:@"androidClientID"]
                                                               databaseURL:[props valueForKey:@"databaseURL"]
                                                             storageBucket:[props valueForKey:@"storageBucket"]
                                                         deepLinkURLScheme:[props valueForKey:@"deepLinkURLScheme"]];
        
        for (NSString *key in props) {
            [self debugLog:key msg:[finalOptions valueForKey:key]];
        }
        [self debugLog:@"bundleID" msg:bundleID];
        
        // Save configuration option
        NSDictionary *cfg = [self getConfig];
        [cfg setValuesForKeysWithDictionary:props];
        
        if (!self.configured) {
            [FIRApp configureWithOptions:finalOptions];
            self->_configured = YES;
        }
        callback(@[[NSNull null]]);
    }
    @catch (NSException *exception) {
        NSLog(@"Exception occurred while configuring: %@", exception);
        [self debugLog:@"Configuring error"
                   msg:[NSString stringWithFormat:@"An error occurred while configuring: %@", [exception debugDescription]]];
        NSDictionary *errProps = @{
                                   @"error": [exception name],
                                   @"description": [exception debugDescription]
                                   };
        callback(@[errProps]);
    }
}

RCT_EXPORT_METHOD(configure:(RCTResponseSenderBlock)callback)
{
    NSDictionary *props = @{};
    [self configureWithOptions:props
                      callback:callback];
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
    
    NSLog(@"signinWithCredential: %@", credential);
    
    @try {
        [[FIRAuth auth] signInWithCredential:credential
                                  completion:^(FIRUser *user, NSError *error) {
                                      if (user != nil) {
                                          // User is signed in.
                                          NSDictionary *userProps = [self userPropsFromFIRUser:user];
                                          callback(@[[NSNull null], userProps]);
                                      } else {
                                          NSLog(@"An error occurred: %@", [error localizedDescription]);
                                          NSLog(@"Error: %@", error);
                                          // No user is signed in.
                                          NSDictionary *err = @{
                                                                @"error": @"No user signed in",
                                                                @"description": [error localizedDescription]
                                                                };
                                          callback(@[err]);
                                      }
                                  }];
    } @catch (NSException *exception) {
        [self handleException:exception
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
    self->authListenerHandle = [[FIRAuth auth] addAuthStateDidChangeListener:^(FIRAuth *_Nonnull auth,
                                                                               FIRUser *_Nullable user) {
        
        if (user != nil) {
            // User is signed in.
            NSDictionary *userProps = [self userPropsFromFIRUser:user];
            //        callback(@[[NSNull null], userProps]);
            [self sendJSEvent:@"listenForAuth" props: @{
                                                        @"eventName": @"user",
                                                        @"authenticated": @(true),
                                                        @"user": userProps
                                                        }];
        } else {
            // TODO: Update this with different error states
            NSDictionary *err = @{
                                  @"error": @"No user logged in"
                                  };
            [self sendJSEvent:@"listenForAuth"
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
        callback(@[[NSNull null]]);
    }
}

RCT_EXPORT_METHOD(getCurrentUser:(RCTResponseSenderBlock)callback)
{
    FIRUser *user = [FIRAuth auth].currentUser;
    
    if (user != nil) {
        NSDictionary *userProps = [self userPropsFromFIRUser:user];
        callback(@[[NSNull null], userProps]);
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
             NSDictionary *userProps = [self userPropsFromFIRUser:user];
             callback(@[[NSNull null], userProps]);
         } else {
             NSDictionary *err = @{
                                   @"error": @"createUserWithEmailError",
                                   @"name": @([error code]),
                                   @"description": [error description]
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
                                 callback(@[[NSNull null], userProps]);
                             } else {
                                 NSDictionary *err =
                                 [self handleFirebaseError:@"signinError"
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
            [self handleFirebaseError:@"updateEmailError"
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
            [self handleFirebaseError:@"updateUserPasswordError"
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
            [self handleFirebaseError:@"deleteUserError"
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
            [self handleFirebaseError:@"getTokenError"
                                error:error
                             withUser:user];
            callback(@[err]);
        } else {
            callback(@[[NSNull null], @{@"token": token}]);
        }
    }];
}

RCT_EXPORT_METHOD(getTokenWithCompletion:(RCTResponseSenderBlock) callback)
{
    FIRUser *user = [FIRAuth auth].currentUser;
    
    [user getTokenWithCompletion:^(NSString *token , NSError *_Nullable error) {
        if (error) {
            NSDictionary *err =
            [self handleFirebaseError:@"deleteUserError"
                                error:error
                             withUser:user];
            callback(@[err]);
        } else {
            callback(@[[NSNull null], @{@"result": token}]);
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
            [self handleFirebaseError:@"reauthenticateWithCredentialForProviderError"
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
                    [self handleFirebaseError:@"updateEmailError"
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

#pragma mark - Analytics

RCT_EXPORT_METHOD(logEventWithName:(NSString *)name
                  props:(NSDictionary *)props
                  callback:(RCTResponseSenderBlock) callback)
{
    [FIRAnalytics logEventWithName:name parameters:props];
    callback(@[[NSNull null], @YES]);
}

#pragma mark - Storage

- (NSString *) getStorageUrl
{
    NSDictionary *cfg = [self getConfig];
    NSString *storageUrl = [NSString stringWithFormat:@"gs://%@", [cfg valueForKey:@"storageBucket"]];
    return storageUrl;
}

RCT_EXPORT_METHOD(uploadFile:(NSString *) name
                  path:(NSString *)path
                  metadata:(NSDictionary *)metadata
                  callback:(RCTResponseSenderBlock) callback)
{    
    NSString *urlStr = [self getStorageUrl];
    
    if (urlStr == nil) {
        NSError *err = [[NSError alloc] init];
        [err setValue:@"Storage configuration error" forKey:@"name"];
        [err setValue:@"Call setStorageUrl() first" forKey:@"description"];
        return callback(@[err]);
    }
    
    FIRStorageReference *storageRef = [[FIRStorage storage] referenceForURL:urlStr];
    FIRStorageReference *uploadRef = [storageRef child:name];
    
    NSURL *localFile = [NSURL fileURLWithPath:path];
    
    FIRStorageMetadata *firmetadata = [[FIRStorageMetadata alloc] initWithDictionary:metadata];
    
    FIRStorageUploadTask *uploadTask = [uploadRef putFile:localFile
                                                 metadata:firmetadata];
    // Listen for state changes, errors, and completion of the upload.
    [uploadTask observeStatus:FIRStorageTaskStatusResume handler:^(FIRStorageTaskSnapshot *snapshot) {
        // Upload resumed, also fires when the upload starts
        [self sendJSEvent:@"uploadResumed" props:@{
                                                   @"ref": snapshot.reference.bucket
                                                   }];
    }];
    
    [uploadTask observeStatus:FIRStorageTaskStatusPause handler:^(FIRStorageTaskSnapshot *snapshot) {
        // Upload paused
        [self sendJSEvent:@"uploadPaused" props:@{
                                                  @"ref": snapshot.reference.bucket
                                                  }];
    }];
    [uploadTask observeStatus:FIRStorageTaskStatusProgress handler:^(FIRStorageTaskSnapshot *snapshot) {
        // Upload reported progress
        double percentComplete = 100.0 * (snapshot.progress.completedUnitCount) / (snapshot.progress.totalUnitCount);
        
        [self sendJSEvent:@"uploadProgress" props:@{
                                                    @"progress": @(percentComplete || 0.0)
                                                    }];
        
    }];
    
    [uploadTask observeStatus:FIRStorageTaskStatusSuccess handler:^(FIRStorageTaskSnapshot *snapshot) {
        // Upload completed successfully
        FIRStorageReference *ref = snapshot.reference;
        NSDictionary *props = @{
                                @"fullPath": ref.fullPath,
                                @"bucket": ref.bucket,
                                @"name": ref.name,
                                @"metadata": [snapshot.metadata dictionaryRepresentation]
                                };
        
        callback(@[[NSNull null], props]);
    }];
    
    [uploadTask observeStatus:FIRStorageTaskStatusFailure handler:^(FIRStorageTaskSnapshot *snapshot) {
        if (snapshot.error != nil) {
            NSError *err = [[NSError alloc] init];
            switch (snapshot.error.code) {
                case FIRStorageErrorCodeObjectNotFound:
                    // File doesn't exist
                    [err setValue:@"File does not exist" forKey:@"description"];
                    break;
                case FIRStorageErrorCodeUnauthorized:
                    // User doesn't have permission to access file
                    [err setValue:@"You do not have permissions" forKey:@"description"];
                    break;
                case FIRStorageErrorCodeCancelled:
                    // User canceled the upload
                    [err setValue:@"Upload cancelled" forKey:@"description"];
                    break;
                case FIRStorageErrorCodeUnknown:
                    // Unknown error occurred, inspect the server response
                    [err setValue:@"Unknown error" forKey:@"description"];
                    break;
            }
            
            callback(@[err]);
        }}];
}

#pragma mark RemoteConfig

RCT_EXPORT_METHOD(setDefaultRemoteConfig:(NSDictionary *)props
                  callback:(RCTResponseSenderBlock) callback)
{
    if (!self.remoteConfigInstance) {
        // Create remote Config instance
        self.remoteConfigInstance = [FIRRemoteConfig remoteConfig];
    }
    
    [self.remoteConfigInstance setDefaults:props];
    callback(@[[NSNull null], props]);
}

RCT_EXPORT_METHOD(setDev:(RCTResponseSenderBlock) callback)
{
    FIRRemoteConfigSettings *remoteConfigSettings = [[FIRRemoteConfigSettings alloc] initWithDeveloperModeEnabled:YES];
    self.remoteConfigInstance.configSettings = remoteConfigSettings;
    callback(@[[NSNull null], @"ok"]);
}

RCT_EXPORT_METHOD(configValueForKey:(NSString *)name
                  callback:(RCTResponseSenderBlock) callback)
{
    if (!self.remoteConfigInstance) {
        NSDictionary *err = @{
                              @"error": @"No configuration instance",
                              @"msg": @"No configuration instance set. Please call setDefaultRemoteConfig before using this feature"
                              };
        callback(@[err]);
    }
    
    
    FIRRemoteConfigValue *value = [self.remoteConfigInstance configValueForKey:name];
    NSString *valueStr = value.stringValue;
    
    if (valueStr == nil) {
        valueStr = @"";
    }
    callback(@[[NSNull null], valueStr]);
}

RCT_EXPORT_METHOD(fetchWithExpiration:(NSNumber*)expirationSeconds
                  callback:(RCTResponseSenderBlock) callback)
{
    if (!self.remoteConfigInstance) {
        NSDictionary *err = @{
                              @"error": @"No configuration instance",
                              @"msg": @"No configuration instance set. Please call setDefaultRemoteConfig before using this feature"
                              };
        callback(@[err]);
    }
    
    NSTimeInterval expirationDuration = [expirationSeconds doubleValue];
    
    [self.remoteConfigInstance fetchWithExpirationDuration:expirationDuration completionHandler:^(FIRRemoteConfigFetchStatus status, NSError *error) {
        if (status == FIRRemoteConfigFetchStatusSuccess) {
            NSLog(@"Config fetched!");
            [self.remoteConfigInstance activateFetched];
            callback(@[[NSNull null], @(YES)]);
        } else {
            NSLog(@"Error %@", error.localizedDescription);
            
            NSDictionary *err = @{
                                  @"error": @"No configuration instance",
                                  @"msg": [error localizedDescription]
                                  };
            
            callback(@[err]);
        }
    }];
}

#pragma mark Helpers

- (NSDictionary *) getConfig
{
    if (self.configuration == nil) {
        self.configuration = [[NSMutableDictionary alloc] initWithCapacity:20];
    }
    return self.configuration;
}

- (NSDictionary *) handleFirebaseError:(NSString *) name
                                 error:(NSError *) error
                              withUser:(FIRUser *) user
{
    NSMutableDictionary *err = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                name, @"name",
                                @([error code]), @"code",
                                [error localizedDescription], @"rawDescription",
                                [[error userInfo] description], @"userInfo",
                                nil];
    
    NSString *description = @"Unknown error";
    switch (error.code) {
        case FIRAuthErrorCodeInvalidEmail:
            description = @"Invalid email";
            break;
        case FIRAuthErrorCodeUserNotFound:
            description = @"User not found";
            break;
        case FIRAuthErrorCodeNetworkError:
            description = @"Network error";
            break;
        case FIRAuthErrorCodeInternalError:
            description = @"Internal error";
            break;
        default:
            break;
    }
    [err setValue:description forKey:@"description"];
    return [NSDictionary dictionaryWithDictionary:err];
}

- (NSDictionary *) userPropsFromFIRUser:(FIRUser *) user
{
    NSMutableDictionary *userProps = [@{
                                        @"uid": user.uid,
                                        @"email": user.email ? user.email : @"",
                                        @"emailVerified": @(user.emailVerified),
                                        @"anonymous": @(user.anonymous),
                                        @"displayName": user.displayName ? user.displayName : @""
                                        } mutableCopy];
    
    if ([user valueForKey:@"photoURL"] != nil) {
        [userProps setValue: [NSString stringWithFormat:@"%@", user.photoURL]
                     forKey:@"photoURL"];
    }
    
    return userProps;
}

- (FIRAuthCredential *)getCredentialForProvider:(NSString *)provider
                                          token:(NSString *)authToken
                                         secret:(NSString *)authTokenSecret
{
    FIRAuthCredential *credential;
    if ([provider isEqualToString: @"twitter"]) {
        credential = [FIRTwitterAuthProvider credentialWithToken:authToken
                                                          secret:authTokenSecret];
    } if ([provider isEqualToString: @"facebook"]) {
        credential = [FIRFacebookAuthProvider credentialWithAccessToken:authToken];
    } if ([provider isEqualToString: @"google"]) {
        credential = [FIRGoogleAuthProvider credentialWithIDToken:authToken
                                                          accessToken:authTokenSecret];
    } else {
        NSLog(@"Provider not yet handled");
    }
    return credential;
}

- (void) handleException:(NSException *)exception
            withCallback:(RCTResponseSenderBlock)callback
{
    NSString *errDesc = [exception description];
    NSLog(@"An error occurred: %@", errDesc);
    // No user is signed in.
    NSDictionary *err = @{
                          @"error": @"No user signed in",
                          @"description": errDesc
                          };
    callback(@[err]);
}

- (void) debugLog:(NSString *)title
              msg:(NSString *)msg
{
    if (self.debug) {
        [self sendJSEvent:@"debug"
                    props:@{
                            @"name": title,
                            @"message": msg
                            }];
    }
}

- (void) sendJSEvent:(NSString *)title
               props:(NSDictionary *)props
{
    @try {
        [self.bridge.eventDispatcher sendAppEventWithName:title
                                                     body:props];
    }
    @catch (NSException *exception) {
        NSLog(@"An exception occurred while throwing JS event: %@", [exception debugDescription]);
    }
}

@end
