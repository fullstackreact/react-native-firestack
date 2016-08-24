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

RCT_EXPORT_METHOD(on:(NSString *) path
                  name:(NSString *) name
                  callback:(RCTResponseSenderBlock) callback)
{
    
    int eventType = [self eventTypeFromName:name];
    NSLog(@"Calling observeEventType: at path: %@ %@", path, name);
    
    FIRDatabaseReference *ref = [self getRefAtPath:path];
    
    FIRDatabaseHandle handle = [ref observeEventType:eventType
                                           withBlock:^(FIRDataSnapshot * _Nonnull snapshot) {
                                               NSDictionary *props =
                                               [self snapshotToDict:snapshot];
                                               
                               NSLog(@"props: %@", props);
                                               [self
                                                sendJSEvent:name
                                                props: @{
                                                         @"eventName": name,
                                                         @"snapshot": props
                                                         }];
                                           }
                                     withCancelBlock:^(NSError * _Nonnull error) {
                                         NSLog(@"Error onDBEvent: %@", [error debugDescription]);
                                         [self
                                          sendJSEvent:DATABASE_ERROR_EVENT
                                          props: @{
                                                   @"eventName": DATABASE_ERROR_EVENT,
                                                   @"msg": [error debugDescription]
                                                   }];
                                     }];
    
    int idx = [self storeDBHandle:handle];
    
    callback(@[[NSNull null], @{
                   @"result": @"success",
                   @"handle": @(idx)
                   }]);
}

RCT_EXPORT_METHOD(onOnce:(NSString *) path
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

RCT_EXPORT_METHOD(off:(NSString *)path
                  handleNumber:(NSInteger) handleNumber
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [self getRefAtPath:path];
    
    if (handleNumber == -1) {
        [ref removeAllObservers];
    } else {
        FIRDatabaseHandle handle = [[self storedDBHandles] objectAtIndex:handleNumber];
        if (handle != nil) {
            [ref removeObserverWithHandle:handle];
            [self removeDBHandle:handleNumber];
        } else {
            [ref removeAllObservers];
        }
    }
    callback(@[[NSNull null], @(true)]);
}

RCT_EXPORT_METHOD(removeListeners:(NSString *) path
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [self getRefAtPath:path];
    [ref removeAllObservers];
    callback(@[[NSNull null], @(true)]);
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

// Handles
- (NSArray *) storedDBHandles
{
    if (self._DBHandles == nil) {
        self._DBHandles = [[NSMutableArray alloc] init];
    }
    return self._DBHandles;
}

- (int) storeDBHandle:(FIRDatabaseHandle) handle
{
    NSMutableArray *stored = [[self storedDBHandles] mutableCopy];
    
    NSNumber *handleNum = [NSNumber numberWithUnsignedLong:handle];
    
    [stored addObject:handleNum];
    self._DBHandles = stored;
    
    int handleIdx = [stored indexOfObject:handleNum];
    return handleIdx;
}

- (int) removeDBHandle:(int) idx
{
    NSMutableArray *stored = [[self storedDBHandles] mutableCopy];
    if ([stored objectAtIndex:idx]) {
        [stored removeObjectAtIndex:idx];
        self._DBHandles = stored;
    }
    return idx;
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
    
    if ([name isEqualToString:DATABASE_VALUE_EVENT]) {
        eventType = FIRDataEventTypeValue;
    } else if ([name isEqualToString:DATABASE_CHILD_ADDED_EVENT]) {
        eventType = FIRDataEventTypeChildAdded;
    } else if ([name isEqualToString:DATABASE_CHILD_MODIFIED_EVENT]) {
        eventType = FIRDataEventTypeChildChanged;
    } else if ([name isEqualToString:DATABASE_CHILD_REMOVED_EVENT]) {
        eventType = FIRDataEventTypeChildRemoved;
    } else if ([name isEqualToString:DATABASE_CHILD_MOVED_EVENT]) {
        eventType = FIRDataEventTypeChildMoved;
    }
    return eventType;
}

// Not sure how to get away from this... yet
// Not sure how to get away from this... yet
- (NSArray<NSString *> *)supportedEvents {
    return @[
             DATABASE_VALUE_EVENT,
             DATABASE_CHILD_ADDED_EVENT,
             DATABASE_CHILD_MODIFIED_EVENT,
             DATABASE_CHILD_MOVED_EVENT,
             DATABASE_CHILD_REMOVED_EVENT
             ];
}

- (void) sendJSEvent:(NSString *)title
               props:(NSDictionary *)props
{
    @try {
        [self sendEventWithName:title
                           body:props];
    }
    @catch (NSException *err) {
        NSLog(@"An error occurred in sendJSEvent: %@", [err debugDescription]);
    }
}

@end
