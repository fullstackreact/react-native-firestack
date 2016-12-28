//
//  FirestackDatabase.m
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "Firestack.h"
#import "FirestackDatabase.h"
#import "FirestackEvents.h"

@interface FirestackDBReference : NSObject
@property NSString *path;
@property NSDictionary *listeners;
@property FIRDatabaseHandle childAddedHandler;
@property FIRDatabaseHandle childModifiedHandler;
@property FIRDatabaseHandle childRemovedHandler;
@property FIRDatabaseHandle childMovedHandler;
@property FIRDatabaseHandle childValueHandler;
@end

@implementation FirestackDBReference

- (id) initWithPath:(NSString *) path
{
  self = [super init];
  if (self) {
    _path = path;
    _listeners = [[NSDictionary alloc] init];
  }
  return self;
}

- (FIRDatabaseReference *) getRef
{
    FIRDatabaseReference *rootRef = [[FIRDatabase database] reference];
    return [rootRef child:self.path];
}

- (FIRDatabaseQuery *) getQueryWithModifiers:(NSArray *) modifiers
{
    FIRDatabaseReference *rootRef = [self getRef];
    FIRDatabaseQuery *query = [rootRef queryOrderedByKey];

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
            int size = (int)[args count];;

            if (size > 2) {
              NSString *value = args[1];
              NSString *key = args[2];

              query = [query queryEqualToValue:value
                                        childKey:key];
            } else {
              NSString *value = args[1];
              query = [query queryEqualToValue:value];
            }
        } else if ([str containsString:@"endAt"]) {
            NSArray *args = [str componentsSeparatedByString:@":"];
            int size = (int)[args count];;

            if (size > 2) {
              NSString *value = args[1];
              NSString *key = args[2];

              query = [query queryEndingAtValue:value
                                         childKey:key];
            } else {
              NSString *value = args[1];
              query = [query queryEndingAtValue:value];
            }
        } else if ([str containsString:@"startAt"]) {
            NSArray *args = [str componentsSeparatedByString:@":"];
            int size = (int)[args count];;
            if (size > 2) {
              NSString *value = args[1];
              NSString *key = args[2];

              query = [query queryStartingAtValue:value
                                           childKey:key];
            } else {
              NSString *value = args[1];
              query = [query queryStartingAtValue:value];
            }
        }
    }

    return query;
}

- (void) setEventHandler:(FIRDatabaseHandle) handle
                 forName:(NSString *) name
{
    int eventType = [self eventTypeFromName:name];
    switch (eventType) {
        case FIRDataEventTypeValue:
            self.childValueHandler = handle;
            break;
        case FIRDataEventTypeChildAdded:
            self.childAddedHandler = handle;
            break;
        case FIRDataEventTypeChildChanged:
            self.childModifiedHandler = handle;
            break;
        case FIRDataEventTypeChildRemoved:
            self.childRemovedHandler = handle;
            break;
        case FIRDataEventTypeChildMoved:
            self.childMovedHandler = handle;
            break;
        default:
            break;
    }
    [self setListeningOn:name withHandle:handle];
}

- (void) removeEventHandler:(NSString *) name
{
    FIRDatabaseReference *ref = [self getRef];
    int eventType = [self eventTypeFromName:name];

    switch (eventType) {
        case FIRDataEventTypeValue:
            [ref removeObserverWithHandle:self.childValueHandler];
            break;
        case FIRDataEventTypeChildAdded:
            [ref removeObserverWithHandle:self.childAddedHandler];
            break;
        case FIRDataEventTypeChildChanged:
            [ref removeObserverWithHandle:self.childModifiedHandler];
            break;
        case FIRDataEventTypeChildRemoved:
            [ref removeObserverWithHandle:self.childRemovedHandler];
            break;
        case FIRDataEventTypeChildMoved:
            [ref removeObserverWithHandle:self.childMovedHandler];
            break;
        default:
            break;
    }
    [self unsetListeningOn:name];
}

- (void) setListeningOn:(NSString *) name
             withHandle:(FIRDatabaseHandle) handle
{
    NSMutableDictionary *listeners = [_listeners mutableCopy];
    [listeners setValue:@(handle) forKey:name];
    _listeners = listeners;
}

- (void) unsetListeningOn:(NSString *) name
{
    NSMutableDictionary *listeners = [_listeners mutableCopy];
    [listeners removeObjectForKey:name];
    _listeners = listeners;
}

- (BOOL) isListeningTo:(NSString *) name
{
  id listener = [_listeners valueForKey:name];
  return listener != nil;
}

- (BOOL) hasListeners
{
    return [[_listeners allKeys] count] > 0;
}

- (NSArray *) listenerKeys
{
    return [_listeners allKeys];
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

- (void) cleanup {
    if (self.childValueHandler > 0) {
        [self removeEventHandler:DATABASE_VALUE_EVENT];
    }
    if (self.childAddedHandler > 0) {
        [self removeEventHandler:DATABASE_CHILD_ADDED_EVENT];
    }
    if (self.childModifiedHandler > 0) {
        [self removeEventHandler:DATABASE_CHILD_MODIFIED_EVENT];
    }
    if (self.childRemovedHandler > 0) {
        [self removeEventHandler:DATABASE_CHILD_REMOVED_EVENT];
    }
    if (self.childMovedHandler > 0) {
        [self removeEventHandler:DATABASE_CHILD_MOVED_EVENT];
    }
}

@end

@implementation FirestackDatabase

RCT_EXPORT_MODULE(FirestackDatabase);

RCT_EXPORT_METHOD(enablePersistence:(BOOL) enable
  callback:(RCTResponseSenderBlock) callback)
{

  BOOL isEnabled = [FIRDatabase database].persistenceEnabled;
  if ( isEnabled != enable) {
    [FIRDatabase database].persistenceEnabled = enable;
  }
  callback(@[[NSNull null], @{
    @"result": @"success"
  }]);
}

RCT_EXPORT_METHOD(keepSynced:(NSString *) path
  withEnable:(BOOL) enable
  callback:(RCTResponseSenderBlock) callback)
{
  FIRDatabaseReference *ref = [self getRefAtPath:path];
  [ref keepSynced:enable];
  callback(@[[NSNull null], @{
                           @"result": @"success",
                           @"path": path
                           }]);
}

RCT_EXPORT_METHOD(set:(NSString *) path
                  value:(NSDictionary *)value
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [self getRefAtPath:path];

    [ref setValue:value withCompletionBlock:^(NSError * _Nullable error, FIRDatabaseReference * _Nonnull ref) {
        if (error != nil) {
            // Error handling
            NSDictionary *evt = [self getAndSendDatabaseError:error withPath: path];
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
            NSDictionary *evt = [self getAndSendDatabaseError:error withPath: path];
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
            NSDictionary *evt = [self getAndSendDatabaseError:error withPath: path];
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
                NSDictionary *evt = [self getAndSendDatabaseError:error withPath: path];
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
                  name:(NSString *) eventName
                  callback:(RCTResponseSenderBlock) callback)
{
    FirestackDBReference *r = [self getDBHandle:path];
    FIRDatabaseQuery *query = [r getQueryWithModifiers:modifiers];

    if (![r isListeningTo:eventName]) {
        id withBlock = ^(FIRDataSnapshot * _Nonnull snapshot) {
            NSDictionary *props =
            [self snapshotToDict:snapshot];
            [self
             sendJSEvent:DATABASE_DATA_EVENT
             title:eventName
             props: @{
                      @"eventName": eventName,
                      @"path": path,
                      @"snapshot": props
                      }];
        };

        id errorBlock = ^(NSError * _Nonnull error) {
            NSLog(@"Error onDBEvent: %@", [error debugDescription]);
            [self getAndSendDatabaseError:error withPath: path];
        };

        int eventType = [r eventTypeFromName:eventName];
        FIRDatabaseHandle handle = [query observeEventType:eventType
                                               withBlock:withBlock
                                         withCancelBlock:errorBlock];
        [r setEventHandler:handle
                   forName:eventName];

        // [self saveDBHandle:path dbRef:r];

        callback(@[[NSNull null], @{
                   @"result": @"success",
                   @"handle": @(handle)
                   }]);
    } else {
      callback(@[@{
                   @"result": @"exists",
                   @"msg": @"Listener already exists"
                   }]);
    }
}

RCT_EXPORT_METHOD(onOnce:(NSString *) path
                  modifiers:(NSArray *) modifiers
                  name:(NSString *) name
                  callback:(RCTResponseSenderBlock) callback)
{
    FirestackDBReference *r = [self getDBHandle:path];
    int eventType = [r eventTypeFromName:name];
    FIRDatabaseQuery *ref = [r getQueryWithModifiers:modifiers];

    [ref observeSingleEventOfType:eventType
                        withBlock:^(FIRDataSnapshot * _Nonnull snapshot) {
                            NSDictionary *props = [self snapshotToDict:snapshot];
                            callback(@[[NSNull null], @{
                                           @"eventName": name,
                                           @"path": path,
                                           @"snapshot": props
                                           }]);
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
                  eventName:(NSString *) eventName
                  callback:(RCTResponseSenderBlock) callback)
{
    FirestackDBReference *r = [self getDBHandle:path];
    if (eventName == nil || [eventName isEqualToString:@""]) {
        [r cleanup];
        [self removeDBHandle:path];
    } else {
        [r removeEventHandler:eventName];
        if (![r hasListeners]) {
            [self removeDBHandle:path];
        }
    }

    // [self saveDBHandle:path dbRef:r];

    callback(@[[NSNull null], @{
                   @"result": @"success",
                   @"path": path,
                   @"remainingListeners": [r listenerKeys],
                   }]);
}

// On disconnect
RCT_EXPORT_METHOD(onDisconnectSetObject:(NSString *) path
                  props:(NSDictionary *) props
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [self getRefAtPath:path];

    [ref onDisconnectSetValue:props
          withCompletionBlock:^(NSError * _Nullable error, FIRDatabaseReference * _Nonnull ref) {
              if (error != nil) {
                  // Error handling
                  NSDictionary *evt = [self getAndSendDatabaseError:error withPath: path];
                  callback(@[evt]);
              } else {
                  callback(@[[NSNull null], @{
                                 @"result": @"success"
                                 }]);
              }
          }];
}

RCT_EXPORT_METHOD(onDisconnectSetString:(NSString *) path
                  val:(NSString *) val
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [self getRefAtPath:path];
    [ref onDisconnectSetValue:val
          withCompletionBlock:^(NSError * _Nullable error, FIRDatabaseReference * _Nonnull ref) {
              if (error != nil) {
                  // Error handling
                  NSDictionary *evt = [self getAndSendDatabaseError:error withPath: path];
                  callback(@[evt]);
              } else {
                  callback(@[[NSNull null], @{
                                 @"result": @"success"
                                 }]);
              }
          }];
}

RCT_EXPORT_METHOD(onDisconnectRemove:(NSString *) path
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [self getRefAtPath:path];
    [ref onDisconnectRemoveValueWithCompletionBlock:^(NSError * _Nullable error, FIRDatabaseReference * _Nonnull ref) {
        if (error != nil) {
            // Error handling
            NSDictionary *evt = [self getAndSendDatabaseError:error withPath: path];
            callback(@[evt]);
        } else {
            callback(@[[NSNull null], @{
                           @"result": @"success"
                           }]);
        }
    }];
}



RCT_EXPORT_METHOD(onDisconnectCancel:(NSString *) path
                  callback:(RCTResponseSenderBlock) callback)
{
    FIRDatabaseReference *ref = [self getRefAtPath:path];
    [ref cancelDisconnectOperationsWithCompletionBlock:^(NSError * _Nullable error, FIRDatabaseReference * _Nonnull ref) {
        if (error != nil) {
            // Error handling
            NSDictionary *evt = [self getAndSendDatabaseError:error withPath: path];
            callback(@[evt]);
        } else {
            callback(@[[NSNull null], @{
                           @"result": @"success"
                           }]);
        }
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
    FirestackDBReference *r = [self getDBHandle:str];
    return [r getRef];
}

// Handles
- (NSDictionary *) storedDBHandles
{
    if (__DBHandles == nil) {
        __DBHandles = [[NSDictionary alloc] init];
    }
    return __DBHandles;
}

- (FirestackDBReference *) getDBHandle:(NSString *) path
{
    NSDictionary *stored = [self storedDBHandles];
    FirestackDBReference *r = [stored objectForKey:path];

    if (r == nil) {
        r = [[FirestackDBReference alloc] initWithPath:path];
        [self saveDBHandle:path dbRef:r];
    }
    return r;
}

- (void) saveDBHandle:(NSString *) path
                dbRef:(FirestackDBReference *) dbRef
{
    NSMutableDictionary *stored = [[self storedDBHandles] mutableCopy];
    if ([stored objectForKey:path]) {
        FirestackDBReference *r = [stored objectForKey:path];
        [r cleanup];
    }

    [stored setObject:dbRef forKey:path];
    self._DBHandles = stored;
}

- (void) removeDBHandle:(NSString *) path
{
    NSMutableDictionary *stored = [[self storedDBHandles] mutableCopy];

    FirestackDBReference *r = [stored objectForKey:path];
    if (r != nil) {
        [r cleanup];
    }
    [stored removeObjectForKey:path];
    self._DBHandles = [stored copy];
}

- (NSDictionary *) snapshotToDict:(FIRDataSnapshot *) snapshot
{
    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
    [dict setValue:snapshot.key forKey:@"key"];
    NSDictionary *val = snapshot.value;
    [dict setObject:val forKey:@"value"];

    // Snapshot ordering
    NSMutableArray *childKeys = [NSMutableArray array];
    if (snapshot.childrenCount > 0) {
        // Since JS does not respect object ordering of keys
        // we keep a list of the keys and their ordering
        // in the snapshot event
        NSEnumerator *children = [snapshot children];
        FIRDataSnapshot *child;
        while(child = [children nextObject]) {
            [childKeys addObject:child.key];
        }
    }

    [dict setObject:childKeys forKey:@"childKeys"];
    [dict setValue:@(snapshot.hasChildren) forKey:@"hasChildren"];
    [dict setValue:@(snapshot.exists) forKey:@"exists"];
    [dict setValue:@(snapshot.childrenCount) forKey:@"childrenCount"];
    [dict setValue:snapshot.priority forKey:@"priority"];

    return dict;
}

- (NSDictionary *) getAndSendDatabaseError:(NSError *) error
                                  withPath:(NSString *) path
{
    NSDictionary *evt = @{
                          @"eventName": DATABASE_ERROR_EVENT,
                          @"path": path,
                          @"msg": [error debugDescription]
                          };
    [self
     sendJSEvent:DATABASE_ERROR_EVENT
     title:DATABASE_ERROR_EVENT
     props: evt];

    return evt;
}

// Not sure how to get away from this... yet
- (NSArray<NSString *> *)supportedEvents {
    return @[DATABASE_DATA_EVENT, DATABASE_ERROR_EVENT];
}

- (void) sendJSEvent:(NSString *)type
               title:(NSString *)title
               props:(NSDictionary *)props
{
    @try {
        [self sendEventWithName:type
                           body:@{
                            @"eventName": title,
                            @"body": props
                        }];
    }
    @catch (NSException *err) {
        NSLog(@"An error occurred in sendJSEvent: %@", [err debugDescription]);
        NSLog(@"Tried to send: %@ with %@", title, props);
    }
}

@end