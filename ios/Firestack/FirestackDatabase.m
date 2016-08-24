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
    
    int eventType = [self eventTypeFromName:name];
    NSLog(@"Calling observeEventType: at path: %@ %@", path, name);
    
    FIRDatabaseReference *ref = [self getRefAtPath:path];
    
    [ref observeEventType:eventType
                withBlock:^(FIRDataSnapshot * _Nonnull snapshot) {
                    callback(@[[NSNull null], [self snapshotToDict:snapshot]]);
                }
          withCancelBlock:^(NSError * _Nonnull error) {
              NSLog(@"Error onDBEvent: %@", [error debugDescription]);
              callback(@[@{
                             @"error": @"onceError",
                             @"msg": [error debugDescription]
                             }]);
          }];
}

RCT_EXPORT_METHOD(onDBEventOnce:(NSString *) path
                  name:(NSString *) name
                  callback:(RCTResponseSenderBlock) callback)
{
    int eventType = [self eventTypeFromName:name];
    
    FIRDatabaseReference *ref = [self getRefAtPath:path];
    [ref observeSingleEventOfType:eventType
                        withBlock:^(FIRDataSnapshot * _Nonnull snapshot) {
                            callback(@[[NSNull null], [self snapshotToDict:snapshot]]);
                        }
                  withCancelBlock:^(NSError * _Nonnull error) {
                      NSLog(@"Error onDBEventOnce: %@", [error debugDescription]);
                      callback(@[@{
                                     @"error": @"onceError",
                                     @"msg": [error debugDescription]
                                     }]);
                  }];
}

// Helpers
- (FIRDatabaseReference *) getRef
{
    if (self.ref == nil) {
        FIRDatabaseReference *rootRef = [[FIRDatabase database] reference];
        self.ref = rootRef;
    }
    return self.ref;
}

- (FIRDatabaseReference *) getRefAtPath:(NSString *) str
{
    FIRDatabaseReference *rootRef = [[FIRDatabase database] reference];
    return [rootRef child:str];
}

- (NSDictionary *) snapshotToDict:(FIRDataSnapshot *) snapshot
{
    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
    [dict setValue:snapshot.key forKey:@"key"];
    NSDictionary *val = snapshot.value;
    [dict setObject:val forKey:@"value"];
    
    [dict setValue:@(snapshot.hasChildren) forKey:@"hasChildren"];
    [dict setValue:@(snapshot.exists) forKey:@"exists"];
    [dict setValue:@(snapshot.childrenCount) forKey:@"childrenCount"];
    [dict setValue:snapshot.priority forKey:@"priority"];
    
    return dict;
}

- (int) eventTypeFromName:(NSString *)name
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
    return eventType;
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
    [self sendEventWithName:title
                       body:props];
}

@end
