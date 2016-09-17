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
    return res;
}

- (void) dealloc 
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void) setupListeners
{
    // Post notification that we've initialized Firebase
    [[NSNotificationCenter defaultCenter] 
      postNotificationName:kFirestackInitialized
      object:nil];

    // Add listener for when firestack the app reloads
    [[NSNotificationCenter defaultCenter] addObserver:self
                                         selector:@selector(reloadFirestack)
                                             name:RCTReloadNotification
                                           object:nil];
}

- (void) reloadFirestack
{
  // TODO:
}

@end