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
                  modifiers:(NSArray *) modifiers
                  value:(NSDictionary *)value
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [self getRefAtPathWithModifiers:path
                                                      modifiers:modifiers];
    
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
                  modifiers:(NSArray *) modifiers
                  value:(NSDictionary *)value
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [self getRefAtPathWithModifiers:path
                                                      modifiers:modifiers];
    
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
                  modifiers:(NSArray *) modifiers
                  callback:(RCTResponseSenderBlock) callback)
{
        FIRDatabaseReference *ref = [self getRefAtPathWithModifiers:path
                                  modifiers: modifiers];
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

RCT_EXPORT_METHOD(push:(NSString *) path
                  props:(NSDictionary *) props
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [[self getRefAtPath:path] childByAutoId];

    NSURL *url = [NSURL URLWithString:ref.URL];
    NSString *newPath = [url path];
    
    if ([props count] > 0) {
        [ref setValue:props withCompletionBlock:^(NSError * _Nullable error, FIRDatabaseReference * _Nonnull ref) {
            if (error != nil) {
                // Error handling
                NSDictionary *evt = [self getAndSendDatabaseError:error];
                callback(@[evt]);
            } else {
                callback(@[[NSNull null], @{
                               @"result": @"success",
                               @"ref": newPath
                               }]);
            }
        }];
    } else {
        callback(@[[NSNull null], @{
                       @"result": @"success",
                       @"ref": newPath
                       }]);
    }
}



RCT_EXPORT_METHOD(on:(NSString *) path
                  modifiers:(NSArray *) modifiers
                  name:(NSString *) name
                  callback:(RCTResponseSenderBlock) callback)
{
    
    int eventType = [self eventTypeFromName:name];
    NSLog(@"Calling observeEventType: at path: %@ %@", path, name);
    
    FIRDatabaseReference *ref = [self getRefAtPathWithModifiers:path
                                  modifiers: modifiers];
    
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
                  modifiers:(NSArray *) modifiers
                  name:(NSString *) name
                  callback:(RCTResponseSenderBlock) callback)
{
    int eventType = [self eventTypeFromName:name];
    
    FIRDatabaseReference *ref = [self getRefAtPathWithModifiers:path modifiers:modifiers];
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

- (FIRDatabaseReference *) getRefAtPathWithModifiers:(NSString *) str
                                           modifiers:(NSArray *) modifiers
{
    FIRDatabaseReference *rootRef = [[[FIRDatabase database] reference] child:str];
    
    FIRDatabaseQuery *query;
    for (NSString *str in modifiers) {
        if ([str isEqualToString:@"orderByKey"]) {
            query = [rootRef queryOrderedByKey];
        } else if ([str isEqualToString:@"orderByPriority"]) {
            query = [rootRef queryOrderedByPriority];
        } else if ([str isEqualToString:@"orderByValue"]) {
            query = [rootRef queryOrderedByValue];
        } else if ([str containsString:@"orderByChild"]) {
            NSArray *args = [str componentsSeparatedByString:@":"];
            NSString *key = args[1];
            NSLog(@"Key in orderByChild: %@", key);
            query = [rootRef queryOrderedByChild:key];
        } else if ([str containsString:@"limitToLast"]) {
            NSArray *args = [str componentsSeparatedByString:@":"];
            NSString *key = args[1];
            NSUInteger limit = key.integerValue;
            query = [query queryLimitedToLast:limit];
        } else if ([str containsString:@"limitToFirst"]) {
            NSArray *args = [str componentsSeparatedByString:@":"];
            NSString *key = args[1];
            NSUInteger limit = key.integerValue;
            query = [query queryLimitedToFirst:limit];
        } else if ([str containsString:@"equalTo"]) {
            NSArray *args = [str componentsSeparatedByString:@":"];
            NSString *value = args[1];
            NSString *key = args[2];
            query = [query queryEqualToValue:value
                                    childKey:key];
        } else if ([str containsString:@"endAt"]) {
            NSArray *args = [str componentsSeparatedByString:@":"];
            NSString *value = args[1];
            NSString *key = args[2];
            query = [query queryEndingAtValue:value
                                     childKey:key];
        }
    }
    
    if (query == nil) {
        return rootRef;
    } else {
        return query.ref;
    }
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
