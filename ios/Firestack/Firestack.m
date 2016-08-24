//
//  Firestack.m
//  Created by Ari Lerner on 5/31/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "Firestack.h"
#import "FirestackErrors.h"
#import "FirestackEvents.h"
#import "FirestackMessaging.h"

@import Firebase;

@implementation Firestack

typedef void (^UserWithTokenResponse)(NSDictionary *, NSError *);

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

#pragma mark Database

#pragma mark Messaging

+ (void) registerForNotification:(NSString *) typeStr andToken:(NSData *)deviceToken
{
    [FirestackMessaging registerForNotification:typeStr andToken:deviceToken];
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
    return [FirestackErrors handleFirebaseError:name
                                   error:error
                                withUser:user];
}

- (void) handleException:(NSException *)exception
            withCallback:(RCTResponseSenderBlock)callback
{
    [FirestackErrors handleException:exception
                        withCallback:callback];
}

- (void) debugLog:(NSString *)title
              msg:(NSString *)msg
{
    if (self.debug) {
//        [self sendJSEvent:DEBUG_EVENT
//                    props:@{
//                            @"name": title,
//                            @"message": msg
//                            }];
    }
}

// Not sure how to get away from this... yet
- (NSArray<NSString *> *)supportedEvents {
    return @[DEBUG_EVENT, AUTH_CHANGED_EVENT];
}

- (void) sendJSEvent:(NSString *)title
               props:(NSDictionary *)props
{
    @try {
        [self sendEventWithName:title
                           body:props];
    }
    @catch (NSException *err) {
        NSLog(@"An error occurred in sendJSEvent: %@", [err debugDescription]);
    }
}

@end
