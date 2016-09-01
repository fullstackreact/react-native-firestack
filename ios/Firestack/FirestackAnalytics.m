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

RCT_EXPORT_METHOD(logEventWithName:(NSString *)name
                  props:(NSDictionary *)props
                  callback:(RCTResponseSenderBlock) callback)
{
    NSLog(@"logEventWithName called: %@ and %@", name, props);
    [FIRAnalytics logEventWithName:name parameters:props];
    callback(@[[NSNull null], @YES]);
}

@end
