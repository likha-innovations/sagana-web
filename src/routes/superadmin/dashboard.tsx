import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { toast } from 'sonner'
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
  Thermometer,
  Droplets,
  Send,
  Cpu,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react'

export function SuperadminDashboard() {
  const { getToken, user } = useAuthContext()
  const {
    isConnected,
    transport,
    lastPingTime,
    latestTelemetry,
    logs,
    sendCommand,
    clearLogs,
  } = useSocketContext()

  const [commandText, setCommandText] = useState('')

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

  const handleSendCommand = (textToSend?: string) => {
    const value = (textToSend ?? commandText).trim()
    if (!value) return

    const sent = sendCommand(value)
    if (sent) {
      setCommandText('')
      toast.success(`Published to sagana/commands: ${value}`)
    } else {
      toast.error('Failed to dispatch command: Socket disconnected')
    }
  }

  const tempVal =
    latestTelemetry && typeof latestTelemetry === 'object' && 'temperature' in latestTelemetry
      ? String(latestTelemetry.temperature)
      : null

  const humidityVal =
    latestTelemetry && typeof latestTelemetry === 'object' && 'humidity' in latestTelemetry
      ? String(latestTelemetry.humidity)
      : null

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Superadmin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status overview and two-way IoT telemetry bridge.
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
              <Badge variant={isConnected ? 'success' : 'destructive'} className="gap-1">
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? 'Connected' : 'Offline'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>Transport: {transport}</span>
              {lastPingTime && <span>Last ping: {lastPingTime}</span>}
            </div>
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

      {/* IoT 2-Way Event Bridge: sagana/stream & sagana/commands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Live Telemetry (sagana/stream) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" /> Live Telemetry
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-[11px]">
                sagana/stream
              </Badge>
            </div>
            <CardDescription>
              Inbound sensor stream bridged to Socket.IO event &apos;telemetry&apos;.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestTelemetry ? (
              <div className="space-y-4">
                {(tempVal !== null || humidityVal !== null) && (
                  <div className="grid grid-cols-2 gap-3">
                    {tempVal !== null && (
                      <div className="rounded-xl border bg-card p-3.5 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Thermometer className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground uppercase">
                            Temperature
                          </span>
                        </div>
                        <p className="text-2xl font-bold tracking-tight text-foreground">
                          {tempVal}°C
                        </p>
                      </div>
                    )}
                    {humidityVal !== null && (
                      <div className="rounded-xl border bg-card p-3.5 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="h-7 w-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-500">
                            <Droplets className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground uppercase">
                            Humidity
                          </span>
                        </div>
                        <p className="text-2xl font-bold tracking-tight text-foreground">
                          {humidityVal}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="rounded-xl border bg-muted/30 p-3.5">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                    Raw Stream Payload
                  </p>
                  <pre className="font-mono text-xs text-foreground overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                    {JSON.stringify(latestTelemetry, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center flex flex-col items-center justify-center rounded-xl border border-dashed p-6">
                <Cpu className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium text-foreground">
                  Waiting for Telemetry
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Publish a message to sagana/stream in HiveMQ to stream data here in real time.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Command Dispatch (sagana/commands) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" /> Send Command
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-[11px]">
                sagana/commands
              </Badge>
            </div>
            <CardDescription>
              Outbound actuator instructions dispatched via Socket.IO event &apos;command&apos;.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Quick Action Presets
              </p>
              <div className="flex flex-wrap gap-2">
                {['RELAY_ON', 'RELAY_OFF', '{"state":1}', '{"state":0}'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSendCommand(preset)}
                    disabled={!isConnected}
                    className="rounded-lg bg-muted px-2.5 py-1 text-xs font-mono border hover:bg-muted/80 disabled:opacity-50 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Custom Instruction
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commandText}
                  onChange={(e) => setCommandText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
                  placeholder="Type command (e.g. RELAY_ON)..."
                  disabled={!isConnected}
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 font-mono text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => handleSendCommand()}
                  disabled={!isConnected || !commandText.trim()}
                  className="gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> Send
                </Button>
              </div>
            </div>

            {/* Architecture Pulse Integration */}
            <div className="pt-2 border-t space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Inbound Stream:</span>
                <span className="font-mono text-foreground">sagana/stream ➔ &apos;telemetry&apos;</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Outbound Command:</span>
                <span className="font-mono text-foreground">&apos;command&apos; ➔ sagana/commands</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs & System Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Activity Stream */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Recent Realtime Activity ({logs.length})
              </CardTitle>
              {logs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearLogs}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                >
                  <Trash2 className="h-3 w-3" /> Clear
                </Button>
              )}
            </div>
            <CardDescription>
              Live activity stream of inbound telemetry and outbound command events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {logs.length > 0 ? (
              logs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border bg-card p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 flex-1 mr-3 overflow-hidden">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        log.type === 'telemetry'
                          ? 'bg-emerald-500'
                          : log.type === 'command'
                            ? 'bg-sky-500'
                            : log.type === 'error'
                              ? 'bg-destructive'
                              : 'bg-muted-foreground'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{log.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">
                        {typeof log.payload === 'object'
                          ? JSON.stringify(log.payload)
                          : String(log.payload)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No recent realtime events recorded.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Details & Architecture Specs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-primary" /> Active Superadmin Profile
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
                <div className="sm:col-span-2 pt-2 border-t">
                  <dt className="text-xs text-muted-foreground">Clerk User ID</dt>
                  <dd className="font-mono text-xs mt-0.5 text-muted-foreground truncate">
                    {profile?.id || user?.id}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
