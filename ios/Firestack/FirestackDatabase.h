//
//  FirestackDatabase.h
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#ifndef FirestackDatabase_h
#define FirestackDatabase_h

#import "Firebase.h"
#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>

@interface FirestackDatabase : RCTEventEmitter <RCTBridgeModule> {

}

@property NSMutableDictionary *dbReferences;

@end

#endif
