import { Routes, Route, Navigate } from 'react-router'
import { SignInPage } from '@/routes/auth/sign-in'
import { AdminDashboard } from '@/routes/admin'
import { AppShell } from '@/components/layout/app-shell'
import { RoleGuard } from '@/components/layout/role-guard'
import { useAuthContext } from '@/context/auth-context'

function IndexRedirect() {
  const { isLoaded, isSignedIn, role } = useAuthContext()

  if (!isLoaded) return null
  if (!isSignedIn) return <Navigate to="/sign-in" replace />
  if (role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/admin" replace />
}

export function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/sign-in/*" element={<SignInPage />} />

      {/* Protected Admin Routes */}
      <Route element={<RoleGuard allowedRoles={['admin']} />}>
        <Route
          path="/admin"
          element={
            <AppShell>
              <AdminDashboard />
            </AppShell>
          }
        />
      </Route>

      {/* Root & Catch-all Fallbacks */}
      <Route path="/" element={<IndexRedirect />} />
      <Route path="*" element={<IndexRedirect />} />
    </Routes>
  )
}

export default App
