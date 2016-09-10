package io.fullstack.firestack;

import android.content.Context;
import android.util.Log;
import java.util.Map;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.FileNotFoundException;

import android.net.Uri;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactContext;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;

import com.google.firebase.storage.OnProgressListener;
import com.google.firebase.storage.OnPausedListener;

import com.google.firebase.FirebaseApp;

import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.UploadTask;

import com.google.firebase.storage.StorageMetadata;
import com.google.firebase.storage.StorageReference;

class FirestackStorageModule extends ReactContextBaseJavaModule {

  private static final String TAG = "FirestackStorage";

  private Context context;
  private ReactContext mReactContext;
  private FirebaseApp app;

  public FirestackStorageModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext;
    mReactContext = reactContext;

    Log.d(TAG, "New instance");
  }

  @Override
  public String getName() {
    return TAG;
  }

  @ReactMethod
  public void downloadUrl(final String storageUrl,
                          final String path,
                          final Callback callback) {
      FirebaseStorage storage = FirebaseStorage.getInstance();
      StorageReference storageRef = storage.getReferenceFromUrl(storageUrl);
    StorageReference fileRef = storageRef.child(path);

      Task<Uri> downloadTask = storageRef.getDownloadUrl();
      downloadTask.addOnSuccessListener(new OnSuccessListener<Uri>() {
        @Override
        public void onSuccess(Uri uri) {
          WritableMap res = Arguments.createMap();
          res.putString("status", "success");
          res.putString("path", uri.getPath());
          res.putString("url", uri.toString());
          callback.invoke(null, res);
        }
      }).addOnFailureListener(new OnFailureListener() {
        @Override
        public void onFailure(@NonNull Exception exception) {
          Log.e(TAG, "Failed to download file " + exception.getMessage());

          WritableMap err = Arguments.createMap();
          err.putString("status", "error");
          err.putString("description", exception.getLocalizedMessage());

          callback.invoke(err);
        }
      });
  }

  // STORAGE
  @ReactMethod
  public void uploadFile(final String urlStr, final String name, final String filepath, final ReadableMap metadata, final Callback callback) {
    FirebaseStorage storage = FirebaseStorage.getInstance();

    StorageReference storageRef = storage.getReferenceFromUrl(urlStr);
    StorageReference fileRef = storageRef.child(name);

Log.i(TAG, "From file: " + filepath + " to " + urlStr + " with name " + name);
    try {
      // InputStream stream = new FileInputStream(new File(filepath));
      Uri file = Uri.fromFile(new File(filepath));

      StorageMetadata.Builder metadataBuilder = new StorageMetadata.Builder();
      Map<String, Object> m = FirestackUtils.recursivelyDeconstructReadableMap(metadata);

      StorageMetadata md = metadataBuilder.build();
      UploadTask uploadTask = fileRef.putFile(file, md);
      // UploadTask uploadTask = fileRef.putStream(stream, md);

      // Register observers to listen for when the download is done or if it fails
      uploadTask.addOnFailureListener(new OnFailureListener() {
        @Override
        public void onFailure(@NonNull Exception exception) {
          // Handle unsuccessful uploads
          Log.e(TAG, "Failed to upload file " + exception.getMessage());

          WritableMap err = Arguments.createMap();
          err.putString("description", exception.getLocalizedMessage());

          callback.invoke(err);
        }
      }).addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
        @Override
        public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
          Log.d(TAG, "Successfully uploaded file " + taskSnapshot);
          // taskSnapshot.getMetadata() contains file metadata such as size, content-type, and download URL.
          Uri downloadUrl = taskSnapshot.getDownloadUrl();
          StorageMetadata d = taskSnapshot.getMetadata();

          WritableMap resp = Arguments.createMap();
          resp.putString("downloadUrl", downloadUrl.toString());
          resp.putString("fullPath", d.getPath());
          resp.putString("bucket", d.getBucket());
          resp.putString("name", d.getName());

          WritableMap metadataObj = Arguments.createMap();
          metadataObj.putString("cacheControl", d.getCacheControl());
          metadataObj.putString("contentDisposition", d.getContentDisposition());
          metadataObj.putString("contentType", d.getContentType());
          resp.putMap("metadata", metadataObj);
                  // NSDictionary *props = @{
                  //               @"fullPath": ref.fullPath,
                  //               @"bucket": ref.bucket,
                  //               @"name": ref.name,
                  //               @"metadata": [snapshot.metadata dictionaryRepresentation]
                  //               };

          callback.invoke(null, resp);
        }
      })
      .addOnProgressListener(new OnProgressListener<UploadTask.TaskSnapshot>() {
        @Override
        public void onProgress(UploadTask.TaskSnapshot taskSnapshot) {
          double progress = (100.0 * taskSnapshot.getBytesTransferred()) / taskSnapshot.getTotalByteCount();
          System.out.println("Upload is " + progress + "% done");

          WritableMap data = Arguments.createMap();
          data.putString("eventName", "upload_progress");
          data.putDouble("progress", progress);
          FirestackUtils.sendEvent(mReactContext, "upload_progress", data);
        }
      }).addOnPausedListener(new OnPausedListener<UploadTask.TaskSnapshot>() {
        @Override
        public void onPaused(UploadTask.TaskSnapshot taskSnapshot) {
          System.out.println("Upload is paused");
          StorageMetadata d = taskSnapshot.getMetadata();
          String bucket = d.getBucket();
          WritableMap data = Arguments.createMap();
          data.putString("eventName", "upload_paused");
          data.putString("ref", bucket);
          FirestackUtils.sendEvent(mReactContext, "upload_paused", data);
        }
      });
    }
    catch (Exception ex) {
      WritableMap err = Arguments.createMap();

      err.putString("error", "FileNotFoundException");

      callback.invoke(err);
    }
  }
}
