import { createContext, type ReactNode } from 'react'
import type { AuthUser } from 'aws-amplify/auth'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unconfigured'

export interface AuthContextValue {
  status: AuthStatus
  user?: AuthUser
  error?: string
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
export type AuthProviderProps = { children: ReactNode }
