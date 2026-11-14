
import { useCallback, useEffect, useMemo, useState } from 'react'
import { configureApiAuthSession } from '../services/apiClient'
import {
  getAccessToken,
  getCurrentCognitoUser,
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
import {
  AuthContext,
  type AuthProviderProps,
  type AuthContextValue,
  type AuthStatus,
} from './context'
import type { AuthUser } from 'aws-amplify/auth'

function authErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return 'We could not complete authentication. Please try again.'
}

export function AuthProvider({ children }: AuthProviderProps) {
  const configured = isCognitoConfigured()
  const [status, setStatus] = useState<AuthStatus>(
    configured ? 'loading' : resolveAuthStatus(false, false, false),
  )
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
    configureApiAuthSession(
      configured
        ? {
            getAccessToken: () => getAccessToken(),
            refreshAccessToken: () => getAccessToken(true),
            clearSession: () => {
              void signOutFromCognito().catch(() => undefined)
              setUser(undefined)
              setStatus(resolveAuthStatus(true, false, false))
              setError('Your session has expired. Please sign in again.')
            },
          }
        : undefined,
    )

    if (!configured) return

    const restoreTask = window.setTimeout(() => {
      void syncSession()
    }, 0)

    return () => window.clearTimeout(restoreTask)
  }, [configured, syncSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
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
          setStatus(resolveAuthStatus(true, true, true))
        } catch (signInError) {
          setStatus(resolveAuthStatus(true, false, false))

          const rawMessage = authErrorMessage(signInError)
          const message =
            rawMessage.includes('Incorrect username or password') ||
            rawMessage.includes('NotAuthorizedException')
              ? 'The email or password is incorrect.'
              : rawMessage.includes('UserNotFoundException')
                ? 'No account was found for that email address.'
                : rawMessage.includes('UserNotConfirmedException')
                  ? 'Confirm your email address before signing in.'
                  : rawMessage

          setError(message)
          throw signInError
        }
      },

      signUp: async (name, email, password) => {
        setError(undefined)

        try {
          const result = await signUpWithCognito(name, email, password)
          return !result.isSignUpComplete
        } catch (signUpError) {
          setError(authErrorMessage(signUpError))
          throw signUpError
        }
      },

      confirmSignUp: async (email, code) => {
        setError(undefined)

        try {
          const result = await confirmSignUpWithCognito(email, code)
          return result.isSignUpComplete
        } catch (confirmationError) {
          setError(authErrorMessage(confirmationError))
          throw confirmationError
        }
      },

      resendSignUpCode: async (email) => {
        setError(undefined)

        try {
          await resendSignUpCodeWithCognito(email)
        } catch (resendError) {
          setError(authErrorMessage(resendError))
          throw resendError
        }
      },

      resetPassword: async (email) => {
        setError(undefined)

        try {
          await resetPasswordWithCognito(email)
        } catch (resetError) {
          setError(authErrorMessage(resetError))
          throw resetError
        }
      },

      confirmResetPassword: async (email, code, newPassword) => {
        setError(undefined)

        try {
          await confirmResetPasswordWithCognito(email, code, newPassword)
        } catch (confirmationError) {
          setError(authErrorMessage(confirmationError))
          throw confirmationError
        }
      },

      signOut: async () => {
        try {
          await signOutFromCognito()
        } finally {
          setUser(undefined)
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
    [configured, error, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
