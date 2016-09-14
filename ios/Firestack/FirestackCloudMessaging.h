//
//  FirestackMessaging.h
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "RCTBridgeModule.h"

@interface FirestackCloudMessaging : NSObject <RCTBridgeModule> {
    
}

+ (void) registerForNotification:(NSString *) typeStr andToken:(NSData *)deviceToken;

@end
