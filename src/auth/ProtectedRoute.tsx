import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function ProtectedRoute({ enabled = true }: { enabled?: boolean }) {
  const auth = useAuth()
  const location = useLocation()
  if (!enabled) return <Outlet />
  if (auth.status === 'loading') return <div className="grid min-h-[50vh] place-items-center text-sm text-slate-500">Restoring your session…</div>
  if (auth.status !== 'authenticated') return <Navigate to={`/sign-in?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <Outlet />
}
