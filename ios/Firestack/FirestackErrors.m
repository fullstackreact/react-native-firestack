//
//  FirebaseErrors.m
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "FirestackErrors.h"

@implementation FirestackErrors

RCT_EXPORT_MODULE(FirestackErrors);

+ (void) handleException:(NSException *)exception
            withCallback:(RCTResponseSenderBlock)callback
{
    NSString *errDesc = [exception description];
    NSLog(@"An error occurred: %@", errDesc);
    // No user is signed in.
    NSDictionary *err = @{
                          @"error": @"No user signed in",
                          @"description": errDesc
                          };
    callback(@[err]);
}

+ (NSDictionary *) handleFirebaseError:(NSString *) name
                                 error:(NSError *) error
                              withUser:(FIRUser *) user
{
    NSMutableDictionary *err = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                name, @"name",
                                @([error code]), @"code",
                                [error localizedDescription], @"rawDescription",
                                [[error userInfo] description], @"userInfo",
                                nil];
    
    NSString *description = @"Unknown error";
    switch (error.code) {
        case FIRAuthErrorCodeInvalidEmail:
            description = @"Invalid email";
            break;
        case FIRAuthErrorCodeUserNotFound:
            description = @"User not found";
            break;
        case FIRAuthErrorCodeNetworkError:
            description = @"Network error";
            break;
        case FIRAuthErrorCodeInternalError:
            description = @"Internal error";
            break;
        default:
            break;
    }
    [err setValue:description forKey:@"description"];
    return [NSDictionary dictionaryWithDictionary:err];
}

@end
