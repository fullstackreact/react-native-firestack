//
//  Firestack.m
//  Created by Ari Lerner on 5/31/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "Firestack.h"
#import "RCTUtils.h"

@implementation Firestack

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(Firestack);

RCT_EXPORT_METHOD(configure:(RCTResponseSenderBlock)callback)
{
  @try {
    if (!self.configured) {
      [FIRApp configure];
      self->_configured = YES;
    }
  }
  @catch (NSException *exception) {
    NSLog(@"Exception occurred while configuring: %@", exception);
  }
  @finally {
    callback(@[[NSNull null]]);
  }
}

RCT_EXPORT_METHOD(signInWithProvider:
                  (NSString *)provider
                  token:(NSString *)authToken
                  secret:(NSString *)authTokenSecret
                  callback:(RCTResponseSenderBlock)callback)
{
    FIRAuthCredential *credential;
    if ([provider  isEqual: @"twitter"]) {
        credential = [FIRTwitterAuthProvider credentialWithToken:authToken
                                         secret:authTokenSecret];
      NSLog(@"credential created for twitter: %@ %@", authToken, authTokenSecret);
    } else {
      NSDictionary *err = @{
                            @"error": @"Unhandled provider"
                            };
      callback(@[err]);
    }

    [[FIRAuth auth] signInWithCredential:credential
                              completion:^(FIRUser *user, NSError *error) {
                                NSLog(@"Completed signin: %@, %@", user, error);
                                  if (user != nil) {
                                      // User is signed in.
                                    NSDictionary *userProps = [self userPropsFromFIRUser:user];
                                    callback(@[[NSNull null], userProps]);
                                  } else {
                                      // No user is signed in.
                                    NSDictionary *err = @{
                                                          @"error": @"No user signed in"
                                                          };
                                    callback(@[err]);
                                  }
                              }];
  NSLog(@"Called signInWithCredential");
}

RCT_EXPORT_METHOD(signOut:(RCTResponseSenderBlock)callback)
{
  NSError *error;
  [[FIRAuth auth] signOut:&error];
  if (!error) {
    // Sign-out succeeded
    callback(@[[NSNull null], @YES]);
  } else {
    callback(@[error]);
  }
}

RCT_EXPORT_METHOD(listenForAuth:(RCTResponseSenderBlock)callback)
{
  self->authListenerHandle = [[FIRAuth auth] addAuthStateDidChangeListener:^(FIRAuth *_Nonnull auth,
                                                  FIRUser *_Nullable user) {

    if (user != nil) {
      // User is signed in.
      NSLog(@"User: %@", user);
        NSDictionary *userProps = [self userPropsFromFIRUser:user];
        callback(@[[NSNull null], userProps]);
    } else {
      NSDictionary *err = @{
                            @"error": @"No user logged in"
                            };
      callback(@[err]);
    }
  }];
}

RCT_EXPORT_METHOD(unlistenForAuth:(RCTResponseSenderBlock)callback)
{
  NSLog(@"unlisten for auth called: %@", self->authListenerHandle);
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
       callback(@[error]);
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
                           callback(@[error]);
                         }
                       }];
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

RCT_EXPORT_METHOD(setStorageUrl:(NSString *)name
                  callback:(RCTResponseSenderBlock) callback)
{
  NSMutableDictionary *cfg = [[self getConfig] mutableCopy];
  NSMutableDictionary *storageConfig = [cfg objectForKey:@"storage"];

  if (storageConfig == nil) {
    storageConfig = [[NSMutableDictionary alloc] initWithCapacity:2];
  }

  [storageConfig setValue:name forKey:@"url"];

  [cfg setObject:storageConfig forKey:@"storage"];
  NSLog(@"Storage config: %@", cfg);

  self.configuration = cfg;
}

RCT_EXPORT_METHOD(uploadFile:(NSString *) name
                  path:(NSString *)path
                  metadata:(NSDictionary *)metadata
                  callback:(RCTResponseSenderBlock) callback)
{
  NSDictionary *cfg = [self getConfig];

  NSDictionary *storageCfg = [cfg valueForKey:@"storage"];
  NSString *urlStr = [storageCfg valueForKey:@"url"];

  NSLog(@"url str: %@ -> %@", name, urlStr);

  if (urlStr == nil) {
    NSError *err = [[NSError alloc] init];
    [err setValue:@"Storage configuration error" forKey:@"name"];
    [err setValue:@"Call setStorageUrl() first" forKey:@"description"];
    return callback(@[err]);
  }

  FIRStorageReference *storageRef = [[FIRStorage storage] referenceForURL:urlStr];
  FIRStorageReference *uploadRef = [storageRef child:name];

  NSLog(@"storageUrl: %@", urlStr);

  NSURL *localFile = [NSURL fileURLWithPath:path];

  NSLog(@"localfile: %@", localFile);

  FIRStorageMetadata *firmetadata = [[FIRStorageMetadata alloc] initWithDictionary:metadata];

  FIRStorageUploadTask *uploadTask = [uploadRef putFile:localFile
                                              metadata:firmetadata];
  // Listen for state changes, errors, and completion of the upload.
  [uploadTask observeStatus:FIRStorageTaskStatusResume handler:^(FIRStorageTaskSnapshot *snapshot) {
    // Upload resumed, also fires when the upload starts
    [self.bridge.eventDispatcher sendAppEventWithName:@"uploadResumed"
                                                 body:@{
                                                        @"ref": snapshot.reference.bucket
                                                        }];
  }];

  [uploadTask observeStatus:FIRStorageTaskStatusPause handler:^(FIRStorageTaskSnapshot *snapshot) {
    // Upload paused
    [self.bridge.eventDispatcher sendAppEventWithName:@"uploadPaused"
                                                 body:@{
                                                        @"ref": snapshot.reference.bucket
                                                      }];
  }];
  [uploadTask observeStatus:FIRStorageTaskStatusProgress handler:^(FIRStorageTaskSnapshot *snapshot) {
    // Upload reported progress
    double percentComplete = 100.0 * (snapshot.progress.completedUnitCount) / (snapshot.progress.totalUnitCount);

    [self.bridge.eventDispatcher sendAppEventWithName:@"uploadProgress"
                                                 body:@{
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

#pragma mark Helpers

- (NSDictionary *) getConfig
{
  if (self.configuration == nil) {
    self.configuration = [[NSMutableDictionary alloc] initWithCapacity:20];
  }
  return self.configuration;
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

@end
