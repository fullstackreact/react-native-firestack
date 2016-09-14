//
//  FirestackMessaging.m
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "FirestackCloudMessaging.h"

@import FirebaseInstanceID;
//@import FirebaseMessaging;

@implementation FirestackMessaging

RCT_EXPORT_MODULE(FirestackCloudMessaging);

+ (void) getToken:(NSString *) typeStr andToken:(NSData *)deviceToken
{
}

RCT_EXPORT_METHOD(getToken:(RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(send:(NSString *) senderId
  messageId:(NSString *) messageId
  messageType:(NSString *) messageType
  msg: (NSString *) msg
  callback:(RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(listenForTokenRefresh:(RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(unlistenForTokenRefresh:(RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(subscribeToTopic:(NSString *) topic
  callback:(RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(unsubscribeFromTopic:(NSString *) topic
  callback: (RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(listenForReceiveNotification:(RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(unlistenForReceiveNotification:(RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(listenForReceiveUpstreamSend:(RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(unlistenForReceiveUpstreamSend:(RCTResponseSenderBlock)callback)
{}

@end
