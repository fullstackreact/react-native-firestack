## Firestack

Firestack makes using the latest [Firebase](https://firebase.google.com/) straight-forward.

[![Gitter](https://badges.gitter.im/fullstackreact/react-native-firestack.svg)](https://gitter.im/fullstackreact/react-native-firestack?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## What

Firestack is a _light-weight_ layer sitting atop the native Firebase libraries for iOS and Android and mirrors the React Native JS api as closely as possible.

For a detailed discussion of how Firestack works as well as how to contribute, check out our [contribution guide](https://github.com/fullstackreact/react-native-firestack/blob/master/Contributing.md).

## Features

* Nearly automatic, rapid setup on Firebase
* Covers lots of awesome features of Firebase:
  * authentication
    * username and password
    * social auth (implemented in conjunction with [react-native-oauth](https://github.com/fullstackreact/react-native-oauth))
      * Facebook
      * Github
      * Google
      * Twitter
  * storage handling
    * upload files
    * download urls
    * download files
  * real-time database
  * presence out-of-the-box
  * analytics
  * Remote configuration
  * FCM (in-progress)
* Redux support built-in (but not required)
* Android and iOS support
* Community supported and professionally backed
* Intended on being as drop-dead simple as possible
* And so much more

## Example app

We have a working application example available in at [fullstackreact/FirestackApp](https://github.com/fullstackreact/FirestackApp). Check it out for more details about how to use Firestack.

## Why?

Firebase is awesome and it's combination with the Google Cloud Platform makes it super awesome. Sadly, the latest version of Firebase requires the `window` object. That's where Firestack comes in! Firestack provides a really thin layer that sits on top of the native Firebase SDKs and attempts to use the JavaScript library as much as possible rather than reinventing the wheel.

## Installing

Getting `react-native-firestack` up and running in your app should be a 2 step process + 1 for each platform.

1. Install the `npm` package
2. Link the project with `react-native link react-native-firestack`
3. To ensure Android is setup, check your `MainApplication.java` for the `FirestackPackage()` line.

Those steps in more detail:

Install the `npm` package with:

```bash
npm install react-native-firestack --save
```

To use Firestack, we'll need to have a development environment that includes the same prerequisites of Firebase.

### iOS (with cocoapods)

Unfortunately, due to AppStore restrictions, we currently do _not_ package Firebase libraries in with Firestack. However, the good news is we've automated the process (with many thanks to the Auth0 team for inspiration) of setting up with cocoapods. This will happen automatically upon linking the package with `react-native-cli`.

**Remember to use the `ios/[YOUR APP NAME].xcworkspace` instead of the `ios/[YOUR APP NAME].xcproj` file from now on**.

We need to link the package with our development packaging. We have two options to handle linking:

#### Automatically with react-native-cli

React native ships with a `link` command that can be used to link the projects together, which can help automate the process of linking our package environments.

```bash
react-native link react-native-firestack
```

Update the newly installed pods once the linking is done:

```bash
cd ios && pod update --verbose
```

#### Manually

If you prefer not to use `rnpm`, we can manually link the package together with the following steps, after `npm install`:

1. In XCode, right click on `Libraries` and find the `Add Files to [project name]`.

![Add library to project](http://d.pr/i/2gEH.png)

2. Add the `node_modules/react-native-firestack/ios/Firestack.xcodeproj`

![Firebase.xcodeproj in Libraries listing](http://d.pr/i/19ktP.png)

3. Ensure that the `Build Settings` of the `Firestack.xcodeproj` project is ticked to _All_ and it's `Header Search Paths` include both of the following paths _and_ are set to _recursive_:

  1. `$(SRCROOT)/../../react-native/React`
  2. `$(SRCROOT)/../node_modules/react-native/React`
  3. `${PROJECT_DIR}/../../../ios/Pods`

![Recursive paths](http://d.pr/i/1hAr1.png)

4. Setting up cocoapods

Since we're dependent upon cocoapods (or at least the Firebase libraries being available at the root project -- i.e. your application), we have to make them available for Firestack to find them.

Using cocoapods is the easiest way to get started with this linking. Add or update a `Podfile` at `ios/Podfile` in your app with the following:

```ruby
source 'https://github.com/CocoaPods/Specs.git'
[
  'Firebase/Core',
  'Firebase/Auth',
  'Firebase/Storage',
  'Firebase/Database',
  'Firebase/RemoteConfig',
  'Firebase/Messaging'
].each do |lib|
  pod lib
end
```

Then you can run `(cd ios && pod install)` to get the pods opened. If you do use this route, remember to use the `.xcworkspace` file.

If you don't want to use cocoapods, you don't need to use it! Just make sure you link the Firebase libraries in your project manually. For more information, check out the relevant Firebase docs at [https://firebase.google.com/docs/ios/setup#frameworks](https://firebase.google.com/docs/ios/setup#frameworks).

### Android

Full Android support is coming soon, as it currently supports a smaller feature-set than the iOS version. Just as we do with iOS, we'll need to install the library using `npm` and call `link` on the library:

```bash
react-native link react-native-firestack
```

Firestack includes the Firebase libraries and will link those directly into our project automatically.

#### Manually

To install `react-native-firestack` manually in our project, we'll need to import the package from `io.fullstack.firestack` in our project's `android/app/src/main/java/com/[app name]/MainApplication.java` and list it as a package for ReactNative in the `getPackages()` function:

```java
package com.appName;
// ...
import io.fullstack.firestack.FirestackPackage;
// ...
public class MainApplication extends Application implements ReactApplication {
    // ...

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new FirestackPackage()
      );
    }
  };
  // ...
}
```

We'll also need to list it in our `android/app/build.gradle` file as a dependency that we want React Native to compile. In the `dependencies` listing, add the `compile` line:

```java
dependencies {
  compile project(':react-native-firestack')
}
```

Add to `AndroidManifest.xml` file
```diff
  <activity android:name="com.facebook.react.devsupport.DevSettingsActivity" />
+   <service android:name="io.fullstack.firestack.FirestackMessagingService">
+     <intent-filter>
+       <action android:name="com.google.firebase.MESSAGING_EVENT"/>
+     </intent-filter>
+   </service>

+   <service android:name="io.fullstack.firestack.FirestackInstanceIdService" android:exported="false">
+     <intent-filter>
+       <action android:name="com.google.firebase.INSTANCE_ID_EVENT"/>
+     </intent-filter>
+   </service>
```

## Firebase setup

The Firestack library is intended on making it easy to work with [Firebase](https://firebase.google.com/) and provides a small native shim to the Firebase native code.

To add Firebase to your project, make sure to create a project in the [Firebase console](https://firebase.google.com/console)

![Create a new project](http://d.pr/i/17cJ2.png)

Each platform uses a different setup method after creating the project.

### iOS

After creating a Firebase project, click on the [Add Firebase to your iOS app](http://d.pr/i/3sEL.png) and follow the steps from there to add the configuration file. You do _not_ need to set up a cocoapods project (this is already done through firestack). Make sure not to forget the `Copy Files` phase in iOS.

[Download the Firebase config file](https://support.google.com/firebase/answer/7015592) and place it in your app directory next to your app source code:

![GoogleService-Info.plist](http://d.pr/i/1eGev.png)

Once you download the configuration file, make sure you place it in the root of your Xcode project. Every different Bundle ID (aka, even different project variants needs their own configuration file).

Lastly, due to some dependencies requirements, Firestack supports iOS versions 8.0 and up. Make sure to update the minimum version of your iOS app to `8.0`.

### Android

There are several ways to setup Firebase on Android. The _easiest_ way is to pass the configuration settings in JavaScript. In that way, there is no setup for the native platform.

#### google-services.json setup
If you prefer to include the default settings in the source of your app, download the `google-services.json` file provided by Firebase in the _Add Firebase to Android_ platform menu in your Firebase configuration console.

Next you'll have to add the google-services gradle plugin in order to parse it.

Add the google-services gradle plugin as a dependency in the *project* level build.gradle
`android/build.gradle`
```java
buildscript {
  // ...
  dependencies {
    // ...
    classpath 'com.google.gms:google-services:3.0.0'
  }
}
```

In your app build.gradle file, add the gradle plugin at the VERY BOTTOM of the file (below all dependencies)
`android/app/build.gradle`
```java
apply plugin: 'com.google.gms.google-services'
```

## Usage

After creating a Firebase project and installing the library, we can use it in our project by importing the library in our JavaScript:

```javascript
import Firestack from 'react-native-firestack'
```

We need to tell the Firebase library we want to _configure_ the project. Firestack provides a way to configure both the native and the JavaScript side of the project at the same time with a single command:

```javascript
const firestack = new Firestack();
```

We can pass _custom_ options by passing an object with configuration options. The configuration object will be generated first by the native configuration object, if set and then will be overridden if passed in JS. That is, all of the following key/value pairs are optional if the native configuration is set.

| option           | type | Default Value           | Description                                                                                                                                                                                                                                                                                                                                                      |
|----------------|----------|-------------------------|----------------------------------------|
| debug | bool | false | When set to true, Firestack will log messages to the console and fire `debug` events we can listen to in `js` |
| bundleID | string | Default from app `[NSBundle mainBundle]` | The bundle ID for the app to be bundled with |
| googleAppID | string | "" | The Google App ID that is used to uniquely identify an instance of an app. |
| databaseURL | string | "" | The database root (i.e. https://my-app.firebaseio.com) |
| deepLinkURLScheme | string | "" | URL scheme to set up durable deep link service |
| storageBucket | string | "" | The Google Cloud storage bucket name |
| androidClientID | string | "" | The Android client ID used in Google AppInvite when an iOS app has it's android version |
| GCMSenderID | string | "" | The Project number from the Google Developer's console used to configure Google Cloud Messaging |
| trackingID | string | "" | The tracking ID for Google Analytics |
| clientID | string | "" | The OAuth2 client ID for iOS application used to authenticate Google Users for signing in with Google |
| APIKey | string | "" | The secret iOS API key used for authenticating requests from our app |

For instance:

```javascript
const configurationOptions = {
  debug: true
};
const firestack = new Firestack(configurationOptions);
firestack.on('debug', msg => console.log('Received debug message', msg))
```

## API documentation

Firestack is broken up into multiple parts, based upon the different API features that Firebase provides.

All methods return a promise.

### Authentication

Firestack handles authentication for us out of the box, both with email/password-based authentication and through oauth providers (with a separate library to handle oauth providers).

> Android requires the Google Play services to installed for authentication to function.

#### listenForAuth()

Firebase gives us a reactive method for listening for authentication. That is we can set up a listener to call a method when the user logs in and out. To set up the listener, call the `listenForAuth()` method:

```javascript
firestack.auth.listenForAuth(function(evt) {
  // evt is the authentication event
  // it contains an `error` key for carrying the
  // error message in case of an error
  // and a `user` key upon successful authentication
  if (!evt.authenticated) {
    // There was an error or there is no user
    console.error(evt.error)
  } else {
    // evt.user contains the user details
    console.log('User details', evt.user);
  }
})
.then(() => console.log('Listening for authentication changes'))
```

#### unlistenForAuth()

We can remove this listener by calling the `unlistenForAuth()` method. This is important to release resources from our app when we don't need to hold on to the listener any longer.

```javascript
firestack.auth.unlistenForAuth()
```

#### createUserWithEmail()

We can create a user by calling the `createUserWithEmail()` function. The `createUserWithEmail()` accepts two parameters, an email and a password.

```javascript
firestack.auth.createUserWithEmail('ari@fullstack.io', '123456')
  .then((user) => {
    console.log('user created', user)
  })
  .catch((err) => {
    console.error('An error occurred', err);
  })
```

#### signInWithEmail()

To sign a user in with their email and password, use the `signInWithEmail()` function. It accepts two parameters, the user's email and password:

```javascript
firestack.auth.signInWithEmail('ari@fullstack.io', '123456')
  .then((user) => {
    console.log('User successfully logged in', user)
  })
  .catch((err) => {
    console.error('User signin error', err);
  })
```

#### signInWithCustomToken()

To sign a user using a self-signed custom token, use the `signInWithCustomToken()` function. It accepts one parameter, the custom token:

```javascript
firestack.auth.signInWithCustomToken(TOKEN)
  .then((user) => {
    console.log('User successfully logged in', user)
  })
  .catch((err) => {
    console.error('User signin error', err);
  })
```

#### signInWithProvider()

We can use an external authentication provider, such as twitter/facebook for authentication. In order to use an external provider, we need to include another library to handle authentication.

> By using a separate library, we can keep our dependencies a little lower and the size of the application down.

### OAuth setup with library

[Currently undergoing updates]

### socialLogin with custom Library
If you don't want to use [react-native-oauth](https://github.com/fullstackreact/react-native-oauth), you can use other library such as [react-native-facebook-login](https://github.com/magus/react-native-facebook-login).

```javascript
var {FBLogin, FBLoginManager} = require('react-native-facebook-login');

var Login = React.createClass({
  render: function() {
    return (
      <FBLogin
        onLogin={function(data){
          console.log("Logged in!");
          console.log(data);
          let token = data.credentials.token
          firestack.auth.signInWithProvider('facebook', token, '') // facebook need only access token.
            .then((user)=>{
              console.log(user)
            })
        }}
      />
    );
  }
});
```

If the `signInWithProvider()` method resolves correct and we have already set up our `listenForAuth()` method properly, it will fire and we'll have a logged in user through Firebase.

### reauthenticateWithCredentialForProvider()

When the auth token has expired, we can ask firebase to reauthenticate with the provider. This method accepts the _same_ arguments as `signInWithProvider()` accepts.

#### updateUserEmail()

We can update the current user's email by using the command: `updateUserEmail()`. It accepts a single argument: the user's new email:

```javascript
firestack.auth.updateUserEmail('ari+rocks@fullstack.io')
  .then((res) => console.log('Updated user email'))
  .catch(err => console.error('There was an error updating user email'))
```

#### updateUserPassword()

We can update the current user's password using the `updateUserPassword()` method. It accepts a single parameter: the new password for the current user

```javascript
firestack.auth.updateUserPassword('somethingReallyS3cr3t733t')
  .then(res => console.log('Updated user password'))
  .catch(err => console.error('There was an error updating your password'))
```

### sendPasswordResetWithEmail()

To send a password reset for a user based upon their email, we can call the `sendPasswordResetWithEmail()` method. It accepts a single parameter: the email of the user to send a reset email.

```javascript
firestack.auth.sendPasswordResetWithEmail('ari+rocks@fullstack.io')
  .then(res => console.log('Check your inbox for further instructions'))
  .catch(err => console.error('There was an error :('))
```

#### updateUserProfile()

To update the current user's profile, we can call the `updateUserProfile()` method.

It accepts a single parameter:

* object which contains updated key/values for the user's profile. Possible keys are listed [here](https://firebase.google.com/docs/auth/ios/manage-users#update_a_users_profile).

```javascript
firestack.auth.updateUserProfile({
  displayName: 'Ari Lerner'
})
  .then(res => console.log('Your profile has been updated'))
  .catch(err => console.error('There was an error :('))
```

#### deleteUser()

It's possible to delete a user completely from your account on Firebase. Calling the `deleteUser()` method will take care of this for you.

```javascript
firestack.auth.deleteUser()
.then(res => console.log('Sad to see you go'))
.catch(err => console.error('There was an error - Now you are trapped!'))
```

#### getToken()

If you want user's token, use `getToken()` method.

```javascript
firestack.auth.getToken()
.then(res => console.log(res.token))
.catch(err => console.error('error'))
```

#### signOut()

To sign the current user out, use the `signOut()` method. It accepts no parameters

```javascript
firestack.auth.signOut()
.then(res => console.log('You have been signed out'))
.catch(err => console.error('Uh oh... something weird happened'))
```

#### getCurrentUser()

Although you _can_ get the current user using the `getCurrentUser()` method, it's better to use this from within the callback function provided by `listenForAuth()`. However, if you need to get the current user, call the `getCurrentUser()` method:

```javascript
firestack.auth.getCurrentUser()
.then(user => console.log('The currently logged in user', user))
.catch(err => console.error('An error occurred'))
```

### Analytics

Wouldn't it be nice to send analytics about your app usage from your users? Well, you totally can! The Firebase analytics console is incredibly useful and Firestack has a method for interacting with it. You can send any event with contextual information, which automatically includes the currently logged in user using the `logEventWithName()` method. It accepts two parameters: the name of the event and an object containing any contextual information. The values should be serializable (i.e. no complex instance objects).

#### logEventWithName()

```javascript
firestack.analytics.logEventWithName("launch", {
  'screen': 'Main screen'
})
.then(res => console.log('Sent event named launch'))
.catch(err => console.error('You should never end up here'));
```

### Storage

Firebase's integration with the Google platform expanded it's features to include hosting user-generated files, like photos. Firestack provides a thin layer to handle uploading files to Firebase's storage service.

#### setStorageUrl()

In order to store anything on Firebase, we need to set the storage url provided by Firebase. This can be set by using the `setStorageUrl()` method. Your storageUrl can be found on the firebase console.

![Storage url](http://d.pr/i/1lKjQ.png)

The `setStorageUrl()` method accepts a single parameter: your root storage url (without leading "gs://").

```javascript
firestack.storage.setStorageUrl(`${config.firebase.storageBucket}`)
```

If the `storageBucket` key is passed as a configuration option, this method is automatically called by default.

#### uploadFile()

We can upload a file using the `uploadFile()` method. Using the `uploadFile()` method, we can set the name of the destination file, the path where we want to store it, as well as any metadata along with the file.

```javascript
firestack.storage.uploadFile(`photos/${auth.user.uid}/${filename}`, path, {
  contentType: 'image/jpeg',
  contentEncoding: 'base64',
})
.then((res) => console.log('The file has been uploaded'))
.catch(err => console.error('There was an error uploading the file', err))
```

To upload camera photos, we can combine this method with the `react-native-camera` plugin, for instance:

```javascript
this.camera.capture()
.then(({path}) => {
  firestack.storage.uploadFile(`photos/${auth.user.uid}/${filename}`, path, {
    contentType: 'image/jpeg',
    contentEncoding: 'base64',
  })
})
.catch(err => console.error(err));
```

To combine the `react-native-camera` plugin with firestack, we recommend setting the `captureTarget` to the `temp` storage path, like so:

```javascript
<Camera
  ref={(cam) => {
    this.camera = cam;
  }}
  captureTarget={Camera.constants.CaptureTarget.temp}
  style={styles.preview}
  aspect={Camera.constants.Aspect.fill}>
    <Text style={styles.capture} onPress={this.takePicture.bind(this)}>[CAPTURE]</Text>
</Camera>
```

Firestack also gives you the ability to listen for database events on upload. The final parameter the `uploadFile()` function accepts is a callback that will be called anytime a storage event is fired.

The following events are supported:

* upload_progress
* upload_paused
* upload_resumed

For example, the `takePicture` function from the example above might look something similar to:

```javascript
takePicture() {
  this.camera.capture()
    .then(({path}) => {
      const filename = 'photo.jpg'
      firestack.storage.uploadFile(`photos/${filename}`, path, {
        contentType: 'image/jpeg',
        contentEncoding: 'base64',
      }, (evt) => {
        console.log('Got an event in JS', evt);
      })
      .then((res) => {
        console.log('result from upload file: ', res);
      })
      .catch((err) => {
        console.log('error happened with uploadFile', err);
      })
    })
    .catch(err => console.error(err));
}
```

#### downloadUrl()

The `downloadUrl()` method allows us to fetch the URL from the storage obejct in Firebase. It's defined on the `storageRef` object and can be used like so:

```javascript
const storageRef = data.firestack.storage.ref('photos/photo.jpg');
storageRef.downloadUrl()
.then(res => {
  // res is an object that contains
  // the `url` as well as the path to the file in `path`
})
```

#### download()

It's possible to download remote files as well. The `download()` method will take a remote file and download and save it to the user's device. It is implemented on the `storageRef`:

```javascript
const storageRef = data.firestack.storage.ref('photos/photo.jpg');
const localPath = `downloadedFile.jpg`;
storageRef.download(localPath, (msg) => {
  // downloading state callback
})
.then(res => {
  // res contains details about the downloaded file
})
.catch(err => {
  // error contains any errors in downloading
});
```

The method accepts a callback that gets called with any download events:

* download_progress ({eventName: 'download_progress', progress: float });
* download_paused ({eventName: 'download_paused'})
* download_resumed ({eventName: 'download_resumed'})

As helpful constants, Firestack exports a few storage constants on the `firestack.constants` getter:

* MAIN_BUNDLE_PATH
* CACHES_DIRECTORY_PATH
* DOCUMENT_DIRECTORY_PATH
* EXTERNAL_DIRECTORY_PATH
* EXTERNAL_STORAGE_DIRECTORY_PATH
* TEMP_DIRECTORY_PATH
* LIBRARY_DIRECTORY_PATH

And we also export the filetype constants as well:

* FILETYPE_REGULAR
* FILETYPE_DIRECTORY

> Note: this idea comes almost directory from [react-native-fs](https://github.com/johanneslumpe/react-native-fs), so we don't claim credit for coming up with this fantastic idea.

### Realtime Database

The native Firebase JavaScript library provides a featureful realtime database that works out of the box. Firestack provides an attribute to interact with the database without needing to configure the JS library.

Ranking strategy

Add a new record with timestamp using this solution:

```js
firebaseApp.database.ref('posts').push().then((res) => {
 let newPostKey = res.key;
 firebaseApp.ServerValue.then(map => {
   const postData = {
     name: name,
     timestamp: map.TIMESTAMP,
     text: this.state.postText,
     title: this.state.postTitle,
     puid: newPostKey
    }
    let updates = {}
    updates['/posts/' + newPostKey] = postData
    firebaseApp.database.ref().update(updates).then(() => {
      this.setState({
                      postStatus: 'Posted! Thank You.',
                      postText: '',
                    });
    }).catch(() => {
      this.setState({ postStatus: 'Something went wrong!!!' });
    })
  })
})
```

Then retrieve the feed using this:

```js
firebaseApp.database.ref('posts').orderByChild('timestamp').limitToLast(30).once('value')
.then((snapshot) => {
  this.props.savePosts(snapshot.val())
  const val = snapshot.val();
  console.log(val);
})
```

#### DatabaseRef

Firestack attempts to provide the same API as the JS Firebase library for both Android and iOS platforms. [Check out the firebase guide](https://firebase.google.com/docs/database/web/read-and-write) for more information on how to use the JS library.

#### Example

```javascript

function handleValueChange(snapshot) {
  if (snapshot.val()) {
    console.log('The list was updated');
  }
}

const LIST_KEY = 'path/to/data';
firestack.database.ref(LIST_KEY).on('value', handleValueChange);

// Calling `.off` with a reference to the callback function will only remove that specific listener.
// This is useful if multiple components are listening and unlistening to the same ref path.
firestack.database.ref(LIST_KEY).off('value', handleValueChange);

// Calling `.off` without passing the callback function will remove *all* 'value' listeners for that ref
firestack.database.ref(LIST_KEY).off('value');

```

// TODO: Finish documenting

#### Offline data persistence

For handling offline operations, you can enable persistence by using the `setPersistence()` command. You can turn it on and off by passing the boolean of `true` or `false`.

```javascript
firestack.database.setPersistence(true);
```

The database refs has a `keepSynced()` function to tell the firestack library to keep the data at the `ref` in sync.

```javascript
const ref = firestack.database
            .ref('chat-messages')
            .child('roomId');
ref.keepSynced(true);
```

### Presence

Firestack comes in with a built-in method for handling user connections. We just need to set the presence ref url and tell Firestack to keep track of the user by their child path.

```javascript
firestack.presence          // the presence api
  .on('users/connections')  // set the users/connections as the
                            // root for presence handling
  .setOnline('auser')       // Set the child of auser as online
```

While the _device_ is online (the connection), the value of the child object at `users/connections/auser` will be:

```javascript
{
  online: true,
  lastOnline: TIMESTAMP
}
```

When the device is offline, the value will be updated with `online: false`:

```javascript
{
  online: false,
  lastOnline: TIMESTAMP
}
```

To set up your own handlers on the presence object, you can call `onConnect()` and pass a callback. The method will be called with the `connectedDevice` database reference and you can set up your own handlers:

```javascript
const presence = firestack.presence
                          .on('users/connections');
presence.onConnect((ref) => {
  ref.onDisconnect().remove(); // Remove the entry
  // or
  ref.set({
    location: someLocation
  });
  // or whatever you want as it's called with the database
  // reference. All methods on the DatabaseRef object are
  // available here on the `ref`
})
```

### ServerValue

Firebase provides some static values based upon the server. We can use the `ServerValue` constant to retrieve these. For instance, to grab the TIMESTAMP on the server, use the `TIMESTAMP` value:

```javascript
const timestamp = firestack.ServerValue.TIMESTAMP
```

### Cloud Messaging

Access the device registration token

```javascript
  firestack.cloudMessaging.getToken().then(function (token) {
    console.log('device token', token);
  });
```

Monitor token generation

```javascript
  // add listener
  firestack.cloudMessaging.listenForTokenRefresh(function (token) {
    console.log('refresh device token', token);
  });

  // remove listener
  firestack.cloudMessaging.unlistenForTokenRefresh();
```

Subscribe to topic

```javascript
  firestack.cloudMessaging.subscribeToTopic("topic_name").then(function (topic) {
      console.log('Subscribe:'+topic);
  }).catch(function(err){
       console.error(err);
  });
```

Unsubscribe from topic

```javascript
  firestack.cloudMessaging.unsubscribeFromTopic("topic_name").then(function (topic) {
      console.log('unsubscribe:'+topic);
  }).catch(function(err){
       console.error(err);
  });
```

Receive Messages

```javascript
  firestack.cloudMessaging.listenForReceiveNotification((msg) =>{
    console.log('Receive Messages:'+msg.data);
    console.log('Receive Messages:'+msg.notification);

  });
```

### Events

#### on()

We can listen to arbitrary events fired by the Firebase library using the `on()` method. The `on()` method accepts a name and a function callback:

```javascript
firestack.on('listenForAuth', (evt) => console.log('Got an event'));
```

#### off()

To unsubscribe to events fired by Firebase, we can call the `off()` method with the name of the event we want to unsubscribe.

```javascript
firestack.off('listenForAuth');
```

## FirestackModule

Firestack provides a built-in way to connect your Redux app using the `FirestackModule` export from Firestack.

## Running with the `master` branch

Most of our work is committed to the master branch. If you want to run the bleeding-edge version of Firestack, you'll need to follow these instructions.

Since `react-native` doesn't like symlinks, we need to clone the raw repository into our `node_modules/` manually. First, in order to tell `react-native` we are using the package `react-native-firestack`, make sure to install the `npm` version:

```bash
npm install --save react-native-firestack
```

After the `npm` version is installed, you can either clone the repo directly into our `node_modules/` directory:

```bash
git clone https://github.com/fullstackreact/react-native-firestack.git ./node_modules/react-native-firestack
```

Alternatively, you can clone the repo somewhere else and `rsync` the directory over to the `node_modules/` directory.

> This is the method I use as it allows me to separate the codebases:

```bash
git clone https://github.com/fullstackreact/react-native-firestack.git \
      ~/Development/react-native/mine/react-native-firestack/

## And rsync
rsync -avhW --delete \
      --exclude='node_modules' \
      --exclude='.git' \
      ~/Development/react-native/mine/react-native-firestack/ \
      ./node_modules/react-native-firestack/
```

## Contributing

This is _open-source_ software and we can make it rock for everyone through contributions.

How do you contribute? Check out our contribution guide at [CONTRIBUTING.md](https://github.com/fullstackreact/react-native-firestack/blob/master/Contributing.md)

## TODO

The following is left to be done:

- [x] Complete FirebaseModule functionality
- [ ] Document FirebaseModule
- [X] Add Android support
  - auth/analytics/database/storage/presence are feature-complete. remoteconfig/messaging are mostly-there.
- [x] Add Cloud Messaging
  - [ ] Add JS api
- [ ] Move to use swift (cleaner syntax)
- [ ] TODO: Finish Facebook integration
