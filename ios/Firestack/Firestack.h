//
//  Firestack.h
//  Created by Ari Lerner on 5/31/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

// #import <UIKit/UIKit.h>
#import <Firebase.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventDispatcher.h>

@interface Firestack : NSObject <RCTBridgeModule> {
    FIRAuthStateDidChangeListenerHandle authListenerHandle;
}

@property (nonatomic) BOOL debug;
@property (atomic) BOOL configured;
@property (nonatomic, strong) NSDictionary *configuration;
@property (nonatomic, strong) FIRRemoteConfig *remoteConfigInstance;

@end
