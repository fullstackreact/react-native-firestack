//
//  FirestackMessaging.h
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#ifndef FirestackCloudMessaging_h
#define FirestackCloudMessaging_h

#import "Firebase.h"
#import "RCTEventEmitter.h"
#import "RCTBridgeModule.h"
#import "RCTUtils.h"

@interface FirestackCloudMessaging : RCTEventEmitter <RCTBridgeModule> {
    
}

+ (void) setup:(UIApplication *)application;

@end

#endif