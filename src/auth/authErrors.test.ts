import { describe, expect, it } from 'vitest'
import { toAuthErrorMessage } from './authErrors'

describe('Cognito error messages', () => {
  it('explains unverified accounts and invalid credentials', () => {
    expect(toAuthErrorMessage(new Error('UserNotConfirmedException'))).toMatch(/confirm your email/i)
    expect(toAuthErrorMessage(new Error('NotAuthorizedException'))).toMatch(/email or password is incorrect/i)
  })

  it('explains verification, reset code and password errors', () => {
    expect(toAuthErrorMessage(new Error('CodeMismatchException'), 'verify')).toMatch(/verification code is incorrect/i)
    expect(toAuthErrorMessage(new Error('ExpiredCodeException'), 'reset')).toMatch(/expired/i)
    expect(toAuthErrorMessage(new Error('InvalidPasswordException'), 'signUp')).toMatch(/password/i)
  })
})
