import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { useAuthContext } from '@/context/auth-context'
import { authApi } from '@/api/auth.api'
import { useSocketContext } from '@/context/socket-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  UserCheck,
  Radio,
  Clock,
  UserPlus,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react'

export const SuperadminDashboard: React.FC = () => {
  const { getToken, user } = useAuthContext()
  const { isConnected, transport, lastPingTime, socket } = useSocketContext()

  // 1. Backend Health Check
  const {
    data: health,
    isLoading: isHealthLoading,
    refetch: refetchHealth,
    isRefetching: isHealthRefetching,
  } = useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => authApi.getHealth(),
    refetchInterval: 15000,
  })

  // 2. Authenticated Profile from Backend (/me)
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Unauthenticated')
      return authApi.getProfile(token)
    },
    enabled: !!user,
  })

  const sendTestPing = () => {
    if (socket && isConnected) {
      socket.emit('command', { action: 'ping', timestamp: Date.now() })
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Superadmin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status overview connected directly to backend services and IoT telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchHealth()}
            disabled={isHealthRefetching}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isHealthRefetching ? 'animate-spin' : ''}`}
            />
            Refresh Pulse
          </Button>
          <Button asChild size="sm" className="gap-2">
            <Link to="/superadmin/create-account">
              <UserPlus className="h-4 w-4" />
              Create Account
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Backend API Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Backend Core API</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {isHealthLoading ? 'Checking...' : health?.status === 'ok' ? 'Healthy' : 'Active'}
              </span>
              <Badge variant={health?.status === 'ok' ? 'success' : 'secondary'}>
                {health?.status || 'Unknown'}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
              <Clock className="h-3 w-3" />
              Uptime: {health?.uptime ? `${Math.floor(health.uptime)}s` : 'Real-time online'}
            </div>
          </CardContent>
        </Card>

        {/* Telemetry Gateway Socket */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">IoT Telemetry Socket</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {isConnected ? 'Online' : 'Standby'}
              </span>
              <Badge variant={isConnected ? 'success' : 'destructive'}>
                {isConnected ? 'Connected' : 'Offline'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>Transport: {transport}</span>
              {isConnected && (
                <button
                  onClick={sendTestPing}
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <Zap className="h-3 w-3" /> Ping Gateway
                </button>
              )}
            </div>
            {lastPingTime && (
              <p className="text-[11px] text-muted-foreground font-mono">
                Last stream ping: {lastPingTime}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Superadmin Session */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Session Identity</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold truncate max-w-[180px]">
                {profile?.fullName || user?.fullName || 'Superadmin'}
              </span>
              <Badge variant="outline" className="capitalize">
                {profile?.role || user?.role || 'superadmin'}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {profile?.email || user?.email}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Details & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Active Superadmin Profile
            </CardTitle>
            <CardDescription>
              User record retrieved from backend PostgreSQL database via GET /me.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isProfileLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading profile from database...
              </div>
            ) : (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Full Name</dt>
                  <dd className="font-medium mt-0.5">{profile?.fullName || user?.fullName || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="font-medium mt-0.5">{profile?.email || user?.email || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Contact Number</dt>
                  <dd className="font-medium mt-0.5">{profile?.contactNumber || user?.contactNumber || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Location</dt>
                  <dd className="font-medium mt-0.5">{profile?.location || user?.location || 'Not set'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Clerk User ID</dt>
                  <dd className="font-mono text-xs mt-0.5 text-muted-foreground">
                    {profile?.id || user?.id}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" /> Architecture Pulse
            </CardTitle>
            <CardDescription>
              Backend micro-architecture and protocol integrations status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b text-sm">
              <span className="text-muted-foreground">REST API Guard</span>
              <span className="font-mono text-xs">ClerkAuthGuard (JWT Bearer)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b text-sm">
              <span className="text-muted-foreground">Database Engine</span>
              <span className="font-mono text-xs">PostgreSQL 16 (Neon Serverless)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b text-sm">
              <span className="text-muted-foreground">Hardware IoT Broker</span>
              <span className="font-mono text-xs">HiveMQ Cloud MQTT (TLS 8883)</span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-muted-foreground">Client Bridge Gateway</span>
              <span className="font-mono text-xs">Socket.IO /telemetry</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
