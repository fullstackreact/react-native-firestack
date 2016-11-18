//
//  FirestackRemoteConfig.m
//  Firestack
//
//  Created by Jean Silva on 11/17/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "FirestackRemoteConfig.h"

@implementation FirestackRemoteConfig

RCT_EXPORT_MODULE(FirestackRemoteConfig);


RCT_EXPORT_METHOD(setDefaultRemoteConfig:(NSDictionary *)props
                  isDev:(BOOL) devMode
                  callback:(RCTResponseSenderBlock) callback)
{
    if (!self.remoteConfigInstance) {
        // Create remote Config instance
        self.remoteConfigInstance = [FIRRemoteConfig remoteConfig];
    }
    FIRRemoteConfigSettings *remoteConfigSettings = [[FIRRemoteConfigSettings alloc] initWithDeveloperModeEnabled:devMode];
    
    self.remoteConfigInstance.configSettings = remoteConfigSettings;
    [self.remoteConfigInstance setDefaults: props];
    callback(@[[NSNull null], props]);
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

RCT_EXPORT_METHOD(fetchWithExpiration:(nonnull NSNumber*)expirationSeconds
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

- (NSArray<NSString *> *)supportedEvents {
    return @[];
}

@end
