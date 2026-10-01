import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuthContext } from '@/context/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Menu,
  X,
} from 'lucide-react'

export function AppShell({ children }: { children: ReactNode }) {
  const { user, role, signOut } = useAuthContext()
  const location = useLocation()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const navLinks = [
    {
      to: '/admin',
      label: 'Admin Dashboard',
      icon: LayoutDashboard,
      active: location.pathname === '/admin',
    },
  ]

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'A'

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="space-y-6">
        {/* Brand Header */}
        <Link
          to="/admin"
          onClick={() => setMobileSidebarOpen(false)}
          className="flex items-center gap-3 px-2 py-1"
        >
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-base shadow shrink-0">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight leading-none text-foreground">
              Sagana Web
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider mt-1">
              Admin Console
            </span>
          </div>
        </Link>

        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Navigation
          </p>
          <nav className="flex flex-col gap-1 pt-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    link.active
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* User Profile & Sign Out Section */}
      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20 shrink-0">
            {userInitials || <UserIcon className="h-4 w-4" />}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-medium text-foreground truncate">
              {user?.fullName || 'Administrator'}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {user?.email}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 pt-1">
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            Role: {role}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void signOut()}
            className="h-11 min-h-[44px] px-2.5 text-xs text-muted-foreground hover:text-destructive gap-1.5"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Static / Fixed Sidebar on Desktop */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-border bg-card">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header (compact bar) */}
      <header className="md:hidden sticky top-0 z-20 h-14 border-b border-border bg-card/90 backdrop-blur px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileSidebarOpen(true)}
            className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg border-border"
            aria-label="Open sidebar navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold text-base tracking-tight text-foreground">
            Sagana Web
          </span>
        </div>

        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
          {userInitials}
        </div>
      </header>

      {/* Mobile Off-canvas Drawer */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="relative z-50 w-72 max-w-[80vw] bg-card border-r border-border h-full flex flex-col shadow-2xl">
            <div className="absolute right-2 top-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(false)}
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg text-muted-foreground hover:text-foreground"
                aria-label="Close sidebar navigation"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Scrollable Main Content Area: Offset by 64 (16rem) on desktop */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
