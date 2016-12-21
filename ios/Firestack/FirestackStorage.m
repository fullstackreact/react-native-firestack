//
//  FirestackStorage.m
//  Firestack
//
//  Created by Ari Lerner on 8/24/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "FirestackStorage.h"
#import "FirestackEvents.h"

#import <Photos/Photos.h>

@implementation FirestackStorage

RCT_EXPORT_MODULE(FirestackStorage);

// Run on a different thread
- (dispatch_queue_t)methodQueue
{
  return dispatch_queue_create("io.fullstack.firestack.storage", DISPATCH_QUEUE_SERIAL);
}

RCT_EXPORT_METHOD(downloadUrl: (NSString *) storageUrl
                  path:(NSString *) path
    callback:(RCTResponseSenderBlock) callback)
{
    FIRStorageReference *storageRef;
    if (storageUrl == nil ) {
        storageRef = [[FIRStorage storage] reference];
    } else {
        storageRef = [[FIRStorage storage] referenceForURL:storageUrl];
    }
    FIRStorageReference *fileRef = [storageRef child:path];
    [fileRef downloadURLWithCompletion:^(NSURL * _Nullable URL, NSError * _Nullable error) {
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
                                   @"url": [URL absoluteString],
                                   @"path": [URL path]
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
    FIRStorageReference *storageRef;
    if (urlStr == nil) {
        storageRef = [[FIRStorage storage] reference];
    } else {
        storageRef = [[FIRStorage storage] referenceForURL:urlStr];
    }

    FIRStorageReference *uploadRef = [storageRef child:name];
    FIRStorageMetadata *firmetadata = [[FIRStorageMetadata alloc] initWithDictionary:metadata];

    if ([path hasPrefix:@"assets-library://"]) {
        NSURL *localFile = [[NSURL alloc] initWithString:path];
        PHFetchResult* assets = [PHAsset fetchAssetsWithALAssetURLs:@[localFile] options:nil];
        PHAsset *asset = [assets firstObject];

        [[PHImageManager defaultManager] requestImageDataForAsset:asset
                                                    options:nil
                                                    resultHandler:^(NSData * imageData, NSString * dataUTI, UIImageOrientation orientation, NSDictionary * info) {
                                                        FIRStorageUploadTask *uploadTask = [uploadRef putData:imageData
                                                                                                     metadata:firmetadata];
                                                        [self addUploadObservers:uploadTask
                                                                        callback:callback];
                                                    }];
    } else {
        NSURL *imageFile = [NSURL fileURLWithPath:path];
        FIRStorageUploadTask *uploadTask = [uploadRef putFile:imageFile
                                                     metadata:firmetadata];
        
        [self addUploadObservers:uploadTask
                        callback:callback];
    }

}

- (void) addUploadObservers:(FIRStorageUploadTask *) uploadTask
                   callback:(RCTResponseSenderBlock) callback
{
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
        float percentComplete;
        if (snapshot.progress.totalUnitCount == 0) {
            percentComplete = 0.0;
        } else {
            percentComplete = 100.0 * (snapshot.progress.completedUnitCount) / (snapshot.progress.totalUnitCount);
        }

        [self sendJSEvent:STORAGE_UPLOAD_PROGRESS props:@{
                                                          @"eventName": STORAGE_UPLOAD_PROGRESS,
                                                          @"progress": @(percentComplete)
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
                                @"downloadUrl": snapshot.metadata.downloadURLs[0].absoluteString,
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
                    NSLog(@"Unknown error: %@", snapshot.error);
                    break;
            }

            callback(@[errProps]);
        }}];
}

RCT_EXPORT_METHOD(downloadFile: (NSString *) urlStr
                  path:(NSString *) path
                  localFile:(NSString *) file
                  callback:(RCTResponseSenderBlock) callback)
{
    if (urlStr == nil) {
        NSError *err = [[NSError alloc] init];
        [err setValue:@"Storage configuration error" forKey:@"name"];
        [err setValue:@"Call setStorageUrl() first" forKey:@"description"];
        return callback(@[err]);
    }

    FIRStorageReference *storageRef = [[FIRStorage storage] referenceForURL:urlStr];
    FIRStorageReference *fileRef = [storageRef child:path];

    NSURL *localFile = [NSURL fileURLWithPath:file];

    FIRStorageDownloadTask *downloadTask = [fileRef writeToFile:localFile];
    // Listen for state changes, errors, and completion of the download.
    [downloadTask observeStatus:FIRStorageTaskStatusResume handler:^(FIRStorageTaskSnapshot *snapshot) {
        // Upload resumed, also fires when the upload starts
        [self sendJSEvent:STORAGE_DOWNLOAD_RESUMED props:@{
                                                         @"eventName": STORAGE_DOWNLOAD_RESUMED,
                                                         @"ref": snapshot.reference.bucket
                                                         }];
    }];

    [downloadTask observeStatus:FIRStorageTaskStatusPause handler:^(FIRStorageTaskSnapshot *snapshot) {
        // Upload paused
        [self sendJSEvent:STORAGE_DOWNLOAD_PAUSED props:@{
                                                        @"eventName": STORAGE_DOWNLOAD_PAUSED,
                                                        @"ref": snapshot.reference.bucket
                                                        }];
    }];
    [downloadTask observeStatus:FIRStorageTaskStatusProgress handler:^(FIRStorageTaskSnapshot *snapshot) {
        // Upload reported progress
        float percentComplete;
        if (snapshot.progress.totalUnitCount == 0) {
            percentComplete = 0.0;
        } else {
            percentComplete = 100.0 * (snapshot.progress.completedUnitCount) / (snapshot.progress.totalUnitCount);
        }

        [self sendJSEvent:STORAGE_DOWNLOAD_PROGRESS props:@{
                                                          @"eventName": STORAGE_DOWNLOAD_PROGRESS,
                                                          @"progress": @(percentComplete)
                                                          }];

    }];

    [downloadTask observeStatus:FIRStorageTaskStatusSuccess handler:^(FIRStorageTaskSnapshot *snapshot) {
        [downloadTask removeAllObservers];

        // Upload completed successfully
        FIRStorageReference *ref = snapshot.reference;
        NSDictionary *props = @{
                                @"fullPath": ref.fullPath,
                                @"bucket": ref.bucket,
                                @"name": ref.name
                                };

        callback(@[[NSNull null], props]);
    }];

    [downloadTask observeStatus:FIRStorageTaskStatusFailure handler:^(FIRStorageTaskSnapshot *snapshot) {
        if (snapshot.error != nil) {
            NSDictionary *errProps = [[NSMutableDictionary alloc] init];
            NSLog(@"Error in download: %@", snapshot.error);

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
                    [errProps setValue:@"Download canceled" forKey:@"description"];
                    break;
                case FIRStorageErrorCodeUnknown:
                    // Unknown error occurred, inspect the server response
                    [errProps setValue:@"Unknown error" forKey:@"description"];
                    break;
            }

            callback(@[errProps]);
        }}];
}

// Compatibility with the android library
// For now, just passes the url path back
RCT_EXPORT_METHOD(getRealPathFromURI: (NSString *) urlStr
                  callback:(RCTResponseSenderBlock) callback)
{
    callback(@[[NSNull null], urlStr]);
}

// This is just too good not to use, but I don't want to take credit for
// this work from RNFS
// https://github.com/johanneslumpe/react-native-fs/blob/master/RNFSManager.m
- (NSString *)getPathForDirectory:(int)directory
{
  NSArray *paths = NSSearchPathForDirectoriesInDomains(directory, NSUserDomainMask, YES);
  return [paths firstObject];
}

- (NSDictionary *)constantsToExport
{
  return @{
           @"MAIN_BUNDLE_PATH": [[NSBundle mainBundle] bundlePath],
           @"CACHES_DIRECTORY_PATH": [self getPathForDirectory:NSCachesDirectory],
           @"DOCUMENT_DIRECTORY_PATH": [self getPathForDirectory:NSDocumentDirectory],
           @"EXTERNAL_DIRECTORY_PATH": [NSNull null],
           @"EXTERNAL_STORAGE_DIRECTORY_PATH": [NSNull null],
           @"TEMP_DIRECTORY_PATH": NSTemporaryDirectory(),
           @"LIBRARY_DIRECTORY_PATH": [self getPathForDirectory:NSLibraryDirectory],
           @"FILETYPE_REGULAR": NSFileTypeRegular,
           @"FILETYPE_DIRECTORY": NSFileTypeDirectory
           };
}

// Not sure how to get away from this... yet
- (NSArray<NSString *> *)supportedEvents {
    return @[
             STORAGE_UPLOAD_PAUSED,
             STORAGE_UPLOAD_RESUMED,
             STORAGE_UPLOAD_PROGRESS,
             STORAGE_DOWNLOAD_PAUSED,
             STORAGE_DOWNLOAD_RESUMED,
             STORAGE_DOWNLOAD_PROGRESS
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
