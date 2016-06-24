## Firestack

Firestack makes using the latest [Firebase](http://firebase.com) straight-forward.

## What

Firestack is a _light-weight_ layer sitting atop the native Firebase libraries for iOS and Android (coming soon), deferring to as much of the JavaScript library as possible. For parts of the api that are natively supported by the Firebase JavaScript api, this library acts as a thin proxy to the JS objects, while it provides a native shim to those that are not covered.

## Installing

Install the `npm` package with:

```bash
npm install react-native-firestack --save
```

To use Firestack, we'll need to have a development environment that includes the same prerequisites of Firebase.

### iOS

We need to link the package with our development packaging. We have two options to handle linking:

#### Automatically with [rnpm](https://github.com/rnpm/rnpm)

[rnpm](https://github.com/rnpm/rnpm) is a React Native package manager which can help to automate the process of linking package environments.

```bash
rnpm link
```

#### Manually

If you prefer not to use `rnpm`, we can manually link the package together with the following steps, after `npm install`:

1. In XCode, right click on `Libraries` and find the `Add Files to [project name]`.

![Add library to project](http://d.pr/i/2gEH.png)

2. Add the `node_modules/react-native-firestack/ios/Firestack.xcodeproj`

![Firebase.xcodeproj in Libraries listing](http://d.pr/i/19ktP.png)

3. In the project's "Build Settings" tab in your app's target, add `libFirestack.a` to the list of `Link Binary with Libraries`

![Linking binaries](http://d.pr/i/1cHgs.png)

4. Ensure that the `Build Settings` of the `Firestack.xcodeproj` project is ticked to _All_ and it's `Header Search Paths` include both of the following paths _and_ are set to _recursive_:

  1. `$(SRCROOT)/../../react-native/React`
  2. `$(SRCROOT)/../node_modules/react-native/React`

![Recursive paths](http://d.pr/i/1hAr1.png)

#### Cocoapods

You can also install `Firestack` as a cocoapod by adding the line to your `ios/Podfile`

```ruby
pod 'Firestack'
```

### Android

Coming soon

## Firebase setup

The Firestack library is intended on making it easy to work with [Firebase](https://firebase.google.com/) and provides a small native shim to the Firebase native code.

To add Firebase to your project, make sure to create a project in the [Firebase console](https://firebase.google.com/console)

![Create a new project](http://d.pr/i/17cJ2.png)

Each platform uses a different setup method after creating the project.

### iOS

After creating a Firebase project, click on the [Add Firebase to your iOS app](http://d.pr/i/3sEL.png) and follow the steps from there.

**[IMPORTANT: Download the config file](https://support.google.com/firebase/answer/7015592)**

Once you download the configuration file, make sure you place it in the root of your Xcode project. Every different Bundle ID (aka, even different project variants needs their own configuration file).

### Android

Coming soon

## Usage

After creating a Firebase project and installing the library, we can use it in our project by importing the library in our JavaScript:

```javascript
import Firestack from 'react-native-firestack'
```

We need to tell the Firebase library we want to _configure_ the project. Firestack provides a way to configure both the native and the JavaScript side of the project at the same time with a single command:

```javascript
const server = new Firestack();
server.configure()
  .then(() => console.log("Project configured and ready to boot"));
```

Firestack is broken up into multiple parts, based upon the different API features that Firebase provides.

All methods return a promise.

### Authentication

Firestack handles authentication for us out of the box, both with email/password-based authentication and through oauth providers (with a separate library to handle oauth providers).

#### listenForAuth()

Firebase gives us a reactive method for listening for authentication. That is we can set up a listener to call a method when the user logs in and out. To set up the listener, call the `listenForAuth()` method:

```javascript
server.listenForAuth(function(evt) {
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
server.unlistenForAuth()
```

#### createUserWithEmail()

We can create a user by calling the `createUserWithEmail()` function. The `createUserWithEmail()` accepts two parameters, an email and a password.

```javascript
server.createUserWithEmail('ari@fullstack.io', '123456')
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
server.signInWithEmail('ari@fullstack.io', '123456')
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

We'll use the [react-native-oauth](https://github.com/fullstackreact/react-native-oauth) library, which was built along-side [Firestack](https://github.com/fullstackreact/react-native-firestack) specifically to handle authentication through third-party providers.

> If you prefer to use another library, make sure you pass through the `oauthToken` and `oauthTokenSecret` provided by your other library to call the `signInWithProvider()` method.

Following the instructions on the [react-native-oauth README](https://github.com/fullstackreact/react-native-oauth), we'll need to install it using `npm`:

```javascript
npm install --save react-native-oauth
```

It's important to set up the authentication library fully with our app configuration. Make sure to configure your app [along with this step](https://github.com/fullstackreact/react-native-oauth#handle-deep-linking-loading) otherwise authentication _cannot_ work.

Once the app is configured with the instructions, we can call the `oauthManager`'s (or other library's) login method. We'll need to hold on to the `oauthToken` and an `oauthTokenSecret` provided by the provider. Using these values, we can call the `signInWithProvider()` method. The `signInWithProvider()` method accepts three parameters:

1. The provider (such as `twitter`, `facebook`, etc) name
2. The `authToken` value granted by the provider
3. The `authTokenSecret` value granted by the provider

```javascript
// For instance, using the react-native-oauth library, this process
// looks like:

const appUrl = 'app-uri://oauth-callback/twitter'
authManager.authorizeWithCallbackURL('twitter', appUrl)
.then(creds => {
  return server.signInWithProvider('twitter', creds.oauth_token creds.oauth_token_secret)
    .then(() => {
      // We're now signed in through Firebase
    })
    .catch(err => {
      // There was an error
    })
})
```

If the `signInWithProvider()` method resolves correct and we have already set up our `listenForAuth()` method properly, it will fire and we'll have a logged in user through Firebase.

### reauthenticateWithCredentialForProvider()

When the auth token has expired, we can ask firebase to reauthenticate with the provider. This method accepts the _same_ arguments as `signInWithProvider()` accepts. 

#### updateUserEmail()

We can update the current user's email by using the command: `updateUserEmail()`. It accepts a single argument: the user's new email:

```javascript
server.updateUserEmail('ari+rocks@fullstack.io')
  .then((res) => console.log('Updated user email'))
  .catch(err => console.error('There was an error updating user email'))
```

#### updateUserPassword()

We can update the current user's password using the `updateUserPassword()` method. It accepts a single parameter: the new password for the current user

```javascript
server.updateUserPassword('somethingReallyS3cr3t733t')
  .then(res => console.log('Updated user password'))
  .catch(err => console.error('There was an error updating your password'))
```

### sendPasswordResetWithEmail()

To send a password reset for a user based upon their email, we can call the `sendPasswordResetWithEmail()` method. It accepts a single parameter: the email of the user to send a reset email.

```javascript
server.sendPasswordResetWithEmail('ari+rocks@fullstack.io')
  .then(res => console.log('Check your inbox for further instructions'))
  .catch(err => console.error('There was an error :('))
```

#### updateUserProfile()

To update the current user's profile, we can call the `updateUserProfile()` method.

It accepts a single parameter:

* object which contains updated key/values for the user's profile. Possible keys are listed [here](https://firebase.google.com/docs/auth/ios/manage-users#update_a_users_profile).

```javascript
server.updateUserProfile({
  displayName: 'Ari Lerner'
})
  .then(res => console.log('Your profile has been updated'))
  .catch(err => console.error('There was an error :('))
```

#### deleteUser()

It's possible to delete a user completely from your account on Firebase. Calling the `deleteUser()` method will take care of this for you.

```javascript
server.deleteUser()
.then(res => console.log('Sad to see you go'))
.catch(err => console.error('There was an error - Now you are trapped!'))
```

#### signOut()

To sign the current user out, use the `signOut()` method. It accepts no parameters

```javascript
server.signOut()
.then(res => console.log('You have been signed out'))
.catch(err => console.error('Uh oh... something weird happened'))
```

#### getCurrentUser()

Although you _can_ get the current user using the `getCurrentUser()` method, it's better to use this from within the callback function provided by `listenForAuth()`. However, if you need to get the current user, call the `getCurrentUser()` method:

```javascript
server.getCurrentUser()
.then(user => console.log('The currently logged in user', user))
.catch(err => console.error('An error occurred'))
```

### Analytics

Wouldn't it be nice to send analytics about your app usage from your users? Well, you totally can! The Firebase analytics console is incredibly useful and Firestack has a method for interacting with it. You can send any event with contextual information, which automatically includes the currently logged in user using the `logEventWithName()` method. It accepts two parameters: the name of the event and an object containing any contextual information. The values should be serializable (i.e. no complex instance objects).

#### logEventWithName()

```javascript
server.logEventWithName("launch", {
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

The `setStorageUrl()` method accepts a single parameter: your root storage url.

```javascript
server.setStorageUrl(`gs://${config.firebase.storageBucket}`)
.then(() => console.log('The storage url has been set'))
.catch(() => console.error('This is weird: something happened...'))
```

#### uploadFile()

We can upload a file using the `uploadFile()` method. Using the `uploadFile()` method, we can set the name of the destination file, the path where we want to store it, as well as any metadata along with the file.

```javascript
server.uploadFile(`photos/${auth.user.uid}/${filename}`, path, {
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
  server.uploadFile(`photos/${auth.user.uid}/${filename}`, path, {
    contentType: 'image/jpeg',
    contentEncoding: 'base64',
  })
})
.catch(err => console.error(err));
```

#### storage attribute

To retrieve a stored file, we can get the url to download it from using the `storage` attribute. This method allows us to call right through to the native JavaScript object provided by the Firebase library:

```javascript
server.storage.ref(photo.fullPath)
.getDownloadURL()
  .then(url => {
    // url contains the download url
  }).catch(err => {
    console.error('Error downloading photo', err);
  })
```

### Realtime Database

#### database attribute

The native Firebase JavaScript library provides a featureful realtime database that works out of the box. Firestack provides an attribute to interact with the database without needing to configure the JS library.

```javascript
server.storage
      .ref(LIST_KEY)
      .orderByChild('timestamp')
      .on('value', snapshot => {
        if (snapshot.val()) {
          console.log('The list was updated');
        }
      });
```

### ServerValue

Firebase provides some static values based upon the server. We can use the `ServerValue` constant to retrieve these. For instance, to grab the TIMESTAMP on the server, use the `TIMESTAMP` value:

```javascript
const timestamp = server.ServerValue.TIMESTAMP
```

### Events

#### on()

We can listen to arbitrary events fired by the Firebase library using the `on()` method. The `on()` method accepts a name and a function callback:

```javascript
server.on('listenForAuth', (evt) => console.log('Got an event'));
```

#### off()

To unsubscribe to events fired by Firebase, we can call the `off()` method with the name of the event we want to unsubscribe.

```javascript
server.off('listenForAuth');
```


## TODO

The following is left to be done:

* Add Android support
