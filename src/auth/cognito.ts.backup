import { Amplify } from 'aws-amplify'
import {
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
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

  // Amplify's token provider owns refresh-token handling. Session storage keeps
  // the browser session restorable within a tab without persisting tokens in
  // localStorage. The backend remains the source of identity and authorization.
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
  if (!configureCognito()) throw new Error('Cognito is not configured for this environment.')
  const result = await signIn({ username: username.trim(), password })
  if (!result.isSignedIn) throw new Error('Additional Cognito sign-in verification is required.')
  return getCurrentUser()
}

export async function signOutFromCognito() {
  if (!configureCognito()) return
  await signOut()
}
