import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'
import { protectedRouteDestination } from './protectedRouteState'

export function ProtectedRoute({ enabled = true }: { enabled?: boolean }) {
  const auth = useAuth()
  const location = useLocation()
  const destination = protectedRouteDestination(auth.status, enabled, location.pathname + location.search)
  if (destination === 'loading') return <div role="status" className="grid min-h-[50vh] place-items-center text-sm text-slate-500">Restoring your session…</div>
  if (destination) return <Navigate to={destination} replace />
  return <Outlet />
}
