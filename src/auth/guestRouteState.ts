import type { AuthStatus } from './context'

export function guestRouteDestination(status: AuthStatus, returnTo = '/') {
  if (status === 'loading') return 'loading'
  if (status === 'authenticated') return returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/'
  return undefined
}
