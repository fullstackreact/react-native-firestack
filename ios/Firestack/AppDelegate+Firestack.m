#import <objc/runtime.h>
#import "AppDelegate+Firestack.h"
#import "Firebase.h"
#import "Firestack.h"
#import "FirestackEvents.h"

@implementation AppDelegate (Firestack)

+ (void) load
{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class class = [self class];
        
        SEL originalSelector = @selector(application:didFinishLaunchingWithOptions:);
        SEL swizzledSelector = @selector(swizzled_application:didFinishLaunchingWithOptions:);
        
        Method originalMethod = class_getInstanceMethod(class, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);
        
        BOOL didAddMethod =
        class_addMethod(class,
                        originalSelector,
                        method_getImplementation(swizzledMethod),
                        method_getTypeEncoding(swizzledMethod));
        
        if (didAddMethod) {
            class_replaceMethod(class,
                                swizzledSelector,
                                method_getImplementation(originalMethod),
                                method_getTypeEncoding(originalMethod));
        } else {
            method_exchangeImplementations(originalMethod, swizzledMethod);
        }
    });
}

- (BOOL) swizzled_application:(UIApplication *) application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    BOOL res = [self swizzled_application:application didFinishLaunchingWithOptions:launchOptions];
    [FIRApp configure];
    [self setupListeners];
    [self dispatchFirestackConfigured];
    return res;
}

- (void) dealloc 
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void) setupListeners
{
    [[NSNotificationCenter defaultCenter] addObserver:self
                                         selector:@selector(firestackConfigured:)
                                             name:kFirestackInitialized
                                           object:nil];

    // Add listener for when firestack the app reloads
    [[NSNotificationCenter defaultCenter] addObserver:self
                                         selector:@selector(reloadFirestack)
                                             name:RCTReloadNotification
                                           object:nil];
}

- (void) dispatchFirestackConfigured
{
    FIROptions *opts = [[FIRApp defaultApp] options];
    NSLog(@"opts: %@", opts);
    NSLog(@"googleAppID: %@", [opts googleAppID]);
    NSLog(@"GCMSenderID: %@", [opts GCMSenderID]);
    NSLog(@"APIKey: %@", [opts APIKey]);
    NSLog(@"databaseURL: %@", [opts databaseURL]);
    NSLog(@"trackingID: %@", [opts trackingID]);
    NSLog(@"storageBucket: %@", [opts storageBucket]);
    NSLog(@"clientID: %@", [opts clientID]);
    NSLog(@"androidClientID: %@", [opts androidClientID]);
  // Post notification that we've initialized Firebase
  // [[NSNotificationCenter defaultCenter] 
  //   postNotificationName:kFirestackInitialized
  //   object:nil];
}

- (void) reloadFirestack
{
  // TODO:
}

- (void) firestackConfigured:(NSDictionary *) configuration
{
  NSLog(@"firestackConfigured: %@", configuration);
}

@end