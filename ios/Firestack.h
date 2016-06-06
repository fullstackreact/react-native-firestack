//
//  Firestack.h
//  Created by Ari Lerner on 5/31/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"

@import Firebase;
@import FirebaseStorage;

@interface Firestack : NSObject <RCTBridgeModule> {
    FIRAuthStateDidChangeListenerHandle authListenerHandle;
}

@property (atomic) BOOL configured;
@property (nonatomic, strong) NSDictionary *configuration;

@end
