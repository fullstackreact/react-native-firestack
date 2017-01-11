//
//  Firestack.h
//  Created by Ari Lerner on 5/31/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#ifndef Firestack_h
#define Firestack_h

#import <UIKit/UIKit.h>
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#import "RCTEventEmitter.h"

@interface Firestack : RCTEventEmitter <RCTBridgeModule> {
}

// + (void) registerForNotification:(NSString *) typeStr andToken:(NSData *)deviceToken;
+ (void) setup:(UIApplication *) application
withLaunchOptions: (NSDictionary *) launchOptions;

+ (id) sharedInstance;

- (void) debugLog:(NSString *)title
              msg:(NSString *)msg;

- (void) sendJSEvent:(NSString *)title
               props:(NSDictionary *)props;


@property (nonatomic) BOOL debug;
@property (atomic) BOOL configured;
@property (nonatomic, strong) NSDictionary *configuration;

@end

#endif
