# Android Installation

The simplest way of installing on Android is to use React Native linker:

```
react-native link react-native-firestack
```

## Manually

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
          new FirestackPackage()  // <-- Add this line
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
