package io.fullstack.firestack;

import android.util.Log;
import android.os.Environment;
import android.content.Context;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.HashMap;

import android.net.Uri;
import android.database.Cursor;
import android.provider.MediaStore;
import android.support.annotation.NonNull;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import com.google.android.gms.tasks.Task;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;

import com.google.firebase.storage.StorageException;
import com.google.firebase.storage.StreamDownloadTask;
import com.google.firebase.storage.UploadTask;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageMetadata;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.OnPausedListener;
import com.google.firebase.storage.OnProgressListener;


@SuppressWarnings("WeakerAccess")
class FirestackStorageModule extends ReactContextBaseJavaModule {

  private static final String TAG = "FirestackStorage";
  private static final String DocumentDirectoryPath = "DOCUMENT_DIRECTORY_PATH";
  private static final String ExternalDirectoryPath = "EXTERNAL_DIRECTORY_PATH";
  private static final String ExternalStorageDirectoryPath = "EXTERNAL_STORAGE_DIRECTORY_PATH";
  private static final String PicturesDirectoryPath = "PICTURES_DIRECTORY_PATH";
  private static final String TemporaryDirectoryPath = "TEMPORARY_DIRECTORY_PATH";
  private static final String CachesDirectoryPath = "CACHES_DIRECTORY_PATH";
  private static final String DocumentDirectory = "DOCUMENT_DIRECTORY_PATH";

  private static final String FileTypeRegular = "FILETYPE_REGULAR";
  private static final String FileTypeDirectory = "FILETYPE_DIRECTORY";

  private static final String STORAGE_UPLOAD_PROGRESS = "upload_progress";
  private static final String STORAGE_UPLOAD_PAUSED = "upload_paused";
  private static final String STORAGE_UPLOAD_RESUMED = "upload_resumed";

  private static final String STORAGE_DOWNLOAD_PROGRESS = "download_progress";
  private static final String STORAGE_DOWNLOAD_PAUSED = "download_paused";
  private static final String STORAGE_DOWNLOAD_RESUMED = "download_resumed";
  private static final String STORAGE_DOWNLOAD_SUCCESS = "download_success";
  private static final String STORAGE_DOWNLOAD_FAILURE = "download_failure";

  private ReactContext mReactContext;

  public FirestackStorageModule(ReactApplicationContext reactContext) {
    super(reactContext);

    Log.d(TAG, "New instance");
  }

  @Override
  public String getName() {
    return TAG;
  }


  public boolean isExternalStorageWritable() {
    String state = Environment.getExternalStorageState();
    if (Environment.MEDIA_MOUNTED.equals(state)) {
      return true;
    }
    return false;
  }

  @ReactMethod
  public void downloadFile(final String urlStr,
                          final String fbPath,
                           final String localFile,
                          final Callback callback) {
    Log.d(TAG, "downloadFile: "+urlStr+", "+localFile);
    if (!isExternalStorageWritable()) {
      Log.w(TAG, "downloadFile failed: external storage not writable");
      WritableMap error = Arguments.createMap();
      final int errorCode = 1;
      error.putDouble("code", errorCode);
      error.putString("description", "downloadFile failed: external storage not writable");
      callback.invoke(error);
      return;
    }
    FirebaseStorage storage = FirebaseStorage.getInstance();
    String storageBucket = storage.getApp().getOptions().getStorageBucket();
    String storageUrl = "gs://" + storageBucket;
    Log.d(TAG, "Storage url " + storageUrl + fbPath);

    StorageReference storageRef = storage.getReferenceFromUrl(storageUrl);
    StorageReference fileRef = storageRef.child(fbPath);

    fileRef.getStream(new StreamDownloadTask.StreamProcessor() {
      @Override
      public void doInBackground(StreamDownloadTask.TaskSnapshot taskSnapshot, InputStream inputStream) throws IOException {
        int indexOfLastSlash = localFile.lastIndexOf("/");
        String pathMinusFileName = indexOfLastSlash>0 ? localFile.substring(0, indexOfLastSlash) + "/" : "/";
        String filename = indexOfLastSlash>0 ? localFile.substring(indexOfLastSlash+1) : localFile;
        File fileWithJustPath = new File(pathMinusFileName);
        if (!fileWithJustPath.mkdirs()) {
          Log.e(TAG, "Directory not created");
          WritableMap error = Arguments.createMap();
          error.putString("message", "Directory not created");
          callback.invoke(error);
          return;
        }
        File fileWithFullPath = new File(pathMinusFileName, filename);
        FileOutputStream output = new FileOutputStream(fileWithFullPath);
        int bufferSize = 1024;
        byte[] buffer = new byte[bufferSize];
        int len = 0;
        while ((len = inputStream.read(buffer)) != -1) {
          output.write(buffer, 0, len);
        }
        output.close();
      }
    }).addOnProgressListener(new OnProgressListener<StreamDownloadTask.TaskSnapshot>() {
      @Override
      public void onProgress(StreamDownloadTask.TaskSnapshot taskSnapshot) {
        WritableMap data = Arguments.createMap();
        data.putString("ref", taskSnapshot.getStorage().getBucket());
        double percentComplete = taskSnapshot.getTotalByteCount() == 0 ? 0.0f : 100.0f * (taskSnapshot.getBytesTransferred()) / (taskSnapshot.getTotalByteCount());
        data.putDouble("progress", percentComplete);
        FirestackUtils.sendEvent(mReactContext, STORAGE_DOWNLOAD_PROGRESS, data);
      }
    }).addOnPausedListener(new OnPausedListener<StreamDownloadTask.TaskSnapshot>() {
      @Override
      public void onPaused(StreamDownloadTask.TaskSnapshot taskSnapshot) {
        WritableMap data = Arguments.createMap();
        data.putString("ref", taskSnapshot.getStorage().getBucket());
        FirestackUtils.sendEvent(mReactContext, STORAGE_DOWNLOAD_PAUSED, data);
      }
    }).addOnSuccessListener(new OnSuccessListener<StreamDownloadTask.TaskSnapshot>() {
      @Override
      public void onSuccess(StreamDownloadTask.TaskSnapshot taskSnapshot) {
        final WritableMap data = Arguments.createMap();
        StorageReference ref = taskSnapshot.getStorage();
        data.putString("fullPath", ref.getPath());
        data.putString("bucket", ref.getBucket());
        data.putString("name", ref.getName());
        ref.getMetadata().addOnSuccessListener(new OnSuccessListener<StorageMetadata>() {
          @Override
          public void onSuccess(final StorageMetadata storageMetadata) {
            data.putMap("metadata", getMetadataAsMap(storageMetadata));
            callback.invoke(null, data);
          }
        })
        .addOnFailureListener(new OnFailureListener() {
          @Override
          public void onFailure(@NonNull Exception exception) {
            final int errorCode = 1;
            WritableMap data = Arguments.createMap();
            StorageException storageException = StorageException.fromException(exception);
            data.putString("description", storageException.getMessage());
            data.putInt("code", errorCode);
            callback.invoke(makeErrorPayload(errorCode, exception));
          }
        });
      }
    }).addOnFailureListener(new OnFailureListener() {
      @Override
      public void onFailure(@NonNull Exception exception) {
        final int errorCode = 1;
        WritableMap data = Arguments.createMap();
        StorageException storageException = StorageException.fromException(exception);
        data.putString("description", storageException.getMessage());
        data.putInt("code", errorCode);
        callback.invoke(makeErrorPayload(errorCode, exception));
      }
    });
  }

  @ReactMethod
  public void downloadUrl(final String javascriptStorageBucket,
                          final String path,
                          final Callback callback) {
    FirebaseStorage storage = FirebaseStorage.getInstance();
    String storageBucket = storage.getApp().getOptions().getStorageBucket();
    String storageUrl = "gs://" + storageBucket;
    Log.d(TAG, "Storage url " + storageUrl + path);
    final StorageReference storageRef = storage.getReferenceFromUrl(storageUrl);
    final StorageReference fileRef = storageRef.child(path);

    Task<Uri> downloadTask = fileRef.getDownloadUrl();
    downloadTask
        .addOnSuccessListener(new OnSuccessListener<Uri>() {
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

                    res.putMap("metadata", getMetadataAsMap(storageMetadata));
                    res.putString("name", storageMetadata.getName());
                    res.putString("url", storageMetadata.getDownloadUrl().toString());
                    callback.invoke(null, res);
                  }
                })
                .addOnFailureListener(new OnFailureListener() {
                  @Override
                  public void onFailure(@NonNull Exception exception) {
                    Log.e(TAG, "Failure in download " + exception);
                    final int errorCode = 1;
                    callback.invoke(makeErrorPayload(errorCode, exception));
                  }
                });

          }
        })
        .addOnFailureListener(new OnFailureListener() {
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

  private WritableMap getMetadataAsMap(StorageMetadata storageMetadata) {
    WritableMap metadata = Arguments.createMap();
    metadata.putString("getBucket", storageMetadata.getBucket());
    metadata.putString("getName", storageMetadata.getName());
    metadata.putDouble("sizeBytes", storageMetadata.getSizeBytes());
    metadata.putDouble("created_at", storageMetadata.getCreationTimeMillis());
    metadata.putDouble("updated_at", storageMetadata.getUpdatedTimeMillis());
    metadata.putString("md5hash", storageMetadata.getMd5Hash());
    metadata.putString("encoding", storageMetadata.getContentEncoding());
    return metadata;
  }

  // STORAGE
  @ReactMethod
  public void uploadFile(final String urlStr, final String name, final String filepath, final ReadableMap metadata, final Callback callback) {
    FirebaseStorage storage = FirebaseStorage.getInstance();
    StorageReference storageRef = storage.getReferenceFromUrl(urlStr);
    StorageReference fileRef = storageRef.child(name);

    Log.i(TAG, "From file: " + filepath + " to " + urlStr + " with name " + name);

    try {
      Uri file;
      if (filepath.startsWith("content://")) {
          String realPath = getRealPathFromURI(filepath);
          file = Uri.fromFile(new File(realPath));
      } else {
          file = Uri.fromFile(new File(filepath));
      }

      StorageMetadata.Builder metadataBuilder = new StorageMetadata.Builder();
      Map<String, Object> m = FirestackUtils.recursivelyDeconstructReadableMap(metadata);

      for (Map.Entry<String, Object> entry : m.entrySet()) {
        metadataBuilder.setCustomMetadata(entry.getKey(), entry.getValue().toString());
      }

      StorageMetadata md = metadataBuilder.build();
      UploadTask uploadTask = fileRef.putFile(file, md);

      // register observers to listen for when the download is done or if it fails
      uploadTask
          .addOnFailureListener(new OnFailureListener() {
            @Override
            public void onFailure(@NonNull Exception exception) {
              // handle unsuccessful uploads
              Log.e(TAG, "Failed to upload file " + exception.getMessage());

              WritableMap err = Arguments.createMap();
              err.putString("description", exception.getLocalizedMessage());

              callback.invoke(err);
            }
          })
          .addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
            @Override
            public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
              Log.d(TAG, "Successfully uploaded file " + taskSnapshot);
              // taskSnapshot.getMetadata() contains file metadata such as size, content-type, and download URL.
              WritableMap resp = getDownloadData(taskSnapshot);
              callback.invoke(null, resp);
            }
          })
          .addOnProgressListener(new OnProgressListener<UploadTask.TaskSnapshot>() {
            @Override
            public void onProgress(UploadTask.TaskSnapshot taskSnapshot) {
              double totalBytes = taskSnapshot.getTotalByteCount();
              double bytesTransferred = taskSnapshot.getBytesTransferred();
              double progress = (100.0 * bytesTransferred) / totalBytes;

              System.out.println("Transferred " + bytesTransferred + "/" + totalBytes + "(" + progress + "% complete)");

              if (progress >= 0) {
                WritableMap data = Arguments.createMap();
                data.putString("eventName", STORAGE_UPLOAD_PROGRESS);
                data.putDouble("progress", progress);
                FirestackUtils.sendEvent(getReactApplicationContext(), STORAGE_UPLOAD_PROGRESS, data);
              }
            }
          })
          .addOnPausedListener(new OnPausedListener<UploadTask.TaskSnapshot>() {
            @Override
            public void onPaused(UploadTask.TaskSnapshot taskSnapshot) {
              System.out.println("Upload is paused");
              StorageMetadata d = taskSnapshot.getMetadata();
              String bucket = d.getBucket();
              WritableMap data = Arguments.createMap();
              data.putString("eventName", STORAGE_UPLOAD_PAUSED);
              data.putString("ref", bucket);
              FirestackUtils.sendEvent(getReactApplicationContext(), STORAGE_UPLOAD_PAUSED, data);
            }
          });
    } catch (Exception ex) {
      final int errorCode = 2;
      callback.invoke(makeErrorPayload(errorCode, ex));
    }
  }

  @ReactMethod
  public void getRealPathFromURI(final String uri, final Callback callback) {
    try {
      String path = getRealPathFromURI(uri);
      callback.invoke(null, path);
    } catch (Exception ex) {
      ex.printStackTrace();
      final int errorCode = 1;
      callback.invoke(makeErrorPayload(errorCode, ex));
    }
  }

  private String getRealPathFromURI(final String uri) {
    Cursor cursor = null;
    try {
      String[] proj = {MediaStore.Images.Media.DATA};
      cursor = getReactApplicationContext().getContentResolver().query(Uri.parse(uri), proj, null, null, null);
      int column_index = cursor.getColumnIndexOrThrow(MediaStore.Images.Media.DATA);
      cursor.moveToFirst();
      return cursor.getString(column_index);
    } finally {
      if (cursor != null) {
        cursor.close();
      }
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
