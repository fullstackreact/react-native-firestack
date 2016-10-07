//
//  FirebaseErrors.h
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#ifndef FirestackErrors_h
#define FirestackErrors_h

#import "RCTBridgeModule.h"
#import "Firebase.h"

@interface FirestackErrors : NSObject <RCTBridgeModule> {
    
}

+ (void) handleException:(NSException *)exception
            withCallback:(RCTResponseSenderBlock)callback;

+ (NSDictionary *) handleFirebaseError:(NSString *) name
                                 error:(NSError *) error
                              withUser:(FIRUser *) user;
@end

#endif