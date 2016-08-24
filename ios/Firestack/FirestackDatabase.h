//
//  FirestackDatabase.h
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "Firebase.h"
#import "RCTEventEmitter.h"
#import "RCTBridgeModule.h"

@import FirebaseDatabase;

@interface FirestackDatabase : RCTEventEmitter <RCTBridgeModule> {

}

@property (nonatomic, weak) FIRDatabaseReference *ref;

@end