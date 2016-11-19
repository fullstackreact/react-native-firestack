# Firestack

Firestack makes using the latest [Firebase](http://firebase.com) with React Native straight-forward.

```
npm i react-native-firestack --save
```

[![Gitter](https://badges.gitter.im/fullstackreact/react-native-firestack.svg)](https://gitter.im/fullstackreact/react-native-firestack?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![npm version](https://img.shields.io/npm/v/react-native-firestack.svg)](https://www.npmjs.com/package/react-native-firestack)
[![License](https://img.shields.io/npm/l/react-native-firestack.svg)](/LICENSE)

Firestack is a _light-weight_ layer sitting on-top of the native Firebase libraries for both iOS and Android which mirrors the React Native JS api as closely as possible.

Featuring; authentication, storage, real-time database, presence, analytics, cloud messaging, remote configuration, redux support and more!

## Firestack vs Firebase JS lib

Although the [Firebase](https://www.npmjs.com/package/firebase) JavaScript library will work with React Native, it is mainly designed for the web. 

The native SDK's are much better for performance compared to the web SDK. The web SDK will run on the same thread as your apps ([JS thread](https://facebook.github.io/react-native/docs/performance.html#javascript-frame-rate)) therefore limiting your JS framerate, potentially affecting things touch events and transitions/animations.

The native SDK's also contains functionality that the web SDK's do not, for example [Analytics](/docs/api/analytics.md) and [Remote Config](/docs/api/remote-config.md).

## Example app

We have a working application example available in at [fullstackreact/FirestackApp](https://github.com/fullstackreact/FirestackApp). Check it out for more details about how to use Firestack.

## Documentation

* Installation
  * [iOS](docs/installation.ios.md)
  * [Android](docs/installation.android.md)
* [Firebase Setup](docs/firebase-setup.md)
* API
  * [Authentication](docs/api/authentication.md)
  * [Analytics](docs/api/analytics.md)
  * [Storage](docs/api/storage.md)
  * [Realtime Database](docs/api/database.md)
  * [Presence](docs/api/presence.md)
  * [ServerValue](docs/api/server-value.md)
  * [Cloud Messaging](docs/api/cloud-messaging.md)
  * [Remote Config](docs/api/remote-config.md)
  * [Events](docs/api/events.md)
* [Redux](docs/redux.md)

## Contributing

For a detailed discussion of how Firestack works as well as how to contribute, check out our [contribution guide](https://github.com/fullstackreact/react-native-firestack/blob/master/Contributing.md).
