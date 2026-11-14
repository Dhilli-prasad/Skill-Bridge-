
import { useCallback, useEffect, useMemo, useState } from 'react'
import { configureApiAuthSession } from '../services/apiClient'
import {
  getAccessToken,
  getCurrentCognitoUser,
  getCognitoDisplayName,
  isCognitoConfigured,
  signInWithCognito,
  signOutFromCognito,
  signUpWithCognito,
  confirmSignUpWithCognito,
  resendSignUpCodeWithCognito,
  resetPasswordWithCognito,
  confirmResetPasswordWithCognito,
} from './cognito'
import { resolveAuthStatus } from './authState'
import { toAuthErrorMessage } from './authErrors'
import {
  AuthContext,
  type AuthProviderProps,
  type AuthContextValue,
  type AuthStatus,
} from './context'
import type { AuthUser } from 'aws-amplify/auth'

export function AuthProvider({ children }: AuthProviderProps) {
  const configured = isCognitoConfigured()
  const [status, setStatus] = useState<AuthStatus>(
    configured ? 'loading' : resolveAuthStatus(false, false, false),
  )
  const [user, setUser] = useState<AuthUser>()
  const [displayName, setDisplayName] = useState<string>()
  const [error, setError] = useState<string>()

  const disconnectApiSession = useCallback(() => configureApiAuthSession(undefined), [])
  const connectApiSession = useCallback(() => {
    if (!configured) return disconnectApiSession()
    configureApiAuthSession({
      getAccessToken: () => getAccessToken(),
      refreshAccessToken: () => getAccessToken(true),
      clearSession: () => {
        disconnectApiSession()
        void signOutFromCognito().catch(() => undefined)
        setUser(undefined)
        setDisplayName(undefined)
        setStatus(resolveAuthStatus(true, false, false))
        setError('Your session has expired. Please sign in again.')
      },
    })
  }, [configured, disconnectApiSession])

  const syncSession = useCallback(async () => {
    if (!configured) {
      setUser(undefined)
      setDisplayName(undefined)
      return
    }

    const currentUser = await getCurrentCognitoUser()
    const accessToken = currentUser ? await getAccessToken() : undefined

    if (currentUser && accessToken) {
      setUser(currentUser)
      setDisplayName(await getCognitoDisplayName())
      setStatus(resolveAuthStatus(true, true, true))
    } else {
      setUser(undefined)
      setDisplayName(undefined)
      setStatus(resolveAuthStatus(true, false, false))
    }
  }, [configured])

  useEffect(() => {
    connectApiSession()

    if (!configured) return

    const restoreTask = window.setTimeout(() => {
      void syncSession()
    }, 0)

    return () => window.clearTimeout(restoreTask)
  }, [configured, connectApiSession, syncSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      displayName,
      error,

      signIn: async (username, password) => {
        setError(undefined)

        try {
          const signedInUser = await signInWithCognito(username, password)
          const accessToken = await getAccessToken()

          if (!accessToken) {
            throw new Error(
              'Cognito did not return an access token. Please try signing in again.',
            )
          }

          setUser(signedInUser)
          setDisplayName(await getCognitoDisplayName())
          setStatus(resolveAuthStatus(true, true, true))
          connectApiSession()
        } catch (signInError) {
          setStatus(resolveAuthStatus(true, false, false))

          const message = toAuthErrorMessage(signInError, 'signIn')
          setError(message)
          throw new Error(message, { cause: signInError })
        }
      },

      signUp: async (name, email, password) => {
        setError(undefined)

        try {
          const result = await signUpWithCognito(name, email, password)
          return !result.isSignUpComplete
        } catch (signUpError) {
          const message = toAuthErrorMessage(signUpError, 'signUp')
          setError(message)
          throw new Error(message, { cause: signUpError })
        }
      },

      confirmSignUp: async (email, code) => {
        setError(undefined)

        try {
          const result = await confirmSignUpWithCognito(email, code)
          return result.isSignUpComplete
        } catch (confirmationError) {
          const message = toAuthErrorMessage(confirmationError, 'verify')
          setError(message)
          throw new Error(message, { cause: confirmationError })
        }
      },

      resendSignUpCode: async (email) => {
        setError(undefined)

        try {
          await resendSignUpCodeWithCognito(email)
        } catch (resendError) {
          const message = toAuthErrorMessage(resendError, 'verify')
          setError(message)
          throw new Error(message, { cause: resendError })
        }
      },

      resetPassword: async (email) => {
        setError(undefined)

        try {
          await resetPasswordWithCognito(email)
        } catch (resetError) {
          const message = toAuthErrorMessage(resetError, 'reset')
          setError(message)
          throw new Error(message, { cause: resetError })
        }
      },

      confirmResetPassword: async (email, code, newPassword) => {
        setError(undefined)

        try {
          await confirmResetPasswordWithCognito(email, code, newPassword)
        } catch (confirmationError) {
          const message = toAuthErrorMessage(confirmationError, 'reset')
          setError(message)
          throw new Error(message, { cause: confirmationError })
        }
      },

      signOut: async () => {
        disconnectApiSession()
        try {
          await signOutFromCognito()
        } finally {
          setUser(undefined)
          setDisplayName(undefined)
          setStatus(
            configured
              ? resolveAuthStatus(true, false, false)
              : resolveAuthStatus(false, false, false),
          )
          setError(undefined)
        }
      },

      clearError: () => setError(undefined),
    }),
    [configured, connectApiSession, disconnectApiSession, displayName, error, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
