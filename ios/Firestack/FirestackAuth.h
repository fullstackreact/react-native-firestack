//
//  FirestackAuth.h
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#ifndef FirestackAuth_h
#define FirestackAuth_h

#import "Firebase.h"
#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>

@interface FirestackAuth : RCTEventEmitter <RCTBridgeModule> {
    FIRAuthStateDidChangeListenerHandle authListenerHandle;
    Boolean listening;
}

@end

#endif