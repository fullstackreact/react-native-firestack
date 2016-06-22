//
//  Firestack.h
//  Created by Ari Lerner on 5/31/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <Firebase.h>
#import "RCTBridgeModule.h"
#import "RCTEventDispatcher.h"

@interface Firestack : NSObject <RCTBridgeModule> {
    FIRAuthStateDidChangeListenerHandle authListenerHandle;
}

@property (atomic) BOOL configured;
@property (nonatomic, strong) NSDictionary *configuration;

@end
