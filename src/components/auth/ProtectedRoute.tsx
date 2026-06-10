import { Loader2 } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../state/Auth'

/** Requires a signed-in user. In demo mode everyone passes through. */
export function ProtectedRoute() {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) return <FullScreenSpinner />
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Requires the signed-in user to be an admin. */
export function RequireAdmin() {
  const { loading, isAdmin } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-400">
      <Loader2 className="animate-spin" size={24} />
    </div>
  )
}
