import { Routes, Route, Navigate } from 'react-router'
import { SignInPage } from '@/routes/auth/sign-in'
import { AdminPage } from '@/routes/admin'
import { SuperadminDashboard } from '@/routes/superadmin/dashboard'
import { CreateUserPage } from '@/routes/superadmin/create-user'
import { AppShell } from '@/components/layout/app-shell'
import { RoleGuard } from '@/components/layout/role-guard'
import { useAuthContext } from '@/context/auth-context'

function IndexRedirect() {
  const { isLoaded, isSignedIn, role } = useAuthContext()

  if (!isLoaded) return null
  if (!isSignedIn) return <Navigate to="/sign-in" replace />
  if (role === 'superadmin') return <Navigate to="/superadmin" replace />
  if (role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/superadmin" replace />
}

export function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/sign-in/*" element={<SignInPage />} />

      {/* Admin Routes (Allowed: admin & superadmin) */}
      <Route element={<RoleGuard allowedRoles={['admin', 'superadmin']} />}>
        <Route
          path="/admin/*"
          element={
            <AppShell>
              <AdminPage />
            </AppShell>
          }
        />
      </Route>

      {/* Superadmin Routes (Allowed: superadmin) */}
      <Route element={<RoleGuard allowedRoles={['superadmin']} />}>
        <Route
          path="/superadmin"
          element={
            <AppShell>
              <SuperadminDashboard />
            </AppShell>
          }
        />
        <Route
          path="/superadmin/create-account"
          element={
            <AppShell>
              <CreateUserPage />
            </AppShell>
          }
        />
      </Route>

      {/* Defaults */}
      <Route path="/" element={<IndexRedirect />} />
      <Route path="*" element={<IndexRedirect />} />
    </Routes>
  )
}

export default App
