//
//  FirestackDatabase.m
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "FirestackDatabase.h"
#import "FirestackEvents.h"

@import FirebaseDatabase;

@implementation FirestackDatabase

RCT_EXPORT_MODULE(FirestackDatabase);

RCT_EXPORT_METHOD(onDBEvent:(NSString *) path
                  name:(NSString *) name
                  callback:(RCTResponseSenderBlock) callback)
{
    int eventType = FIRDataEventTypeValue;
    
    if ([name isEqualToString:@"value"]) {
        eventType = FIRDataEventTypeValue;
    } else if ([name isEqualToString:@"child_added"]) {
        eventType = FIRDataEventTypeChildAdded;
    } else if ([name isEqualToString:@"child_changed"]) {
        eventType = FIRDataEventTypeChildChanged;
    } else if ([name isEqualToString:@"child_removed"]) {
        eventType = FIRDataEventTypeChildRemoved;
    } else if ([name isEqualToString:@"child_moved"]) {
        eventType = FIRDataEventTypeChildMoved;
    }
    
    FIRDatabaseReference *ref = [self getRef];
    [ref observeEventType:eventType
                withBlock:^(FIRDataSnapshot * _Nonnull snapshot) {
                    NSDictionary *valueDict = snapshot.value;
                    NSLog(@"Got a value dic: %@", valueDict);
                }];
}

// Helpers
- (FIRDatabaseReference *) getRef
{
    if (self.ref == nil) {
        FIRDatabaseReference *rootRef= [[FIRDatabase database] reference];
        self.ref = rootRef;
    }
    return self.ref;
}

// Not sure how to get away from this... yet
- (NSArray<NSString *> *)supportedEvents {
    return @[
             DATABASE_VALUE_EVENT
             ];
}

- (void) sendJSEvent:(NSString *)title
               props:(NSDictionary *)props
{
    NSError *err;
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:props
                                                       options:0
                                                         error:&err];
    NSString *jsonStr = [[NSString alloc] initWithData:jsonData
                                              encoding:NSUTF8StringEncoding];
    
    [self sendEventWithName:title
                       body:jsonStr];
}

@end
