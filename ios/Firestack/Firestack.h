//
//  Firestack.h
//  Created by Ari Lerner on 5/31/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

// #import <UIKit/UIKit.h>
#import "Firebase.h"
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#import "RCTEventEmitter.h"
#import "AppDelegate+Firestack.h"

@interface Firestack : RCTEventEmitter <RCTBridgeModule> {
    FIRAuthStateDidChangeListenerHandle authListenerHandle;
}

// + (void) registerForNotification:(NSString *) typeStr andToken:(NSData *)deviceToken;
// + (void) setup:(UIApplication *) application;

+ (void) reloadFirestack;
+ (void) initializeFirestack:(Firestack *) instance;
+ (instancetype) sharedInstance;
- (FIRApp *) firebaseApp;

- (void) debugLog:(NSString *)title
              msg:(NSString *)msg;


@property (nonatomic) BOOL debug;
@property (atomic) BOOL configured;
@property (nonatomic, strong) NSDictionary *configuration;

@end
