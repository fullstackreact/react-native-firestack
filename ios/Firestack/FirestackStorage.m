//
//  FirestackStorage.m
//  Firestack
//
//  Created by Ari Lerner on 8/24/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "FirestackStorage.h"
#import "FirestackEvents.h"

@import FirebaseStorage;

@implementation FirestackStorage

RCT_EXPORT_MODULE(FirestackStorage);

RCT_EXPORT_METHOD(downloadUrl: (NSString *) path
    callback:(RCTResponseSenderBlock) callback)
{
    FIRStorageReference *storageRef = [[FIRStorage storage] referenceWithPath:path];
    [storageRef downloadURLWithCompletion:^(NSURL * _Nullable URL, NSError * _Nullable error) {
        if (error != nil) {
            NSDictionary *evt = @{
                                  @"status": @"error",
                                  @"path": path,
                                  @"msg": [error debugDescription]
                                  };
            callback(@[evt]);
        } else {
            NSDictionary *resp = @{
                                   @"status": @"success",
                                   @"path": path,
                                   @"url": URL
                                   };
            callback(@[[NSNull null], resp]);
        }
    }];
}

RCT_EXPORT_METHOD(uploadFile: (NSString *) urlStr
                  name: (NSString *) name
                  path:(NSString *)path
                  metadata:(NSDictionary *)metadata
                  callback:(RCTResponseSenderBlock) callback)
{
    if (urlStr == nil) {
        NSError *err = [[NSError alloc] init];
        [err setValue:@"Storage configuration error" forKey:@"name"];
        [err setValue:@"Call setStorageUrl() first" forKey:@"description"];
        return callback(@[err]);
    }
    
    FIRStorageReference *storageRef = [[FIRStorage storage] referenceForURL:urlStr];
    FIRStorageReference *uploadRef = [storageRef child:name];
    
    NSURL *localFile = [NSURL fileURLWithPath:path];
    
    FIRStorageMetadata *firmetadata = [[FIRStorageMetadata alloc] initWithDictionary:metadata];
    
    FIRStorageUploadTask *uploadTask = [uploadRef putFile:localFile
                                                 metadata:firmetadata];
    // Listen for state changes, errors, and completion of the upload.
    [uploadTask observeStatus:FIRStorageTaskStatusResume handler:^(FIRStorageTaskSnapshot *snapshot) {
        // Upload resumed, also fires when the upload starts
        [self sendJSEvent:STORAGE_UPLOAD_RESUMED props:@{
                                                         @"eventName": STORAGE_UPLOAD_RESUMED,
                                                         @"ref": snapshot.reference.bucket
                                                         }];
    }];
    
    [uploadTask observeStatus:FIRStorageTaskStatusPause handler:^(FIRStorageTaskSnapshot *snapshot) {
        // Upload paused
        [self sendJSEvent:STORAGE_UPLOAD_PAUSED props:@{
                                                        @"eventName": STORAGE_UPLOAD_PAUSED,
                                                        @"ref": snapshot.reference.bucket
                                                        }];
    }];
    [uploadTask observeStatus:FIRStorageTaskStatusProgress handler:^(FIRStorageTaskSnapshot *snapshot) {
        // Upload reported progress
        double percentComplete = 100.0 * (snapshot.progress.completedUnitCount) / (snapshot.progress.totalUnitCount);
        
        [self sendJSEvent:STORAGE_UPLOAD_PROGRESS props:@{
                                                          @"eventName": STORAGE_UPLOAD_PROGRESS,
                                                          @"progress": @(percentComplete || 0.0)
                                                          }];
        
    }];
    
    [uploadTask observeStatus:FIRStorageTaskStatusSuccess handler:^(FIRStorageTaskSnapshot *snapshot) {
        [uploadTask removeAllObservers];
        
        // Upload completed successfully
        FIRStorageReference *ref = snapshot.reference;
        NSDictionary *props = @{
                                @"fullPath": ref.fullPath,
                                @"bucket": ref.bucket,
                                @"name": ref.name,
                                @"metadata": [snapshot.metadata dictionaryRepresentation]
                                };
        
        callback(@[[NSNull null], props]);
    }];
    
    [uploadTask observeStatus:FIRStorageTaskStatusFailure handler:^(FIRStorageTaskSnapshot *snapshot) {
        if (snapshot.error != nil) {
            NSDictionary *errProps = [[NSMutableDictionary alloc] init];
            
            switch (snapshot.error.code) {
                case FIRStorageErrorCodeObjectNotFound:
                    // File doesn't exist
                    [errProps setValue:@"File does not exist" forKey:@"description"];
                    break;
                case FIRStorageErrorCodeUnauthorized:
                    // User doesn't have permission to access file
                    [errProps setValue:@"You do not have permissions" forKey:@"description"];
                    break;
                case FIRStorageErrorCodeCancelled:
                    // User canceled the upload
                    [errProps setValue:@"Upload cancelled" forKey:@"description"];
                    break;
                case FIRStorageErrorCodeUnknown:
                    // Unknown error occurred, inspect the server response
                    [errProps setValue:@"Unknown error" forKey:@"description"];
                    break;
            }
            
            callback(@[errProps]);
        }}];
}

// Not sure how to get away from this... yet
- (NSArray<NSString *> *)supportedEvents {
    return @[
             STORAGE_UPLOAD_PAUSED,
             STORAGE_UPLOAD_RESUMED,
             STORAGE_UPLOAD_PROGRESS
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
