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

RCT_EXPORT_METHOD(set:(NSString *) path
                  value:(NSDictionary *)value
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [self getRefAtPath:path];
    
    [ref setValue:value withCompletionBlock:^(NSError * _Nullable error, FIRDatabaseReference * _Nonnull ref) {
        if (error != nil) {
            // Error handling
            NSDictionary *evt = [self getAndSendDatabaseError:error];
            callback(@[evt]);
        } else {
            callback(@[[NSNull null], @{
                           @"result": @"success"
                           }]);
        }
    }];
}

RCT_EXPORT_METHOD(update:(NSString *) path
                  value:(NSDictionary *)value
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [self getRefAtPath:path];
    
    [ref updateChildValues:value withCompletionBlock:^(NSError * _Nullable error, FIRDatabaseReference * _Nonnull ref) {
        if (error != nil) {
            // Error handling
            NSDictionary *evt = [self getAndSendDatabaseError:error];
            callback(@[evt]);
        } else {
            callback(@[[NSNull null], @{
                           @"result": @"success"
                           }]);
        }
    }];
}

RCT_EXPORT_METHOD(remove:(NSString *) path
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [self getRefAtPath:path];
    [ref removeValueWithCompletionBlock:^(NSError * _Nullable error, FIRDatabaseReference * _Nonnull ref) {
        if (error != nil) {
            // Error handling
            NSDictionary *evt = [self getAndSendDatabaseError:error];
            callback(@[evt]);
        } else {
            callback(@[[NSNull null], @{
                           @"result": @"success"
                           }]);
        }
    }];
}




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
                                               [self
                                                sendJSEvent:name
                                                props: @{
                                                         @"eventName": name,
                                                         @"snapshot": props
                                                         }];
                                           }
                                     withCancelBlock:^(NSError * _Nonnull error) {
                                         NSLog(@"Error onDBEvent: %@", [error debugDescription]);
                                         [self getAndSendDatabaseError:error];
                                     }];
    
    NSString *idx = [self storeDBHandle:handle];
    
    callback(@[[NSNull null], @{
                   @"result": @"success",
                   @"handle": idx
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
                  handleNumber:(NSString *) handleNumber
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [self getRefAtPath:path];
    
    if ([handleNumber isEqualToString:@"-1"]) {
        [ref removeAllObservers];
    } else {
        FIRDatabaseHandle handle = (FIRDatabaseHandle)[[self storedDBHandles] objectForKey:handleNumber];
        if (handle) {
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
- (NSDictionary *) storedDBHandles
{
    if (self._DBHandles == nil) {
        self._DBHandles = [[NSDictionary alloc] init];
    }
    return self._DBHandles;
}

- (NSString *) storeDBHandle:(FIRDatabaseHandle) handle
{
    NSMutableDictionary *stored = [[self storedDBHandles] mutableCopy];
    
    NSNumber *handleNum = [NSNumber numberWithUnsignedLong:handle];
    NSString *strNum = [NSString stringWithFormat:@"%@", handleNum];
    
    if ([stored objectForKey:strNum] == nil) {
        [stored setValue:@(handle) forKey:strNum];
        self._DBHandles = [stored copy];
    }
    
    return strNum;
}

- (void) removeDBHandle:(NSString *) idxStr
{
    NSMutableDictionary *stored = [[self storedDBHandles] mutableCopy];
    
    if ([stored objectForKey:idxStr]) {
        [stored removeObjectForKey:idxStr];
        self._DBHandles = [stored copy];
    }
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

- (NSDictionary *) getAndSendDatabaseError:(NSError *) error
{
    NSDictionary *evt = @{
                          @"eventName": DATABASE_ERROR_EVENT,
                          @"msg": [error debugDescription]
                          };
    [self
     sendJSEvent:DATABASE_ERROR_EVENT
     props: evt];
    
    return evt;
}

// Not sure how to get away from this... yet
- (NSArray<NSString *> *)supportedEvents {
    return @[
             DATABASE_VALUE_EVENT,
             DATABASE_CHILD_ADDED_EVENT,
             DATABASE_CHILD_MODIFIED_EVENT,
             DATABASE_CHILD_MOVED_EVENT,
             DATABASE_CHILD_REMOVED_EVENT,
             DATABASE_ERROR_EVENT
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
        NSLog(@"Tried to send: %@ with %@", title, props);
    }
}

@end
