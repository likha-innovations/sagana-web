import { Navigate, Outlet, Link } from 'react-router'
import { useAuthContext } from '@/context/auth-context'
import type { UserRole } from '@/types/auth'
import { Button } from '@/components/ui/button'
import { ShieldAlert, LogOut } from 'lucide-react'

interface RoleGuardProps {
  allowedRoles?: UserRole[]
}

export function RoleGuard({ allowedRoles = [] }: RoleGuardProps) {
  const { isLoaded, isSignedIn, role, user, signOut } = useAuthContext()

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="flex h-screen items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full p-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-center shadow-lg">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-sm mt-2 text-muted-foreground">
            This section requires <span className="font-semibold text-foreground">{allowedRoles.join(' or ')}</span> privileges.
          </p>

          <div className="mt-4 p-3 rounded-lg bg-card border text-left text-xs font-mono space-y-1">
            <div className="text-muted-foreground">Account: <span className="text-foreground">{user?.email || 'Unknown'}</span></div>
            <div className="text-muted-foreground">Detected Role: <span className="text-destructive font-bold uppercase">{role}</span></div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            {role === 'admin' && (
              <Button asChild variant="default" size="sm">
                <Link to="/admin">Go to Admin Portal</Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void signOut()}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out / Switch Account
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <Outlet />
}
