/** @file FIRAuthErrors.h
    @brief Firebase Auth SDK
    @copyright Copyright 2015 Google Inc.
    @remarks Use of this SDK is subject to the Google APIs Terms of Service:
        https://developers.google.com/terms/
 */

#import <Foundation/Foundation.h>

/** @var FIRAuthErrorDomain
    @brief The Firebase Auth error domain.
 */
extern NSString *const FIRAuthErrorDomain;

/** @var FIRAuthErrorNameKey
    @brief The name of the key for the "error_name" string in the NSError userinfo dictionary.
 */
extern NSString *const FIRAuthErrorNameKey;

/** @var FIRAuthErrorCode
    @brief Error codes used by Firebase Auth.
 */
typedef NS_ENUM(NSInteger, FIRAuthErrorCode) {
  /** @var FIRAuthErrorCodeInvalidCustomToken
      @brief Indicates a validation error with the custom token.
   */
  FIRAuthErrorCodeInvalidCustomToken = 17000,

  /** @var FIRAuthErrorCodeCustomTokenMismatch
      @brief Indicates the service account and the API key belong to different projects.
   */
  FIRAuthErrorCodeCustomTokenMismatch = 17002,

  /** @var FIRAuthErrorCodeInvalidCredential
      @brief Indicates the IDP token or requestUri is invalid.
   */
  FIRAuthErrorCodeInvalidCredential = 17004,

  /** @var FIRAuthErrorCodeUserDisabled
      @brief Indicates the user's account is disabled on the server side.
   */
  FIRAuthErrorCodeUserDisabled = 17005,

  /** @var FIRAuthErrorCodeOperationNotAllowed
      @brief Indicates the administrator disabled sign in with the specified identity provider.
   */
  FIRAuthErrorCodeOperationNotAllowed = 17006,

  /** @var FIRAuthErrorCodeEmailAlreadyInUse
      @brief Indicates the email used to attempt a sign up already exists.
   */
  FIRAuthErrorCodeEmailAlreadyInUse = 17007,

  /** @var FIRAuthErrorCodeInvalidEmail
      @brief Indicates the email is invalid.
  */
  FIRAuthErrorCodeInvalidEmail = 17008,

  /** @var FIRAuthErrorCodeWrongPassword
      @brief Indicates the user attempted sign in with a wrong password.
   */
  FIRAuthErrorCodeWrongPassword = 17009,

  /** @var FIRAuthErrorCodeTooManyRequests
      @brief Indicates that too many requests were made to a serve method.
   */
  FIRAuthErrorCodeTooManyRequests = 17010,

  /** @var FIRAuthErrorCodeUserNotFound
      @brief Indicates the user account was been found.
   */
  FIRAuthErrorCodeUserNotFound = 17011,

  /** @var FIRAuthErrrorCodeAccountExistsWithDifferentCredential
      @brief Indicates account linking is needed.
   */
  FIRAuthErrrorCodeAccountExistsWithDifferentCredential = 17012,

  /** @var FIRAuthErrorCodeRequiresRecentLogin
      @brief Indicates the user has attemped to change email or password more than 5 minutes after
          signing in.
   */
  FIRAuthErrorCodeRequiresRecentLogin = 17014,

  /** @var FIRAuthErrorCodeProviderAlreadyLinked
      @brief Indicates an attempt to link a provider to which we are already linked.
   */
  FIRAuthErrorCodeProviderAlreadyLinked = 17015,

  /** @var FIRAuthErrorCodeNoSuchProvider
      @brief Indicates an attempt to unlink a provider that is not linked.
   */
  FIRAuthErrorCodeNoSuchProvider = 17016,

  /** @var FIRAuthErrorCodeInvalidUserToken
      @brief Indicates user's saved auth credential is invalid, the user needs to sign in again.
   */
  FIRAuthErrorCodeInvalidUserToken = 17017,

  /** @var FIRAuthErrorCodeNetworkError
      @brief Indicates a network error occurred (such as a timeout, interrupted connection, or
          unreachable host.)
      @remarks These types of errors are often recoverable with a retry.

          The @c NSUnderlyingError field in the @c NSError.userInfo dictionary will contain the
          error encountered.
   */
  FIRAuthErrorCodeNetworkError = 17020,

  /** @var FIRAuthErrorCodeUserTokenExpired
      @brief Indicates the saved token has expired, for example, the user may have changed account
          password on another device. The user needs to sign in again on this device.
   */
  FIRAuthErrorCodeUserTokenExpired = 17021,

  /** @var FIRAuthErrorCodeInvalidAPIKey
      @brief Indicates an invalid API key was supplied in the request.
   */
  FIRAuthErrorCodeInvalidAPIKey = 17023,

  /** @var FIRAuthErrorCodeUserMismatch
      @brief Indicates that user attempted to reauthenticate with a user other than the current
          user.
   */
  FIRAuthErrorCodeUserMismatch = 17024,

  /** @var FIRAuthErrorCodeCredentialAlreadyInUse
      @brief Indicates an attempt to link with a credential that has already been linked with a
          different Firebase account.
   */
  FIRAuthErrorCodeCredentialAlreadyInUse = 17025,

  /** @var FIRAuthErrorCodeWeakPassword
      @brief Indicates an attempt to set a password that is considered too weak.
      @remarks The @c NSLocalizedFailureReasonErrorKey field in the @c NSError.userInfo dictionary
          will contain more detailed explanation that can be shown to the user.
   */
  FIRAuthErrorCodeWeakPassword = 17026,

  /** @var FIRAuthErrorCodeAppNotAuthorized
      @brief Indicates the App is not authorized to use Firebase Authentication with the
          provided API Key.
   */
  FIRAuthErrorCodeAppNotAuthorized = 17028,

  /** @var FIRAuthErrorCodeKeychainError
      @brief Indicated an error occurred for accessing the keychain.
      @remarks The @c NSLocalizedFailureReasonErrorKey field in the @c NSError.userInfo dictionary
          will contain more information about the error encountered.
   */
  FIRAuthErrorCodeKeychainError = 17995,

  /** @var FIRAuthErrorCodeInternalError
      @brief Indicates an internal error occurred.
      @remarks The @c NSUnderlyingError field in the @c NSError.userInfo dictionary will contain the
          error encountered.
   */
  FIRAuthErrorCodeInternalError = 17999,
};
