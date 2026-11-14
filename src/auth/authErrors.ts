export function toAuthErrorMessage(error: unknown, operation: 'signIn' | 'signUp' | 'verify' | 'reset' = 'signIn') {
  const value = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '')
  if (/UserNotConfirmedException/i.test(value)) return 'Confirm your email address before signing in.'
  if (/NotAuthorizedException|Incorrect username or password/i.test(value)) return 'The email or password is incorrect.'
  if (/UserNotFoundException/i.test(value)) return 'No account was found for that email address.'
  if (/UsernameExistsException/i.test(value)) return 'An account already exists for this email address. Try signing in instead.'
  if (/CodeMismatchException/i.test(value)) return operation === 'verify' ? 'That verification code is incorrect.' : 'That code is incorrect. Check it and try again.'
  if (/ExpiredCodeException/i.test(value)) return 'That code has expired. Request a new code and try again.'
  if (/InvalidPasswordException|Password does not conform/i.test(value)) return 'Choose a password that meets all the listed requirements.'
  if (/LimitExceededException|TooManyRequestsException/i.test(value)) return 'Too many attempts. Wait a few minutes and try again.'
  if (/Cognito is not configured/i.test(value)) return 'Cognito is not configured for this environment.'
  return error instanceof Error && error.message ? error.message : 'We could not complete authentication. Please try again.'
}
