import { Navigate, Route, Routes } from 'react-router'
import { useAuthContext } from '@/context/auth-context'
import { AppShell } from '@/layout/app-shell'
import { CompostBatchesPage } from '@/components/compost-batches/compost-batches-page'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { MachinesPage } from '@/components/machines/machines-page'
import { OperatorsPage } from '@/components/operator-accounts/operators-page'
import { SignInPage } from '@/routes/auth/sign-in'
import { ForgotPasswordPage } from '@/routes/auth/forgot-password'
import { OperatorDetailPage } from '@/components/operator-accounts/operator-detail-page'
import { SettingsPage } from '@/components/settings/settings-page'
import { ErrorBoundary } from '@/components/ui/error-boundary'

const adminRoutes = [
  { path: '/admin', element: <DashboardPage /> },
  { path: '/admin/operator-accounts', element: <OperatorsPage /> },
  { path: '/admin/operator-accounts/:id', element: <OperatorDetailPage /> },
  { path: '/admin/operators', element: <Navigate to="/admin/operator-accounts" replace /> },
  { path: '/admin/machines', element: <MachinesPage /> },
  { path: '/admin/compost-batches', element: <CompostBatchesPage /> },
  { path: '/admin/settings', element: <SettingsPage /> },
]

const publicRoutes = [
  { path: '/sign-in/*', element: <SignInPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/sign-in/forgot-password', element: <ForgotPasswordPage /> },
]

const fallbackRoutes = [
  { path: '/', element: <Navigate to="/sign-in" replace /> },
  { path: '*', element: <Navigate to="/sign-in" replace /> },
]

function AuthGuard() {
  const { isLoaded, isSignedIn, signOut } = useAuthContext()

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />
  }

  // AC8 & AC9: Check session persistence across browser sessions
  const keepSignedInStored = localStorage.getItem('sagana_keep_signed_in') === 'true'
  const sessionActiveStored = sessionStorage.getItem('sagana_session_active') === 'true'
  if (!keepSignedInStored && !sessionActiveStored) {
    void signOut()
    return <Navigate to="/sign-in" replace />
  }

  return (
    <ErrorBoundary>
      <AppShell>{null}</AppShell>
    </ErrorBoundary>
  )
}

export function App() {
  return (
    <Routes>
      {publicRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}

      <Route element={<AuthGuard />}>
        {adminRoutes.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={<ErrorBoundary>{element}</ErrorBoundary>}
          />
        ))}
      </Route>

      {fallbackRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Routes>
  )
}

export default App
