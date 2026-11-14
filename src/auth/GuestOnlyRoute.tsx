import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { guestRouteDestination } from './guestRouteState'
import { useAuth } from './useAuth'

export function GuestOnlyRoute({ children }: { children: ReactNode }) {
  const auth = useAuth()
  const location = useLocation()
  const returnTo = new URLSearchParams(location.search).get('returnTo') ?? '/'
  const destination = guestRouteDestination(auth.status, returnTo)

  if (destination === 'loading') {
    return <div role="status" className="grid min-h-[40vh] place-items-center text-sm text-slate-500">Restoring your session…</div>
  }
  if (destination) return <Navigate to={destination} replace />
  return children
}
