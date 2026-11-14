import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  confirmResetPassword: vi.fn(),
  confirmSignUp: vi.fn(),
  fetchAuthSession: vi.fn(),
  getCurrentUser: vi.fn(),
  resendSignUpCode: vi.fn(),
  resetPassword: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
  configure: vi.fn(),
  setKeyValueStorage: vi.fn(),
}))

vi.mock('aws-amplify', () => ({ Amplify: { configure: authMocks.configure } }))
vi.mock('aws-amplify/auth', () => ({
  confirmResetPassword: authMocks.confirmResetPassword,
  confirmSignUp: authMocks.confirmSignUp,
  fetchAuthSession: authMocks.fetchAuthSession,
  getCurrentUser: authMocks.getCurrentUser,
  resendSignUpCode: authMocks.resendSignUpCode,
  resetPassword: authMocks.resetPassword,
  signIn: authMocks.signIn,
  signOut: authMocks.signOut,
  signUp: authMocks.signUp,
}))
vi.mock('aws-amplify/auth/cognito', () => ({
  cognitoUserPoolsTokenProvider: { setKeyValueStorage: authMocks.setKeyValueStorage },
}))
vi.mock('aws-amplify/utils', () => ({ sessionStorage: {} }))
vi.mock('./cognitoConfig', () => ({
  getCognitoConfig: () => ({ region: 'ap-south-1', userPoolId: 'pool-id', userPoolClientId: 'client-id' }),
}))

import {
  confirmResetPasswordWithCognito,
  confirmSignUpWithCognito,
  getAccessToken,
  getCurrentCognitoUser,
  resendSignUpCodeWithCognito,
  resetPasswordWithCognito,
  signInWithCognito,
  signOutFromCognito,
  signUpWithCognito,
} from './cognito'

describe('Cognito service', () => {
  beforeEach(() => vi.clearAllMocks())

  it('registers a user with a normalized email and full name, preserving Cognito confirmation state', async () => {
    authMocks.signUp.mockResolvedValue({ isSignUpComplete: false, nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } })
    const result = await signUpWithCognito('  Ada Lovelace  ', ' ADA@EXAMPLE.COM ', 'SafePassword1!')
    expect(authMocks.signUp).toHaveBeenCalledWith({
      username: 'ada@example.com',
      password: 'SafePassword1!',
      options: { userAttributes: { email: 'ada@example.com', name: 'Ada Lovelace' } },
    })
    expect(result.isSignUpComplete).toBe(false)
    expect(result.nextStep.signUpStep).toBe('CONFIRM_SIGN_UP')
  })

  it('confirms and can resend an email confirmation code', async () => {
    authMocks.confirmSignUp.mockResolvedValue({ isSignUpComplete: true })
    await confirmSignUpWithCognito(' ADA@EXAMPLE.COM ', ' 123456 ')
    expect(authMocks.confirmSignUp).toHaveBeenCalledWith({ username: 'ada@example.com', confirmationCode: '123456' })
    await resendSignUpCodeWithCognito(' ADA@EXAMPLE.COM ')
    expect(authMocks.resendSignUpCode).toHaveBeenCalledWith({ username: 'ada@example.com' })
  })

  it('signs in using Cognito and rejects incomplete sign-in challenges', async () => {
    const user = { userId: 'user-id', username: 'ada@example.com' }
    authMocks.signIn.mockResolvedValue({ isSignedIn: true })
    authMocks.getCurrentUser.mockResolvedValue(user)
    await expect(signInWithCognito(' ADA@EXAMPLE.COM ', 'password')).resolves.toEqual(user)
    expect(authMocks.signIn).toHaveBeenCalledWith({ username: 'ada@example.com', password: 'password' })
    authMocks.signIn.mockResolvedValueOnce({ isSignedIn: false })
    await expect(signInWithCognito('ada@example.com', 'password')).rejects.toThrow(/verification is required/i)
  })

  it('starts and confirms a password reset with Cognito', async () => {
    await resetPasswordWithCognito(' ADA@EXAMPLE.COM ')
    expect(authMocks.resetPassword).toHaveBeenCalledWith({ username: 'ada@example.com' })
    await confirmResetPasswordWithCognito(' ADA@EXAMPLE.COM ', ' 654321 ', 'NewPassword1!')
    expect(authMocks.confirmResetPassword).toHaveBeenCalledWith({
      username: 'ada@example.com', confirmationCode: '654321', newPassword: 'NewPassword1!',
    })
  })

  it('exposes the current user, access token, and sign-out helpers', async () => {
    const user = { userId: 'user-id', username: 'ada@example.com' }
    authMocks.getCurrentUser.mockResolvedValue(user)
    authMocks.fetchAuthSession.mockResolvedValue({ tokens: { accessToken: { toString: () => 'access-token' } } })
    await expect(getCurrentCognitoUser()).resolves.toEqual(user)
    await expect(getAccessToken(true)).resolves.toBe('access-token')
    expect(authMocks.fetchAuthSession).toHaveBeenCalledWith({ forceRefresh: true })
    await signOutFromCognito()
    expect(authMocks.signOut).toHaveBeenCalledOnce()
  })
})
