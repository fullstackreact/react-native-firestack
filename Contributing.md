## Contributing guide

This is an in-progress guide to help guide you in understanding how Firestack works with the goal to help on-board your contributions. If you have any questions, comments, or concerns, feel free to leave it here or join the [gitter channel at https://gitter.im/fullstackreact/react-native-firestack](https://gitter.im/fullstackreact/react-native-firestack).

## Contribution methods

Contributing is easy. Make a fork of the project on [github](https://github.com/fullstackreact/react-native-firestack). Clone this repo on your machine and work on the edits there. 

```shell
git clone https://github.com/[your_name]/react-native-firestack.git
cd react-native-firestack
npm install
```

We have an [Example app - FirestackApp](https://github.com/fullstackreact/FirestackApp) which we use to demonstrate and test features (until we can get a proper testing environment). Currently, our workflow looks like this:

1. Write JS/native feature
2. `rsync` the local library to your `node_modules` directory (react-native does not play well with symlinks).
For instance, running the following in the firestackApp root directory. Make sure you replace the `~/Development/react-native/mine/react-native-firestack` with the path of your cloned repo on your drive:

```javascript
rsync -avhW --delete \
      --exclude='node_modules' \
      --exclude='.git' \
      --exclude='coverage' \
      ~/Development/react-native/mine/react-native-firestack/ \
      ./node_modules/react-native-firestack/
```

3. Test in-app
4. Update README.md with bugfix/feature
5. Create a pull request (PR)

## High level

## How it works technically

Firestack is broken up by functional modules which control/interact with the different features of Firebase. I.e. there is a database module, which maps to the Real-Time Database feature in Firebase, Analytics maps to the Firebase analytics stack.

When the user creates a new instance of Firestack, they are creating an instance of the JS class defined in `lib/firestack.js`. 

```javascript
// This creates a JS instance of the 
// Firestack class
const firestack = new Firestack({});
```

Each of the modules in Firestack can be accessed through this instance. For instance, when we want to access the real-time database through the `firestack` instance, the JS API exposes a `database` accessor. 

For instance, when interacting with the database from the instance above, we would call `.database` to get access to a singleton instance of the JS `Database` class defined in `lib/modules/database.js`.

### Database walk-through

```javascript
const db = firestack.database;
```

The `lib/modules/database.js` file exports two classes, one called `Database` and the other called `DatabaseRef`. Essentially, the `Database` class is a wrapper class that provides a handful of methods to forward off to a `DatabaseRef` instance. 

The `DatabaseRef` class defines the actual interaction with the native Firebase SDK. Let's look at the `getAt` method as an example of how the JS side interacts with the native-side and back.

When the user accessess a Firebase ref, the `Database` instance creates a new instance of the `DatabaseRef` JS class. 

```javascript
const ref = db.ref('/events');
```

The `DatabaseRef` class is the wrapper that maps to Firebase database points. For efficiency, the `paths` are stored as an array so we can walk up and down the firebase database using the `parent()` and `child()` methods on a database ref.

Calling `getAt()` on the `ref` (an instance of the `DatabaseRef` class) will make a call to the **native** SDK using a method called `promisify()`

```javascript
class DatabaseRef {
  // ...
  getAt(key) {
    let path = this.path;
    if (key && typeof(key) == 'string') {
      path = `${path}${separator}${key}`
    }
    return promisify('onOnce', FirestackDatabase)(path);
  }
}
```

Ignoring the first few lines (which are helpers to add to the `path`, which we'll look at shortly), the `promisify()` function (defined in `lib/promisify.js`) takes two arguments:

1. The 'string' name of the native function to call
2. The native module we want to call it on

The `promisify()` function returns a function that returns a `Promise` object in JS. This returned function calls the native function with a React-Native callback. When the React Native function calls the callback function, the Promise is resolved.

Getting back to the Database example, the `getAt()` function (which has an alias of `get`) calls the `onOnce` function on the `FirestackDatabase` native module. Each platform has their own native module version for each feature area of Firebase. 

Every function on the `DatabaseRef` class is called with the `path` from Firebase as well as it's other options. 

Let's look at the `onOnce` function of the iOS version of `FirestackDatabase` implemented in `ios/Firestack/FirestackDatabase.m`:

```
// This might differ from the current code, but
// is implemented this way at the time of the writing
// of this document
RCT_EXPORT_METHOD(onOnce:(NSString *) path
                  name:(NSString *) name
                  callback:(RCTResponseSenderBlock) callback)
{
    int eventType = [self eventTypeFromName:name];
    
    FIRDatabaseReference *ref = [self getRefAtPath:path];
    [ref observeSingleEventOfType:eventType
                        withBlock:^(FIRDataSnapshot * _Nonnull snapshot) {
                            callback(@[[NSNull null], [self snapshotToDict:snapshot]]);
                        }
                  withCancelBlock:^(NSError * _Nonnull error) {
                      NSLog(@"Error onDBEventOnce: %@", [error debugDescription]);
                      callback(@[@{
                                     @"error": @"onceError",
                                     @"msg": [error debugDescription]
                                     }]);
                  }];
}
```

Every native function (in either iOS or Android) is expected to accept a single callback as the final argument. The `onOnce` function accepts the path (as the first argument) and the name of the event we're interested in (such as `value`) and uses the Native SDK to set up the appropriate functionality. When the function has been called and completed, the callback is called with an error on failure and with success on success. 

> An error response is considered one which the first argument is non-null. Therefore, to send a successful response, the first value when calling the callback should be null to indicate success.

## Adding functionality 

// TODO