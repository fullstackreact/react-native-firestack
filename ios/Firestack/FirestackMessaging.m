//
//  FirestackMessaging.m
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "FirestackMessaging.h"

@import FirebaseInstanceID;
//@import FirebaseMessaging;

@implementation FirestackMessaging

RCT_EXPORT_MODULE(FirestackMessaging);

+ (void) registerForNotification:(NSString *) typeStr andToken:(NSData *)deviceToken
{
//    int type = FIRInstanceIDAPNSTokenTypeUnknown;
//    if ([typeStr isEqualToString:@"production"]) {
//        type = FIRInstanceIDAPNSTokenTypeProd;
//    } else if ([typeStr isEqualToString:@"sandbox"]) {
//        type = FIRInstanceIDAPNSTokenTypeSandbox;
//    }
//    
//    [[FIRInstanceID instanceID] setAPNSToken:deviceToken
//                                        type:type];
}

@end
