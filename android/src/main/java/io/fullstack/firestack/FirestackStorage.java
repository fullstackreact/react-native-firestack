package io.fullstack.firestack;

import android.os.Environment;
import android.os.StatFs;
import android.content.Context;
import android.util.Log;
import java.util.Map;
import java.util.HashMap;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.FileNotFoundException;

import android.net.Uri;
import android.provider.MediaStore;
import android.database.Cursor;
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

class FirestackStorage extends ReactContextBaseJavaModule {

  private static final String TAG = "FirestackStorage";
  private static final String DocumentDirectoryPath = "DOCUMENT_DIRECTORY_PATH";
  private static final String ExternalDirectoryPath = "EXTERNAL_DIRECTORY_PATH";
  private static final String ExternalStorageDirectoryPath = "EXTERNAL_STORAGE_DIRECTORY_PATH";
  private static final String PicturesDirectoryPath = "PICTURES_DIRECTORY_PATH";
  private static final String TemporaryDirectoryPath = "TEMPORARY_DIRECTORY_PATH";
  private static final String CachesDirectoryPath = "CACHES_DIRECTORY_PATH";
  private static final String DocumentDirectory = "DOCUMENT_DIRECTORY_PATH";
  private static final String BundlePath = "MAIN_BUNDLE_PATH";

  private static final String FileTypeRegular = "FILETYPE_REGULAR";
  private static final String FileTypeDirectory = "FILETYPE_DIRECTORY";


  private Context context;
  private ReactContext mReactContext;
  private FirebaseApp app;

  public FirestackStorage(ReactApplicationContext reactContext) {
    super(reactContext);

    Log.d(TAG, "Attaching FirestackStorage");
    this.context = reactContext;
    mReactContext = reactContext;

    Log.d(TAG, "New instance");
  }

  @Override
  public String getName() {
    return TAG;
  }

  @ReactMethod
  public void downloadUrl(final String javascriptStorageBucket,
                          final String path,
                          final Callback callback) {
      FirebaseStorage storage = FirebaseStorage.getInstance();
      String storageBucket = storage.getApp().getOptions().getStorageBucket();
      String storageUrl = "gs://"+storageBucket;
      Log.d(TAG, "Storage url " + storageUrl + path);
      final StorageReference storageRef = storage.getReferenceFromUrl(storageUrl);
      final StorageReference fileRef = storageRef.child(path);

      Task<Uri> downloadTask = fileRef.getDownloadUrl();
      downloadTask.addOnSuccessListener(new OnSuccessListener<Uri>() {
        @Override
        public void onSuccess(Uri uri) {
          final WritableMap res = Arguments.createMap();

          res.putString("status", "success");
          res.putString("bucket", storageRef.getBucket());
          res.putString("fullPath", uri.toString());
          res.putString("path", uri.getPath());
          res.putString("url", uri.toString());

          fileRef.getMetadata()
          .addOnSuccessListener(new OnSuccessListener<StorageMetadata>() {
              @Override
              public void onSuccess(final StorageMetadata storageMetadata) {
                Log.d(TAG, "getMetadata success " + storageMetadata);
                res.putString("name", storageMetadata.getName());

                WritableMap metadata = Arguments.createMap();
                metadata.putString("getBucket", storageMetadata.getBucket());
                metadata.putString("getName", storageMetadata.getName());
                metadata.putDouble("sizeBytes", storageMetadata.getSizeBytes());
                metadata.putDouble("created_at", storageMetadata.getCreationTimeMillis());
                metadata.putDouble("updated_at", storageMetadata.getUpdatedTimeMillis());
                metadata.putString("md5hash", storageMetadata.getMd5Hash());
                metadata.putString("encoding", storageMetadata.getContentEncoding());
                res.putString("url", storageMetadata.getDownloadUrl().toString());

                res.putMap("metadata", metadata);
                callback.invoke(null, res);
              }
          }).addOnFailureListener(new OnFailureListener() {
              @Override
              public void onFailure(@NonNull Exception exception) {
                Log.e(TAG, "Failure in download " + exception);
                  callback.invoke(makeErrorPayload(1, exception));
              }
          });

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

    StorageReference storageRef = urlStr!=null ? storage.getReferenceFromUrl(urlStr) : storage.getReference();
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
          WritableMap resp = getDownloadData(taskSnapshot);
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
          double totalBytes = taskSnapshot.getTotalByteCount();
          double bytesTransferred = taskSnapshot.getBytesTransferred();
          double progress = (100.0 * bytesTransferred) / totalBytes;

          System.out.println("Transferred " + bytesTransferred + "/" + totalBytes + "("+progress + "% complete)");

          if (progress >= 0) {
            WritableMap data = Arguments.createMap();
            data.putString("eventName", "upload_progress");
            data.putDouble("progress", progress);
            FirestackUtils.sendEvent(mReactContext, "upload_progress", data);
          }
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
      callback.invoke(makeErrorPayload(2, ex));
    }
  }

  @ReactMethod
  public void getRealPathFromURI(final String uri, final Callback callback) {
    try {
      Context context = getReactApplicationContext();
      String [] proj = {MediaStore.Images.Media.DATA};
      Cursor cursor = context.getContentResolver().query(Uri.parse(uri), proj,  null, null, null);
      int column_index = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
      cursor.moveToFirst();
      String path = cursor.getString(column_index); 
      cursor.close();
  
      callback.invoke(null, path);
    } catch (Exception ex) {
      ex.printStackTrace();
      callback.invoke(makeErrorPayload(1, ex));
    }
  }

  private WritableMap getDownloadData(final UploadTask.TaskSnapshot taskSnapshot) {
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

    return resp;
  }

  private WritableMap makeErrorPayload(double code, Exception ex) {
    WritableMap error = Arguments.createMap();
    error.putDouble("code", code);
    error.putString("message", ex.getMessage());
    return error;
  }

  // Comes almost directory from react-native-fs
  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();

    constants.put(DocumentDirectory, 0);
    constants.put(DocumentDirectoryPath, this.getReactApplicationContext().getFilesDir().getAbsolutePath());
    constants.put(TemporaryDirectoryPath, null);
    constants.put(PicturesDirectoryPath, Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES).getAbsolutePath());
    constants.put(CachesDirectoryPath, this.getReactApplicationContext().getCacheDir().getAbsolutePath());
    constants.put(FileTypeRegular, 0);
    constants.put(FileTypeDirectory, 1);
    constants.put(BundlePath, null);

    File externalStorageDirectory = Environment.getExternalStorageDirectory();
    if (externalStorageDirectory != null) {
        constants.put(ExternalStorageDirectoryPath, externalStorageDirectory.getAbsolutePath());
    } else {
        constants.put(ExternalStorageDirectoryPath, null);
    }

    File externalDirectory = this.getReactApplicationContext().getExternalFilesDir(null);
    if (externalDirectory != null) {
      constants.put(ExternalDirectoryPath, externalDirectory.getAbsolutePath());
    } else {
      constants.put(ExternalDirectoryPath, null);
    }

    return constants;
  }
}
