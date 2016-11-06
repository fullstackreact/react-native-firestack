## Firestack

Firestack makes using the latest [Firebase](http://firebase.com) with React Native straight-forward.

[![Gitter](https://badges.gitter.im/fullstackreact/react-native-firestack.svg)](https://gitter.im/fullstackreact/react-native-firestack?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![npm version](https://img.shields.io/npm/v/react-native-firestack.svg)](https://www.npmjs.com/package/react-native-firestack)
[![License](https://img.shields.io/npm/l/react-native-firestack.svg)](/LICENSE)

Firestack is a _light-weight_ layer sitting on-top of the native Firebase libraries for both iOS and Android which mirrors the React Native JS api as closely as possible. It features:

* Authentication
* Storage
  * upload/download files
  * download urls
* Real-time database
* Presence
* Analytics
* Cloud Messaging (currently Android only)
* Remote configuration
* Redux support (not required)

## Firestack vs Firebase JS lib

Although the [Firebase](https://www.npmjs.com/package/firebase) JavaScript library will work with React Native, it's designed for the web and/or server. The native SDKs provide much needed features specifically for mobile applications such as offline persistance. Firestack provides a JavaScript interface into the native SDKs to allow your React Native application to utilise these features, and more!

## Example app

We have a working application example available in at [fullstackreact/FirestackApp](https://github.com/fullstackreact/FirestackApp). Check it out for more details about how to use Firestack.

## Documentation

* Installation
  * iOS
  * Android
* Firebase Setup
* API
  * Authentication
  * Analytics
  * Storage
  * Realtime Database
  * Presence
  * ServerValue
  * Cloud Messaging
  * Events
* Redux

## Contributing

For a detailed discussion of how Firestack works as well as how to contribute, check out our [contribution guide](https://github.com/fullstackreact/react-native-firestack/blob/master/Contributing.md).
