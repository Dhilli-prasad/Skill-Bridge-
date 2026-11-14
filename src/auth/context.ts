
import { createContext, type ReactNode } from 'react'
import type { AuthUser } from 'aws-amplify/auth'

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'unconfigured'

export interface AuthContextValue {
  status: AuthStatus
  user?: AuthUser
  error?: string
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<boolean>
  confirmSignUp: (email: string, code: string) => Promise<boolean>
  resendSignUpCode: (email: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  confirmResetPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<void>
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)

export type AuthProviderProps = {
  children: ReactNode
}
