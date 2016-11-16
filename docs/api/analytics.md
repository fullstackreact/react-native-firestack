# Analytics

Integrating Firebase analytics is super simple using Firestack. A number of methods are provided to help tailor analytics specifically for your
own app. The Firebase SDK includes a number of pre-set events which are automatically handled, and cannot be used with custom events:

```
  'app_clear_data',
  'app_uninstall',
  'app_update',
  'error',
  'first_open',
  'in_app_purchase',
  'notification_dismiss',
  'notification_foreground',
  'notification_open',
  'notification_receive',
  'os_update',
  'session_start',
  'user_engagement',
```

#### logEvent(event: string, params?: Object)

Log a custom event with optional params. Returns a Promise.

```javascript
firestack.analytics()
  .logEvent('clicked_advert', { id: 1337 })
  .then(() => {
    console.log('Event has been logged successfully'); 
  });
```

#### setAnalyticsCollectionEnabled(enabled: boolean)

Sets whether analytics collection is enabled for this app on this device.

```javascript
firestack.analytics()
  .setAnalyticsCollectionEnabled(false);
```

#### setCurrentScreen(screenName: string, screenClassOverride: string)

Sets the current screen name, which specifies the current visual context in your app.

```javascript
firestack.analytics()
  .setCurrentScreen('user_profile');
```

#### setMinimumSessionDuration(miliseconds: number)

Sets the minimum engagement time required before starting a session. The default value is 10000 (10 seconds).

```javascript
firestack.analytics()
  .setMinimumSessionDuration(15000);
```

#### setSessionTimeoutDuration(miliseconds: number)

Sets the duration of inactivity that terminates the current session. The default value is 1800000 (30 minutes).

```javascript
firestack.analytics()
  .setSessionTimeoutDuration(900000);
```

#### setUserId(id: string)

Gives a user a uniqiue identificaition.

```javascript
const id = firestack.auth().currentUser.uid;

firestack.analytics()
  .setUserId(id);
```

#### setUserProperty(name: string, value: string)

Sets a key/value pair of data on the current user.

```javascript
firestack.analytics()
  .setUserProperty('nickname', 'foobar');
```
