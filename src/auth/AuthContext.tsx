import { useCallback, useEffect, useMemo, useState } from 'react'
import { configureApiAuthSession } from '../services/apiClient'
import { getAccessToken, getCurrentCognitoUser, isCognitoConfigured, signInWithCognito, signOutFromCognito } from './cognito'
import { resolveAuthStatus } from './authState'
import { AuthContext, type AuthProviderProps, type AuthContextValue, type AuthStatus } from './context'
import type { AuthUser } from 'aws-amplify/auth'

function authErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return 'We could not complete authentication. Please try again.'
}

export function AuthProvider({ children }: AuthProviderProps) {
  const configured = isCognitoConfigured()
  const [status, setStatus] = useState<AuthStatus>(configured ? 'loading' : resolveAuthStatus(false, false, false))
  const [user, setUser] = useState<AuthUser>()
  const [error, setError] = useState<string>()

  const syncSession = useCallback(async () => {
    if (!configured) {
      setUser(undefined)
      return
    }
    const currentUser = await getCurrentCognitoUser()
    const accessToken = currentUser ? await getAccessToken() : undefined
    if (currentUser && accessToken) {
      setUser(currentUser)
      setStatus(resolveAuthStatus(true, true, true))
    } else {
      setUser(undefined)
      setStatus(resolveAuthStatus(true, false, false))
    }
  }, [configured])

  useEffect(() => {
    configureApiAuthSession(configured ? {
      getAccessToken: () => getAccessToken(),
      refreshAccessToken: () => getAccessToken(true),
      clearSession: () => {
        void signOutFromCognito()
        setUser(undefined)
        setStatus(resolveAuthStatus(true, false, false))
        setError('Your session has expired. Please sign in again.')
      },
    } : undefined)
    if (!configured) return
    const restoreTask = window.setTimeout(() => { void syncSession() }, 0)
    return () => window.clearTimeout(restoreTask)
  }, [configured, syncSession])

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    error,
    signIn: async (username, password) => {
      setError(undefined)
      try {
        const signedInUser = await signInWithCognito(username, password)
        setUser(signedInUser)
        setStatus(resolveAuthStatus(true, true, true))
      } catch (signInError) {
        setStatus(resolveAuthStatus(true, false, false))
        const message = authErrorMessage(signInError)
        setError(message.includes('Incorrect username or password') ? 'The email or password is incorrect.' : message)
        throw signInError
      }
    },
    signOut: async () => {
      await signOutFromCognito()
      setUser(undefined)
      setStatus(configured ? resolveAuthStatus(true, false, false) : resolveAuthStatus(false, false, false))
      setError(undefined)
    },
    clearError: () => setError(undefined),
  }), [configured, error, status, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
