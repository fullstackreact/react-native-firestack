/** @file FIRAuth.h
    @brief Firebase Auth SDK
    @copyright Copyright 2015 Google Inc.
    @remarks Use of this SDK is subject to the Google APIs Terms of Service:
        https://developers.google.com/terms/
 */

#import <Foundation/Foundation.h>

#import <FirebaseAuth/FIRAuthErrors.h>

@class FIRApp;
@class FIRAuth;
@class FIRAuthCredential;
@class FIRUser;
@protocol FIRAuthStateListener;

NS_ASSUME_NONNULL_BEGIN

/** @typedef FIRAuthStateDidChangeListenerHandle
    @brief The type of handle returned by @c FIRAuth.addAuthStateDidChangeListener:.
 */
typedef id<NSObject> FIRAuthStateDidChangeListenerHandle;

/** @typedef FIRAuthStateDidChangeListenerBlock
    @brief The type of block which can be registered as a listener for auth state did change events.
    @param auth The @c FIRAuth object on which state changes occurred.
    @param user Optionally; the current signed in user, if any.
 */
typedef void(^FIRAuthStateDidChangeListenerBlock)(FIRAuth *auth, FIRUser *_Nullable user);

/** @var FIRAuthStateDidChangeNotification
    @brief The name of the @c NSNotificationCenter notification which is posted when the auth state
        changes (for example, a new token has been produced, a user signs in or signs out). The
        object parameter of the notification is the sender @c FIRAuth instance.
 */
extern NSString *const FIRAuthStateDidChangeNotification;

/** @typedef FIRAuthResultCallback
    @brief The type of block invoked when sign-in related events complete.
    @param user Optionally; the signed in user, if any.
    @param error Optionally; if an error occurs, this is the NSError object that describes the
        problem. Set to nil otherwise.
 */
typedef void (^FIRAuthResultCallback)(FIRUser *_Nullable user, NSError *_Nullable error);

/** @typedef FIRProviderQueryCallback
    @brief The type of block invoked when a list of identity providers for a given email address is
        requested.
    @param providers Optionally; a list of provider identifiers, if any.
        @see FIRGoogleAuthProviderID etc.
    @param error Optionally; if an error occurs, this is the NSError object that describes the
        problem. Set to nil otherwise.
 */
typedef void (^FIRProviderQueryCallback)(NSArray<NSString *> *_Nullable providers,
                                         NSError *_Nullable error);

/** @typedef FIRSendPasswordResetCallback
    @brief The type of block invoked when initiating a password reset.
    @param error Optionally; if an error occurs, this is the NSError object that describes the
        problem. Set to nil otherwise.
 */
typedef void (^FIRSendPasswordResetCallback)(NSError *_Nullable error);

/** @class FIRAuth
    @brief Manages authentication for Firebase apps.
    @remarks This class is thread-safe.
 */
@interface FIRAuth : NSObject

/** @fn auth
    @brief Gets the auth object for the default Firebase app.
    @remarks Thread safe.
 */
+ (nullable FIRAuth *)auth NS_SWIFT_NAME(auth());

/** @fn authWithApp:
    @brief Gets the auth object for a @c FIRApp.
    @param app The @c FIRApp for which to retrieve the associated @c FIRAuth instance.
    @return The @c FIRAuth instance associated with the given @c FIRApp.
 */
+ (nullable FIRAuth *)authWithApp:(FIRApp *)app;

/** @property app
    @brief Gets the @c FIRApp object that this auth object is connected to.
 */
@property(nonatomic, weak, readonly, nullable) FIRApp *app;

/** @property currentUser
    @brief Synchronously gets the cached current user, or null if there is none.
 */
@property(nonatomic, strong, readonly, nullable) FIRUser *currentUser;

/** @fn init
    @brief Please access auth instances using @c FIRAuth.auth and @c FIRAuth.authForApp:.
 */
- (nullable instancetype)init NS_UNAVAILABLE;

/** @fn fetchProvidersForEmail:completion:
    @brief Fetches the list of IdPs that can be used for signing in with the provided email address.
        Useful for an "identifier-first" sign-in flow.
    @param email The email address for which to obtain a list of identity providers.
    @param completion Optionally; a block which is invoked when the list of providers for the
        specified email address is ready or an error was encountered. Invoked asynchronously on the
        main thread in the future.
 */
- (void)fetchProvidersForEmail:(NSString *)email
                    completion:(nullable FIRProviderQueryCallback)completion;

/** @fn signInWithEmail:password:completion:
    @brief Signs in using an email address and password.
    @param email The user's email address.
    @param password The user's password.
    @param completion Optionally; a block which is invoked when the sign in flow finishes, or is
        canceled. Invoked asynchronously on the main thread in the future.
 */
- (void)signInWithEmail:(NSString *)email
               password:(NSString *)password
             completion:(nullable FIRAuthResultCallback)completion;

/** @fn signInWithCredential:completion:
    @brief Asynchronously signs in to Firebase with the given 3rd-party credentials (e.g. a Facebook
        login Access Token, a Google ID Token/Access Token pair, etc.)
    @param credential The credential supplied by the IdP.
    @param completion Optionally; a block which is invoked when the sign in finishes, or is
        canceled. Invoked asynchronously on the main thread in the future.
 */
- (void)signInWithCredential:(FIRAuthCredential *)credential
                  completion:(nullable FIRAuthResultCallback)completion;

/** @fn signInAnonymouslyWithCompletion:
    @brief Asynchronously creates and becomes an anonymous user.
    @param completion Optionally; a block which is invoked when the sign in finishes, or is
        canceled. Invoked asynchronously on the main thread in the future.
    @remarks If there is already an anonymous user signed in, that user will be returned instead.
        If there is any other existing user signed in, that user will be signed out.
 */
- (void)signInAnonymouslyWithCompletion:(nullable FIRAuthResultCallback)completion;

/** @fn signInWithCustomToken:completion:
    @brief Asynchronously signs in to Firebase with the given Auth token.
    @param token A self-signed custom auth token.
    @param completion Optionally; a block which is invoked when the sign in finishes, or is
        canceled. Invoked asynchronously on the main thread in the future.
 */
- (void)signInWithCustomToken:(NSString *)token
                   completion:(nullable FIRAuthResultCallback)completion;

/** @fn createUserWithEmail:password:completion:
    @brief Creates and, on success, signs in a user with the given email address and password.
    @param email The user's email address.
    @param password The user's desired password.
    @param completion Optionally; a block which is invoked when the sign up finishes, or is
        canceled. Invoked asynchronously on the main thread in the future.
 */
- (void)createUserWithEmail:(NSString *)email
                   password:(NSString *)password
                 completion:(nullable FIRAuthResultCallback)completion;

/** @fn sendPasswordResetWithEmail:completion:
    @brief Initiates a password reset for the given email address.
    @param email The email address of the user.
    @param completion Optionally; a block which is invoked when the request finishes. Invoked
        asynchronously on the main thread in the future.
 */
- (void)sendPasswordResetWithEmail:(NSString *)email
                        completion:(nullable FIRSendPasswordResetCallback)completion;

/** @fn signOut:
    @brief Signs out the current user.
    @param error Optionally; if an error occurs, upon return contains an NSError object that
        describes the problem; is nil otherwise.
    @return @YES when the sign out request was successful. @NO otherwise.
 */
- (BOOL)signOut:(NSError *_Nullable *_Nullable)error;

/** @fn addAuthStateDidChangeListener:
    @brief Registers a block as an "auth state did change" listener. To be invoked when:
      - The block is registered as a listener,
      - The current user changes, or,
      - The current user's access token changes.
    @param listener The block to be invoked. The block is always invoked asynchronously on the main
        thread, even for it's initial invocation after having been added as a listener.
    @remarks The block is invoked immediately after adding it according to it's standard invocation
        semantics, asynchronously on the main thread. Users should pay special attention to
        making sure the block does not inadvertently retain objects which should not be retained by
        the long-lived block. The block itself will be retained by @c FIRAuth until it is
        unregistered or until the @c FIRAuth instance is otherwise deallocated.
    @return A handle useful for manually unregistering the block as a listener.
 */
- (FIRAuthStateDidChangeListenerHandle)addAuthStateDidChangeListener:
    (FIRAuthStateDidChangeListenerBlock)listener;

/** @fn removeAuthStateDidChangeListener:
    @brief Unregisters a block as an "auth state did change" listener.
    @param listenerHandle The handle for the listener.
 */
- (void)removeAuthStateDidChangeListener:(FIRAuthStateDidChangeListenerHandle)listenerHandle;

@end

NS_ASSUME_NONNULL_END
