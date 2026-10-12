import { Navigate, Route, Routes } from 'react-router'
import { useAuth } from '@clerk/react'
import { AppShell } from '@/layout/app-shell'
import { CompostBatchesPage } from '@/components/compost-batches/compost-batches-page'
import { DashboardPage } from '@/components/dashboard/dashboard-page'
import { MachinesPage } from '@/components/machines/machines-page'
import { OperatorsPage } from '@/components/operator-accounts/operators-page'
import { SystemHealthPage } from '@/components/system-health/system-health-page'
import { SignInPage } from '@/routes/auth/sign-in'

const adminRoutes = [
  { path: '/admin', element: <DashboardPage /> },
  { path: '/admin/operators', element: <OperatorsPage /> },
  { path: '/admin/machines', element: <MachinesPage /> },
  { path: '/admin/compost-batches', element: <CompostBatchesPage /> },
  { path: '/admin/system-health', element: <SystemHealthPage /> },
]

const publicRoutes = [{ path: '/sign-in/*', element: <SignInPage /> }]

const fallbackRoutes = [
  { path: '/', element: <Navigate to="/sign-in" replace /> },
  { path: '*', element: <Navigate to="/sign-in" replace /> },
]

function AuthGuard() {
  const { isLoaded, isSignedIn } = useAuth()

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

  return <AppShell>{null}</AppShell>
}

export function App() {
  return (
    <Routes>
      {publicRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}

      <Route element={<AuthGuard />}>
        {adminRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>

      {fallbackRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={element} />
      ))}
    </Routes>
  )
}

export default App
