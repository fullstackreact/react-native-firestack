package io.fullstack.firestack;

import android.content.Context;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;

import java.util.List;
import java.util.ArrayList;
import java.util.Collections;

import io.fullstack.firestack.auth.FirestackAuth;
import io.fullstack.firestack.storage.FirestackStorage;
import io.fullstack.firestack.database.FirestackDatabase;
import io.fullstack.firestack.analytics.FirestackAnalytics;
import io.fullstack.firestack.messaging.FirestackMessaging;

@SuppressWarnings("unused")
public class FirestackPackage implements ReactPackage {
    private Context mContext;

    public FirestackPackage() {
    }
    /**
     * @param reactContext react application context that can be used to create modules
     * @return list of native modules to register with the newly created catalyst instance
     */
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new FirestackModule(reactContext));
        modules.add(new FirestackAuth(reactContext));
        modules.add(new FirestackDatabase(reactContext));
        modules.add(new FirestackAnalytics(reactContext));
        modules.add(new FirestackStorage(reactContext));
        modules.add(new FirestackMessaging(reactContext));
        return modules;
    }

    /**
     * @return list of JS modules to register with the newly created catalyst instance.
     * <p/>
     * IMPORTANT: Note that only modules that needs to be accessible from the native code should be
     * listed here. Also listing a native module here doesn't imply that the JS implementation of it
     * will be automatically included in the JS bundle.
     */
    @Override
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    /**
     * @param reactContext
     * @return a list of view managers that should be registered with {@link UIManagerModule}
     */
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
