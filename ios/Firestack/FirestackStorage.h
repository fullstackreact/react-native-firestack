//
//  FirestackStorage.h
//  Firestack
//
//  Created by Ari Lerner on 8/24/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#ifndef FirestackStorage_h
#define FirestackStorage_h

#import "Firebase.h"
#import "RCTBridgeModule.h"
#import "RCTEventEmitter.h"

@interface FirestackStorage : RCTEventEmitter <RCTBridgeModule> {
    
}

@property (nonatomic) NSString *_storageUrl;

@end

#endif