//
//  FirestackAnalytics.m
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "FirestackAnalytics.h"

@import FirebaseAnalytics;

@implementation FirestackAnalytics

RCT_EXPORT_MODULE(FirestackAnalytics);

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

RCT_EXPORT_METHOD(logEventWithName:(NSString *)name
                  props:(NSDictionary *)props
                  callback:(RCTResponseSenderBlock) callback)
{
    NSLog(@"logEventWithName called: %@ and %@", name, props);
    [FIRAnalytics logEventWithName:name parameters:props];
    callback(@[[NSNull null], @YES]);
}

RCT_EXPORT_METHOD(setEnabled:(BOOL) enabled
  callback:(RCTResponseSenderBlock) callback)
{
  [[FIRAnalyticsConfiguration sharedInstance] setAnalyticsCollectionEnabled:enabled];
  callback(@[[NSNull null], @YES]);
}

RCT_EXPORT_METHOD(setUser: (NSString *) id
  props:(NSDictionary *) props
  callback:(RCTResponseSenderBlock) callback)
{
  [FIRAnalytics setUserID:id];
  NSMutableArray *allKeys = [[props allKeys] mutableCopy];
  for (NSString *key in allKeys) {
    NSString *val = [props valueForKey:key];
    [FIRAnalytics setUserPropertyString:val forName:key];
  }

  callback(@[[NSNull null], @YES]);
}

@end
