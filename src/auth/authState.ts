import type { AuthStatus } from './context'

export function resolveAuthStatus(configured: boolean, hasUser: boolean, hasAccessToken: boolean): AuthStatus {
  if (!configured) return 'unconfigured'
  return hasUser && hasAccessToken ? 'authenticated' : 'unauthenticated'
}
