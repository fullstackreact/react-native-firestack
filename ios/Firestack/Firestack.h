//
//  Firestack.h
//  Created by Ari Lerner on 5/31/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

//#import "../../../../React/Base/RCTBridgeModule.h"
//#import "../../../../React/Base/RCTEventDispatcher.h"
//#import "../../../../React/Base/RCTUtils.h"
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"
#import "Firebase.h"

@import Firebase;

@interface Firestack : NSObject <RCTBridgeModule> {
    FIRAuthStateDidChangeListenerHandle authListenerHandle;
}

@property (atomic) BOOL configured;
@property (nonatomic, strong) NSDictionary *configuration;

@end
