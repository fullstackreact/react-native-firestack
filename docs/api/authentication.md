# Authentication

Firestack handles authentication for us out of the box, both with email/password-based authentication and through oauth providers (with a separate library to handle oauth providers).

> Android requires the Google Play services to installed for authentication to function.

## Local Auth

#### [onAuthStateChanged()](https://firebase.google.com/docs/reference/js/firebase.auth.Auth#onAuthStateChanged)

Listen for changes in the users auth state (logging in and out).

```javascript
firestack.auth().onAuthStateChanged((evt) => {
  // evt is the authentication event, it contains an `error` key for carrying the
  // error message in case of an error and a `user` key upon successful authentication
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

#### offAuthStateChanged()

Remove the `onAuthStateChanged` listener. 
This is important to release resources from our app when we don't need to hold on to the listener any longer.

```javascript
firestack.auth().offAuthStateChanged()
```

#### [createUserWithEmailAndPassword()](https://firebase.google.com/docs/reference/js/firebase.auth.Auth#createUserWithEmailAndPassword)

We can create a user by calling the `createUserWithEmailAndPassword()` function. 
The method accepts two parameters, an email and a password.

```javascript
firestack.auth().createUserWithEmailAndPassword('ari@fullstack.io', '123456')
  .then((user) => {
    console.log('user created', user)
  })
  .catch((err) => {
    console.error('An error occurred', err);
  })
```

#### [signInWithEmailAndPassword()](https://firebase.google.com/docs/reference/js/firebase.auth.Auth#signInWithEmailAndPassword)

To sign a user in with their email and password, use the `signInWithEmailAndPassword()` function. 
It accepts two parameters, the user's email and password:

```javascript
firestack.auth().signInWithEmailAndPassword('ari@fullstack.io', '123456')
  .then((user) => {
    console.log('User successfully logged in', user)
  })
  .catch((err) => {
    console.error('User signin error', err);
  })
```

#### [signInAnonymously()](https://firebase.google.com/docs/reference/js/firebase.auth.Auth#signInAnonymously)

Sign an anonymous user. If the user has already signed in, that user will be returned.

```javascript
firestack.auth().signInAnonymously()
  .then((user) => {
    console.log('Anonymous user successfully logged in', user)
  })
  .catch((err) => {
    console.error('Anonymous user signin error', err);
  })
```

#### signInWithProvider()

We can use an external authentication provider, such as twitter/facebook for authentication. In order to use an external provider, we need to include another library to handle authentication.

> By using a separate library, we can keep our dependencies a little lower and the size of the application down.

#### signInWithCustomToken()

To sign a user using a self-signed custom token, use the `signInWithCustomToken()` function. It accepts one parameter, the custom token:

```javascript
firestack.auth().signInWithCustomToken(TOKEN)
  .then((user) => {
    console.log('User successfully logged in', user)
  })
  .catch((err) => {
    console.error('User signin error', err);
  })
```

#### [updateUserEmail()](https://firebase.google.com/docs/reference/js/firebase.User#updateEmail)

We can update the current user's email by using the command: `updateUserEmail()`. 
It accepts a single argument: the user's new email:

```javascript
firestack.auth().updateUserEmail('ari+rocks@fullstack.io')
  .then((res) => console.log('Updated user email'))
  .catch(err => console.error('There was an error updating user email'))
```

#### [updateUserPassword()](https://firebase.google.com/docs/reference/js/firebase.User#updatePassword)

We can update the current user's password using the `updateUserPassword()` method. 
It accepts a single parameter: the new password for the current user

```javascript
firestack.auth().updateUserPassword('somethingReallyS3cr3t733t')
  .then(res => console.log('Updated user password'))
  .catch(err => console.error('There was an error updating your password'))
```

#### [updateUserProfile()](https://firebase.google.com/docs/auth/web/manage-users#update_a_users_profile)

To update the current user's profile, we can call the `updateUserProfile()` method.
It accepts a single parameter:

* object which contains updated key/values for the user's profile. 
Possible keys are listed [here](https://firebase.google.com/docs/auth/ios/manage-users#update_a_users_profile).

```javascript
firestack.auth()
  .updateUserProfile({
    displayName: 'Ari Lerner'
  })
  .then(res => console.log('Your profile has been updated'))
  .catch(err => console.error('There was an error :('))
```

#### [sendPasswordResetWithEmail()](https://firebase.google.com/docs/auth/web/manage-users#send_a_password_reset_email)

To send a password reset for a user based upon their email, we can call the `sendPasswordResetWithEmail()` method. 
It accepts a single parameter: the email of the user to send a reset email.

```javascript
firestack.auth().sendPasswordResetWithEmail('ari+rocks@fullstack.io')
  .then(res => console.log('Check your inbox for further instructions'))
  .catch(err => console.error('There was an error :('))
```
#### [deleteUser()](https://firebase.google.com/docs/auth/web/manage-users#delete_a_user)

It's possible to delete a user completely from your account on Firebase.
Calling the `deleteUser()` method will take care of this for you.

```javascript
firestack.auth()
  .deleteUser()
  .then(res => console.log('Sad to see you go'))
  .catch(err => console.error('There was an error - Now you are trapped!'))
```

#### getToken()

If you want user's token, use `getToken()` method.

```javascript
firestack.auth()
  .getToken()
  .then(res => console.log(res.token))
  .catch(err => console.error('error'))
```

#### [signOut()](https://firebase.google.com/docs/reference/js/firebase.auth.Auth#signOut)

To sign the current user out, use the `signOut()` method.
It accepts no parameters

```javascript
firestack.auth()
  .signOut()
  .then(res => console.log('You have been signed out'))
  .catch(err => console.error('Uh oh... something weird happened'))
```


#### getCurrentUser()

Although you _can_ get the current user using the `getCurrentUser()` method, it's better to use this from within the callback function provided by `listenForAuth()`. 
However, if you need to get the current user, call the `getCurrentUser()` method:

```javascript
firestack.auth()
  .getCurrentUser()
  .then(user => console.log('The currently logged in user', user))
  .catch(err => console.error('An error occurred'))
```

## Social Auth

TODO 
