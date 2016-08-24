//
//  FirebaseErrors.h
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "RCTBridgeModule.h"

@import Firebase;
@import FirebaseAuth;

@interface FirestackErrors : NSObject <RCTBridgeModule> {
    
}

+ (void) handleException:(NSException *)exception
            withCallback:(RCTResponseSenderBlock)callback;

+ (NSDictionary *) handleFirebaseError:(NSString *) name
                                 error:(NSError *) error
                              withUser:(FIRUser *) user;
@end
