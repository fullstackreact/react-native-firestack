//
//  FirestackAnalytics.m
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "Firestack.h"
#import "FirestackEvents.h"
#import "FirestackAnalytics.h"
#import "Firebase.h"

@implementation FirestackAnalytics

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

RCT_EXPORT_MODULE(FirestackAnalytics);

// Implementation
RCT_EXPORT_METHOD(logEvent:(NSString *)name
                  props:(NSDictionary *)props)
{
  NSString *debugMsg = [NSString stringWithFormat:@"%@: %@ with %@", 
                          @"FirestackAnalytics", name, props];
  [[Firestack sharedInstance] debugLog:@"logEventWithName called"
                                   msg:debugMsg];

  [FIRAnalytics logEventWithName:name parameters:props];
}

RCT_EXPORT_METHOD(setAnalyticsCollectionEnabled:(BOOL) enabled)
{
  [[FIRAnalyticsConfiguration sharedInstance] setAnalyticsCollectionEnabled:enabled];
}

RCT_EXPORT_METHOD(setCurrentScreen:(NSString *) screenName
                       screenClass:(NSString *) screenClassOverriew)
{
  [FIRAnalytics setScreenName:screenName screenClass:screenClassOverriew];
}

RCT_EXPORT_METHOD(setMinimumSessionDuration:(NSNumber *) milliseconds)
{
  //Not implemented on iOS
}

RCT_EXPORT_METHOD(setSessionTimeoutDuration:(NSNumber *) milliseconds)
{
  //Not implemented on iOS
}

RCT_EXPORT_METHOD(setUserId: (NSString *) id
  props:(NSDictionary *) props)
{
  [FIRAnalytics setUserID:id];
}

RCT_EXPORT_METHOD(setUserProperty: (NSString *) name
  value:(NSString *) value)
{
  [FIRAnalytics setUserPropertyString:value forName:name];
}

@end
