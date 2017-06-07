//
//  FirestackRemoteConfig.h
//  Firestack
//
//  Created by Jean Silva on 11/17/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#ifndef FirestackRemoteConfig_h
#define FirestackRemoteConfig_h

#import "Firebase.h"
#import "RCTBridgeModule.h"
#import "RCTEventEmitter.h"

@interface FirestackRemoteConfig : RCTEventEmitter <RCTBridgeModule> {
    
}

@property (nonatomic, strong) FIRRemoteConfig *remoteConfigInstance;

@end

#endif /* FirestackRemoteConfig_h */
