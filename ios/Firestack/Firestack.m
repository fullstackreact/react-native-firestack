//
//  Firestack.m
//  Created by Ari Lerner on 5/31/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import <objc/runtime.h>

#import "Firestack.h"
#import "FirestackErrors.h"
#import "FirestackEvents.h"
#import "FirestackAnalytics.h"
// #import "FirestackCloudMessaging.h"

@import Firebase;

static Firestack *_sharedInstance = nil;

@implementation Firestack

typedef void (^UserWithTokenResponse)(NSDictionary *, NSError *);

- (void)dealloc
{
    NSLog(@"Dealloc called on Firestack: %@", self);
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (instancetype) init {
  self = [super init];
  if (self) {
    NSLog(@"Initializing Firestack: %@", self);
    [Firestack initializeFirestack:self];
  }
  return self;
}

+ (void) initializeFirestack:(Firestack *) instance
{
    NSLog(@"Shared instance created on Firestack: %@", instance);
    // [FIRApp configureWithOptions:finalOptions];

    _sharedInstance = instance;

    [[NSNotificationCenter defaultCenter] 
      postNotificationName:kFirestackInitialized
      object:[instance getConfig]];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(reloadFirestack)
                                                 name:RCTReloadNotification
                                               object:nil];

    // [[NSNotificationCenter defaultCenter] 
    //     postNotificationName:RCTReloadNotification 
    //     object:nil 
    //     userInfo:nil];

    // [[NSNotificationCenter defaultCenter] addObserver:self
    //     selector:@selector(firestackConfigured:)
    //     name:kFirestackInitialized
    //     object:instance];
}

+ (instancetype) sharedInstance
{
    return _sharedInstance;
}

+ (void) reloadFirestack
{
    // Reloading firestack
    [[Firestack sharedInstance] debugLog:@"Firestack"
                                     msg:@"Reloading firestack"];
}

- (FIRApp *) firebaseApp
{
    return [FIRApp defaultApp];
}


RCT_EXPORT_MODULE(Firestack);

RCT_EXPORT_METHOD(configureWithOptions:(NSDictionary *) opts
                  callback:(RCTResponseSenderBlock)callback)
{
    // Are we debugging, yo?
    self.debug = [opts valueForKey:@"debug"] != nil ? YES : NO;
    NSDictionary *props = [self pluckOptions:opts];

    @try {
        if (self.debug) {
            NSLog(@"debugging: %@", [props valueForKey:@"debug"]);
            NSLog(@"cloudMessaging: %@", [props valueForKey:@"cloudMessaging"]);
        }
         
        NSLog(@"Configuring firestack instance: %@", self);
         // Save configuration option
        NSDictionary *cfg = [self getConfig];
        [cfg setValuesForKeysWithDictionary:props];
        self.configuration = cfg;

        [Firestack initializeFirestack:self];
        self.configured = YES;
        callback(@[[NSNull null], props]);
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

/**
 * Pluck the options that are given by JS
 **/
- (NSDictionary *) pluckOptions:(NSDictionary *) opts
{
        NSDictionary *keyMapping = @{
                                 @"cloudMessaging": @[
                                         @"messaging",
                                         ]
                                 };
    NSArray *optionKeys = [keyMapping allKeys];
    NSString *plistPath = [[NSBundle mainBundle] pathForResource:@"Info" ofType:@"plist"];

    NSDictionary *defaultOptions = @{
        @"debug": @NO,
        @"cloudMessaging": @{
            @"enabled": @YES
        }
    };
    
    NSMutableDictionary *props = [defaultOptions copy];

    if ([[NSFileManager defaultManager] fileExistsAtPath:plistPath]) {
        // If the Info plist is included
        NSDictionary *infoProps = [NSMutableDictionary dictionaryWithContentsOfFile:plistPath];
        NSDictionary *firestackOptions = [infoProps valueForKey:@"firestack"];
        if (firestackOptions != nil) {
            props = [firestackOptions copy];
        }
    }

    // Prefer the user configuration options over the default options
    for (int i=0; i < [optionKeys count]; i++) {
        // Traditional for loop here
        @try {
            NSString *key = [optionKeys objectAtIndex:i];

            // If the name is the key name            
            NSMutableArray *possibleNames = [NSMutableArray arrayWithArray:[keyMapping objectForKey:key]];
            [possibleNames addObject:key];

            for (NSString *name in possibleNames) {
                if ([opts valueForKey:name] != nil) {
                    // The user passed this option in
                    NSString *value = [opts valueForKey:name];
                    [props setValue:value forKey:key];
                }
            }
        }
        @catch (NSException *err) {
            // Uh oh?
            NSLog(@"An error occurred: %@", err);
        }
    }

    return props;
}


RCT_EXPORT_METHOD(configure:(RCTResponseSenderBlock)callback)
{
    NSDictionary *props = @{};
    [self configureWithOptions:props
                      callback:callback];
}

#pragma mark - Storage


#pragma mark RemoteConfig

// RCT_EXPORT_METHOD(setDefaultRemoteConfig:(NSDictionary *)props
//                   callback:(RCTResponseSenderBlock) callback)
// {
//     if (!self.remoteConfigInstance) {
//         // Create remote Config instance
//         self.remoteConfigInstance = [FIRRemoteConfig remoteConfig];
//     }

//     [self.remoteConfigInstance setDefaults:props];
//     callback(@[[NSNull null], props]);
// }

// RCT_EXPORT_METHOD(setDev:(RCTResponseSenderBlock) callback)
// {
//     FIRRemoteConfigSettings *remoteConfigSettings = [[FIRRemoteConfigSettings alloc] initWithDeveloperModeEnabled:YES];
//     self.remoteConfigInstance.configSettings = remoteConfigSettings;
//     callback(@[[NSNull null], @"ok"]);
// }

// RCT_EXPORT_METHOD(configValueForKey:(NSString *)name
//                   callback:(RCTResponseSenderBlock) callback)
// {
//     if (!self.remoteConfigInstance) {
//         NSDictionary *err = @{
//                               @"error": @"No configuration instance",
//                               @"msg": @"No configuration instance set. Please call setDefaultRemoteConfig before using this feature"
//                               };
//         callback(@[err]);
//     }


//     FIRRemoteConfigValue *value = [self.remoteConfigInstance configValueForKey:name];
//     NSString *valueStr = value.stringValue;

//     if (valueStr == nil) {
//         valueStr = @"";
//     }
//     callback(@[[NSNull null], valueStr]);
// }

// RCT_EXPORT_METHOD(fetchWithExpiration:(NSNumber*)expirationSeconds
//                   callback:(RCTResponseSenderBlock) callback)
// {
//     if (!self.remoteConfigInstance) {
//         NSDictionary *err = @{
//                               @"error": @"No configuration instance",
//                               @"msg": @"No configuration instance set. Please call setDefaultRemoteConfig before using this feature"
//                               };
//         callback(@[err]);
//     }

//     NSTimeInterval expirationDuration = [expirationSeconds doubleValue];

//     [self.remoteConfigInstance fetchWithExpirationDuration:expirationDuration completionHandler:^(FIRRemoteConfigFetchStatus status, NSError *error) {
//         if (status == FIRRemoteConfigFetchStatusSuccess) {
//             NSLog(@"Config fetched!");
//             [self.remoteConfigInstance activateFetched];
//             callback(@[[NSNull null], @(YES)]);
//         } else {
//             NSLog(@"Error %@", error.localizedDescription);

//             NSDictionary *err = @{
//                                   @"error": @"No configuration instance",
//                                   @"msg": [error localizedDescription]
//                                   };

//             callback(@[err]);
//         }
//     }];
// }

#pragma mark Database

#pragma mark Messaging

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
        NSLog(@"%@: %@", title, msg);
    }
}

// Not sure how to get away from this... yet
- (NSArray<NSString *> *)supportedEvents {
    return @[INITIALIZED_EVENT, DEBUG_EVENT, AUTH_CHANGED_EVENT];
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
