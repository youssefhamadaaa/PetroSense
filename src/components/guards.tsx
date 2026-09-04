import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import type { Role } from '@/types'

/** Requires an authenticated session; else redirects to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}

/**
 * Requires a specific role (e.g. "admin"). Non-matching users are redirected
 * back into the app. Admin routes are ALSO enforced by the backend later.
 */
export function RequireRole({
  role,
  children,
}: {
  role: Role
  children: ReactNode
}) {
  const currentRole = useAuthStore((s) => s.role)
  if (currentRole !== role) {
    return <Navigate to="/app" replace />
  }
  return <>{children}</>
}
