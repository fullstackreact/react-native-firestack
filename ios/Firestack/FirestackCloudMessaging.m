//
//  FirestackMessaging.m
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <NotificationCenter/NotificationCenter.h>
#if defined(__IPHONE_10_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0
#import <UserNotifications/UserNotifications.h>
#endif
#import "FirestackCloudMessaging.h"
#import "FirestackEvents.h"
// #import "RCTConvert.h"

@implementation FirestackCloudMessaging

// https://github.com/facebook/react-native/blob/master/Libraries/PushNotificationIOS/RCTPushNotificationManager.m
static NSDictionary *RCTFormatLocalNotification(UILocalNotification *notification)
{
  NSMutableDictionary *formattedLocalNotification = [NSMutableDictionary dictionary];
  if (notification.fireDate) {
    NSDateFormatter *formatter = [NSDateFormatter new];
    [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"];
    NSString *fireDateString = [formatter stringFromDate:notification.fireDate];
    formattedLocalNotification[@"fireDate"] = fireDateString;
  }
  formattedLocalNotification[@"alertAction"] = RCTNullIfNil(notification.alertAction);
  formattedLocalNotification[@"alertBody"] = RCTNullIfNil(notification.alertBody);
  formattedLocalNotification[@"applicationIconBadgeNumber"] = @(notification.applicationIconBadgeNumber);
  formattedLocalNotification[@"category"] = RCTNullIfNil(notification.category);
  formattedLocalNotification[@"soundName"] = RCTNullIfNil(notification.soundName);
  formattedLocalNotification[@"userInfo"] = RCTNullIfNil(RCTJSONClean(notification.userInfo));
  formattedLocalNotification[@"remote"] = @NO;
  return formattedLocalNotification;
}

- (void) dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver: self];
}

+ (void) setup:(UIApplication *) application
{
  [[NSNotificationCenter defaultCenter] addObserver:self
    selector:@selector(connectToFirebase)
    name: UIApplicationDidEnterBackgroundNotification
    object: nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
    selector:@selector(disconnectFromFirebase)
    name: UIApplicationDidBecomeActiveNotification
    object: nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
    selector:@selector(handleRemoteNotificationReceived:)
    name:MESSAGING_MESSAGE_RECEIVED_REMOTE
    object: nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
    selector:@selector(handleLocalNotificationReceived:)
    name:MESSAGING_MESSAGE_RECEIVED_LOCAL
    object: nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
    selector:@selector(handleTokenRefresh)
    name:kFIRInstanceIDTokenRefreshNotification
    object: nil];
}

#pragma mark Request permissions
- (void) requestPermissions:(NSDictionary *)requestedPermissions
          callback:(RCTResponseSenderBlock) callback
{
  if (SYSTEM_VERSION_LESS_THAN_OR_EQUAL_TO(@"9.0")) {
    UIUserNotificationType allNotificationTypes =
      (UIUserNotificationTypeSound | UIUserNotificationTypeAlert | UIUserNotificationTypeBadge);
    UIUserNotificationSettings *settings =
    [UIUserNotificationSettings settingsForTypes:allNotificationTypes categories:nil];
    [[UIApplication sharedApplication] registerUserNotificationSettings:settings];
  } else {
    // iOS 10 or later
    #if defined(__IPHONE_10_0) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0
    UNAuthorizationOptions authOptions =
        UNAuthorizationOptionAlert
        | UNAuthorizationOptionSound
        | UNAuthorizationOptionBadge;
    [[UNUserNotificationCenter currentNotificationCenter]
        requestAuthorizationWithOptions:authOptions
        completionHandler:^(BOOL granted, NSError * _Nullable error) {
        }
    ];

    // For iOS 10 display notification (sent via APNS)
    [[UNUserNotificationCenter currentNotificationCenter] setDelegate:self];
    // For iOS 10 data message (sent via FCM)
    [[FIRMessaging messaging] setRemoteMessageDelegate:self];
    #endif
  }

  [[UIApplication sharedApplication] registerForRemoteNotifications];
}

#pragma mark callbacks
- (void) connectToFirebase
{
  [[FIRMessaging messaging] connectWithCompletion:^(NSError *error) {
    NSDictionary *evt;
    NSString *evtName;
    if (error != nil) {
      NSLog(@"Error connecting: %@", [error debugDescription]);
      evtName = MESSAGING_SUBSYSTEM_ERROR;
      evt = @{
              @"eventName": MESSAGING_SUBSYSTEM_ERROR,
              @"msg": [error debugDescription]
              };
    } else {
      NSLog(@"Connected to Firebase messaging");
      evtName = MESSAGING_SUBSYSTEM_EVENT;
      evt = @{
            @"result": @"connected"
            };
    [self
     sendJSEvent:evtName
     props: evt];
    
    }
  }];
}

- (void) disconnectFromFirebase
{
  [[FIRMessaging messaging] disconnect];
  NSLog(@"Disconnect from Firebase");
  [self
     sendJSEvent:MESSAGING_SUBSYSTEM_EVENT
     props: @{
      @"status": @"disconnected"
     }];
}

- (void) handleRemoteNotificationReceived:(NSNotification *) n
{
  NSMutableDictionary *props = [[NSMutableDictionary alloc] initWithDictionary: n.userInfo];
  [self sendJSEvent:MESSAGING_MESSAGE_RECEIVED_REMOTE props: props];
}

- (void) handleLocalNotificationReceived:(NSNotification *) n
{
  NSMutableDictionary *props = [[NSMutableDictionary alloc] initWithDictionary: n.userInfo];
  [self sendJSEvent:MESSAGING_MESSAGE_RECEIVED_LOCAL props: props];
}

- (void) handleTokenRefresh
{
  NSDictionary *props = @{
    @"status": @"token_refreshed",
    @"token": [[FIRInstanceID instanceID] token]
  };
  [self sendJSEvent:MESSAGING_TOKEN_REFRESH props: props];
}

RCT_EXPORT_MODULE(FirestackCloudMessaging);


RCT_EXPORT_METHOD(getToken:(RCTResponseSenderBlock)callback)
{
  NSString *token = [[FIRInstanceID instanceID] token];
  callback(@[[NSNull null], @{
    @"status": @"success",
    @"token": token
  }]);
}



RCT_EXPORT_METHOD(sendLocal:(UILocalNotification *)notification
  callback:(RCTResponseSenderBlock) callback)
{
  NSLog(@"sendLocal called with notification: %@", notification);
  [RCTSharedApplication() presentLocalNotificationNow:notification];
}
RCT_EXPORT_METHOD(scheduleLocal:(UILocalNotification *)notification
  callback:(RCTResponseSenderBlock) callback)
{
  [RCTSharedApplication() scheduleLocalNotification:notification];
}

RCT_EXPORT_METHOD(cancelAllLocalNotifications)
{
  [RCTSharedApplication() cancelAllLocalNotifications];
}

RCT_EXPORT_METHOD(cancelLocalNotifications:(NSDictionary<NSString *, id> *)userInfo)
{
  for (UILocalNotification *notification in [UIApplication sharedApplication].scheduledLocalNotifications) {
    __block BOOL matchesAll = YES;
    NSDictionary<NSString *, id> *notificationInfo = notification.userInfo;
    // Note: we do this with a loop instead of just `isEqualToDictionary:`
    // because we only require that all specified userInfo values match the
    // notificationInfo values - notificationInfo may contain additional values
    // which we don't care about.
    [userInfo enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, BOOL *stop) {
      if (![notificationInfo[key] isEqual:obj]) {
        matchesAll = NO;
        *stop = YES;
      }
    }];
    if (matchesAll) {
      [[UIApplication sharedApplication] cancelLocalNotification:notification];
    }
  }
}

RCT_EXPORT_METHOD(sendRemote:(UILocalNotification *)notification
  callback:(RCTResponseSenderBlock) callback)
{
  
}


RCT_EXPORT_METHOD(send:(NSString *) senderId
  messageId:(NSString *) messageId
  messageType:(NSString *) messageType
  msg: (NSString *) msg
  callback:(RCTResponseSenderBlock)callback)
{

}

RCT_EXPORT_METHOD(listenForTokenRefresh:(RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(unlistenForTokenRefresh:(RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(subscribeToTopic:(NSString *) topic
  callback:(RCTResponseSenderBlock)callback)
{
  [[FIRMessaging messaging] subscribeToTopic:topic];
  callback(@[[NSNull null], @{
    @"result": @"success",
    @"topic": topic
  }]);
}

RCT_EXPORT_METHOD(unsubscribeFromTopic:(NSString *) topic
  callback: (RCTResponseSenderBlock)callback)
{
  [[FIRMessaging messaging] unsubscribeFromTopic:topic];
  callback(@[[NSNull null], @{
    @"result": @"success",
    @"topic": topic
  }]);
}

RCT_EXPORT_METHOD(setBadge:(NSInteger) number
  callback:(RCTResponseSenderBlock) callback)
{
  RCTSharedApplication().applicationIconBadgeNumber = number;
  callback(@[[NSNull null], @{
      @"result": @"success",
      @"number": @(number)
    }]);
}

RCT_EXPORT_METHOD(getBadge:(RCTResponseSenderBlock) callback)
{
  callback(@[[NSNull null], @{
    @"result": @"success",
    @"number": @(RCTSharedApplication().applicationIconBadgeNumber)
  }]);
}

RCT_EXPORT_METHOD(listenForReceiveNotification:(RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(unlistenForReceiveNotification:(RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(listenForReceiveUpstreamSend:(RCTResponseSenderBlock)callback)
{}

RCT_EXPORT_METHOD(unlistenForReceiveUpstreamSend:(RCTResponseSenderBlock)callback)
{}

// Not sure how to get away from this... yet
- (NSArray<NSString *> *)supportedEvents {
    return @[
      MESSAGING_SUBSYSTEM_EVENT, 
      MESSAGING_SUBSYSTEM_ERROR,
      MESSAGING_TOKEN_REFRESH,
      MESSAGING_MESSAGE_RECEIVED_LOCAL,
      MESSAGING_MESSAGE_RECEIVED_REMOTE];
}

- (void) sendJSEvent:(NSString *)title
               props:(NSDictionary *)props
{
    @try {
        [self sendEventWithName:title
                           body:@{
                            @"eventName": title,
                            @"body": props
                        }];
    }
    @catch (NSException *err) {
        NSLog(@"An error occurred in sendJSEvent: %@", [err debugDescription]);
        NSLog(@"Tried to send: %@ with %@", title, props);
    }
}

@end
