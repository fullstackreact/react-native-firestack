#cloud messaging 

Make this prettier at some point but can't forget these things
setup certificates, enable push settings in app 
Add things to app delegate
appdelegate.h -> 
@import UserNotifications;
@interface AppDelegate : UIResponder <UIApplicationDelegate,UNUserNotificationCenterDelegate>

appdelegate.m
Appdidfinishwithlaunching blah blah
 UILocalNotification *localNotification = [launchOptions objectForKey:UIApplicationLaunchOptionsLocalNotificationKey];
  NSDictionary *userInfo = [launchOptions valueForKey:UIApplicationLaunchOptionsRemoteNotificationKey];

  if (localNotification) {
    [[NSNotificationCenter defaultCenter] postNotificationName:MESSAGING_MESSAGE_RECEIVED_LOCAL object:localNotification];
    NSLog(@"fresh launch from local notificaiton");
  }
  
  if(userInfo){
    [[NSNotificationCenter defaultCenter] postNotificationName:MESSAGING_MESSAGE_RECEIVED_REMOTE object:self userInfo:userInfo];
    NSLog(@"fresh launch from remote");
  }

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo {
  // If you are receiving a notification message while your app is in the background,
  // this callback will not be fired till the user taps on the notification launching the application.
  // TODO: Handle data of notification
  
  // Print full message.
  NSLog(@"%@", userInfo);
  
  [[NSNotificationCenter defaultCenter] postNotificationName:MESSAGING_MESSAGE_RECEIVED_REMOTE object:self userInfo:userInfo];
  
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(nonnull NSDictionary *)userInfo fetchCompletionHandler:(nonnull void (^)(UIBackgroundFetchResult))completionHandler{
  NSLog(@"%@", userInfo);
  if ( application.applicationState == UIApplicationStateActive ){
    //user had the app in the foreground
  }
  else {
    //app went from background to foreground
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:MESSAGING_MESSAGE_RECEIVED_REMOTE object:self userInfo:userInfo];
  completionHandler(UIBackgroundFetchResultNoData);
}

- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
  NSLog(@"%@", notification);
  [[NSNotificationCenter defaultCenter] postNotificationName:MESSAGING_MESSAGE_RECEIVED_LOCAL object:notification];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error{
  NSLog(@"Notification Registration Error %@", [error description]);
}
