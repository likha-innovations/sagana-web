import React from 'react'
import { Link, useLocation } from 'react-router'
import { useAuthContext } from '@/context/auth-context'
import { useSocketContext } from '@/context/socket-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldCheck, UserPlus, LayoutDashboard, Radio, LogOut, User as UserIcon } from 'lucide-react'

export const AppShell: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, role, signOut } = useAuthContext()
  const location = useLocation()
  const { isConnected } = useSocketContext()

  const navLinks = [
    {
      to: '/superadmin',
      label: 'Superadmin Pulse',
      icon: LayoutDashboard,
      active: location.pathname === '/superadmin',
    },
    {
      to: '/superadmin/create-account',
      label: 'Create Account',
      icon: UserPlus,
      active: location.pathname === '/superadmin/create-account',
    },
    {
      to: '/admin',
      label: 'Admin Portal',
      icon: ShieldCheck,
      active: location.pathname.startsWith('/admin'),
    },
  ]

  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/superadmin" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow">
                S
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight leading-none">
                  Sagana Web
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                  Management Console
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      link.active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <Badge
                variant={isConnected ? 'success' : 'secondary'}
                className="gap-1.5 font-mono text-[11px]"
              >
                <Radio
                  className={`h-3 w-3 ${
                    isConnected ? 'text-emerald-500 animate-pulse' : 'text-muted-foreground'
                  }`}
                />
                IoT: {isConnected ? 'Live' : 'Standby'}
              </Badge>
              <Badge variant="outline" className="font-mono text-[11px] capitalize">
                Role: {role}
              </Badge>
            </div>

            {/* Custom User Avatar & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-border/80">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                  {userInitials || <UserIcon className="h-4 w-4" />}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-medium leading-none truncate max-w-[120px]">
                    {user?.fullName || 'Active User'}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                    {user?.email}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => void signOut()}
                title="Sign Out"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
