import type { AuthStatus } from './context'

export function protectedRouteDestination(status: AuthStatus, enabled: boolean, currentPath: string) {
  if (!enabled || status === 'authenticated') return undefined
  if (status === 'loading') return 'loading'
  return `/sign-in?returnTo=${encodeURIComponent(currentPath)}`
}
