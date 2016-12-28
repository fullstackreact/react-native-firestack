//
//  FirestackEvents.h
//  Firestack
//
//  Created by Ari Lerner on 8/23/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#ifndef FirestackEvents_h
#define FirestackEvents_h

#import <Foundation/Foundation.h>

#define SYSTEM_VERSION_EQUAL_TO(v)                  ([[[UIDevice currentDevice] systemVersion] compare:v options:NSNumericSearch] == NSOrderedSame)
#define SYSTEM_VERSION_GREATER_THAN(v)              ([[[UIDevice currentDevice] systemVersion] compare:v options:NSNumericSearch] == NSOrderedDescending)
#define SYSTEM_VERSION_GREATER_THAN_OR_EQUAL_TO(v)  ([[[UIDevice currentDevice] systemVersion] compare:v options:NSNumericSearch] != NSOrderedAscending)
#define SYSTEM_VERSION_LESS_THAN(v)                 ([[[UIDevice currentDevice] systemVersion] compare:v options:NSNumericSearch] == NSOrderedAscending)
#define SYSTEM_VERSION_LESS_THAN_OR_EQUAL_TO(v)     ([[[UIDevice currentDevice] systemVersion] compare:v options:NSNumericSearch] != NSOrderedDescending)
#define FIRESTACK_QUEUE_NAME                        "io.fullstack.firestack.WorkerQueue"

static NSString *const kFirestackInitialized = @"FirestackInitializedEvent";
static NSString *const INITIALIZED_EVENT = @"firestackInitialized";

static NSString *const AUTH_CHANGED_EVENT = @"listenForAuth";
static NSString *const AUTH_ERROR_EVENT = @"authError";
static NSString *const AUTH_ANONYMOUS_ERROR_EVENT = @"authAnonymousError";
static NSString *const DEBUG_EVENT = @"debug";

// Database
static NSString *const DATABASE_DATA_EVENT = @"database_event";
static NSString *const DATABASE_ERROR_EVENT = @"database_error";

static NSString *const DATABASE_VALUE_EVENT = @"value";
static NSString *const DATABASE_CHILD_ADDED_EVENT = @"child_added";
static NSString *const DATABASE_CHILD_MODIFIED_EVENT = @"child_changed";
static NSString *const DATABASE_CHILD_REMOVED_EVENT = @"child_removed";
static NSString *const DATABASE_CHILD_MOVED_EVENT = @"child_moved";

// Storage
static NSString *const STORAGE_UPLOAD_PROGRESS = @"upload_progress";
static NSString *const STORAGE_UPLOAD_PAUSED = @"upload_paused";
static NSString *const STORAGE_UPLOAD_RESUMED = @"upload_resumed";
static NSString *const STORAGE_DOWNLOAD_PROGRESS = @"download_progress";
static NSString *const STORAGE_DOWNLOAD_PAUSED = @"download_paused";
static NSString *const STORAGE_DOWNLOAD_RESUMED = @"download_resumed";

// Messaging
static NSString *const MESSAGING_SUBSYSTEM_EVENT = @"messaging_event";
static NSString *const MESSAGING_SUBSYSTEM_ERROR = @"messaging_error";
static NSString *const MESSAGING_TOKEN_REFRESH = @"messaging_token_refresh";

static NSString *const MESSAGING_MESSAGE_RECEIVED_REMOTE = @"messaging_remote_event_received";
static NSString *const MESSAGING_MESSAGE_RECEIVED_LOCAL = @"messaging_local_event_received";

#endif
