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
// ...

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

We can use an external authentication provider, such as twitter/facebook for authentication. In order to use an external provider, we need to include another library.

...

#### updateUserEmail()

...

#### updateUserProfile()

...

#### signOut()

...

#### getCurrentUser()

...

### Analytics

#### logEventWithName()

...

### Storage

#### setStorageUrl()

...

#### uploadFile()

...

#### storage attribute

...

### Realtime Database

#### database attribute

...

### ServerValue

Firebase provides some static values based upon the server. We can use the `ServerValue` constant to retrieve these. For instance, to grab the TIMESTAMP on the server, use the `TIMESTAMP` value:

```javascript
const timestamp = server.ServerValue.TIMESTAMP
```

### Events

#### on()

...

#### off()

...

## API Documentation



## TODO

The following is left to be done:

* Add Android support
