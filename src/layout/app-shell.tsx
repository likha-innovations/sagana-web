import { useState, type ReactNode } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Activity, Cpu, Layers, LayoutDashboard, LogOut, Menu, Users, X } from 'lucide-react'
import saganaLogo from '@/assets/sagana-logo.png'
import { useAuthContext } from '@/context/auth-context'
import { Button } from '@/ui/button'

const navLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/operators', label: 'Operator Accounts', icon: Users },
  { to: '/admin/machines', label: 'Machines', icon: Cpu },
  { to: '/admin/compost-batches', label: 'Compost Batches', icon: Layers },
  { to: '/admin/system-health', label: 'System health', icon: Activity },
]

function getUserInitials(fullName?: string | null) {
  if (!fullName) return 'A'

  return fullName
    .split(' ')
    .map((name) => name[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getNavLinkClasses(isActive: boolean) {
  return [
    'flex h-14 items-center gap-3 rounded-2xl px-3 text-xs leading-none text-[#414141] transition-all',
    isActive
      ? 'bg-[#FDFCF7] font-bold shadow-[0_6px_20px_rgba(65,65,65,0.08)]'
      : 'font-medium hover:bg-[#FDFCF7]/60',
  ].join(' ')
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, signOut } = useAuthContext()
  const location = useLocation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const closeSidebar = () => setMobileSidebarOpen(false)
  const currentPath = location.pathname
  const userInitials = getUserInitials(user?.fullName)
  const displayName = user?.fullName || 'Administrator'

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between px-7 py-8">
      <div>
        <Link to="/admin" onClick={closeSidebar} className="block">
          <img src={saganaLogo} alt="Sagana" className="h-auto w-full" />
        </Link>

        <div className="mt-6 h-px w-full bg-border" />

        <nav className="mt-6 flex flex-col gap-2.5">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = link.end ? currentPath === link.to : currentPath.startsWith(link.to)

            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeSidebar}
                className={getNavLinkClasses(isActive)}
              >
                <span
                  className={`flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[10px] ${
                    isActive ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                </span>
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3 rounded-[20px] bg-[#FDFCF7] p-3 shadow-[0_8px_24px_rgba(65,65,65,0.08)]">
        <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-full bg-linear-to-b from-[#C9E752] to-positive text-xs font-bold text-white">
          {userInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold leading-[1.3] text-[#414141]">{displayName}</p>
          <p className="text-[11px] capitalize leading-[1.4] text-[#566811]">{role}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void signOut()}
          className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-secondary hover:text-destructive"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-background md:flex">
        {sidebarContent}
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:hidden">
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileSidebarOpen(true)}
            className="h-11 w-11 min-h-11 min-w-11 rounded-lg border-border"
            aria-label="Open sidebar navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img src={saganaLogo} alt="Sagana" className="h-6 w-auto" />
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-b from-[#C9E752] to-positive text-xs font-bold text-white">
          {userInitials}
        </div>
      </header>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={closeSidebar}
            aria-hidden="true"
          />

          <div className="relative z-50 h-full w-72 max-w-[80vw] bg-background shadow-2xl">
            <div className="absolute right-2 top-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={closeSidebar}
                className="h-11 w-11 min-h-11 min-w-11 rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="Close sidebar navigation"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      <div className="flex min-h-screen flex-col md:pl-64">
        <main className="flex-1 w-full px-4 py-6 sm:px-6 md:pl-3 md:pr-9 md:py-8">
          {children}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
