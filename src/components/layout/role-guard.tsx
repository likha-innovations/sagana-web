import { Navigate, Outlet } from 'react-router'
import { useAuthContext } from '@/context/auth-context'
import type { UserRole } from '@/types/auth'

interface RoleGuardProps {
  allowedRoles?: UserRole[]
}

export function RoleGuard({ allowedRoles = [] }: RoleGuardProps) {
  const { isLoaded, isSignedIn, role } = useAuthContext()

  if (!isLoaded || (isSignedIn && allowedRoles.length > 0 && !allowedRoles.includes(role))) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  return <Outlet />
}
