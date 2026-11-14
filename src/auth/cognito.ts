import { Amplify } from 'aws-amplify'
import {
  confirmResetPassword,
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  resendSignUpCode,
  resetPassword,
  signIn,
  signOut,
  signUp,
  type AuthUser,
} from 'aws-amplify/auth'
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito'
import { sessionStorage } from 'aws-amplify/utils'
import { getCognitoConfig } from './cognitoConfig'

let configured = false

export function isCognitoConfigured() {
  return Boolean(getCognitoConfig())
}

function configureCognito() {
  if (configured) return true
  const config = getCognitoConfig()
  if (!config) return false

  cognitoUserPoolsTokenProvider.setKeyValueStorage(sessionStorage)
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        loginWith: { email: true },
      },
    },
  })
  configured = true
  return true
}

function requireCognito() {
  if (!configureCognito()) {
    throw new Error('Cognito is not configured for this environment.')
  }
}

export function getCurrentCognitoUser(): Promise<AuthUser | undefined> {
  if (!configureCognito()) return Promise.resolve(undefined)
  return getCurrentUser().catch(() => undefined)
}

export async function getAccessToken(forceRefresh = false) {
  if (!configureCognito()) return undefined
  try {
    const session = await fetchAuthSession({ forceRefresh })
    return session.tokens?.accessToken.toString()
  } catch {
    return undefined
  }
}

export async function signInWithCognito(username: string, password: string) {
  requireCognito()
  const result = await signIn({ username: username.trim().toLowerCase(), password })
  if (!result.isSignedIn) {
    throw new Error('Additional Cognito sign-in verification is required.')
  }
  return getCurrentUser()
}

export async function signUpWithCognito(name: string, email: string, password: string) {
  requireCognito()
  return signUp({
    username: email.trim().toLowerCase(),
    password,
    options: {
      userAttributes: {
        email: email.trim().toLowerCase(),
        name: name.trim(),
      },
    },
  })
}

export async function confirmSignUpWithCognito(email: string, code: string) {
  requireCognito()
  return confirmSignUp({
    username: email.trim().toLowerCase(),
    confirmationCode: code.trim(),
  })
}

export async function resendSignUpCodeWithCognito(email: string) {
  requireCognito()
  return resendSignUpCode({ username: email.trim().toLowerCase() })
}

export async function resetPasswordWithCognito(email: string) {
  requireCognito()
  return resetPassword({ username: email.trim().toLowerCase() })
}

export async function confirmResetPasswordWithCognito(
  email: string,
  code: string,
  newPassword: string,
) {
  requireCognito()
  return confirmResetPassword({
    username: email.trim().toLowerCase(),
    confirmationCode: code.trim(),
    newPassword,
  })
}

export async function signOutFromCognito() {
  if (!configureCognito()) return
  await signOut()
}
