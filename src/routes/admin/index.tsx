import { useAuthContext } from '@/context/auth-context'
import { useProfile } from '@/hooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserCheck, Activity, Cpu, Layers } from 'lucide-react'

export function AdminDashboard() {
  const { user } = useAuthContext()
  const { data: profile } = useProfile({
    enabled: !!user,
  })

  const activeName = profile?.fullName || user?.fullName || 'Administrator'
  const activeRole = profile?.role || user?.role || 'admin'
  const activeEmail = profile?.email || user?.email || ''

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin Console</h1>
        <p className="text-sm text-muted-foreground mt-1">
          System overview and telemetry scaffolding.
        </p>
      </div>

      {/* Primary Status Cards: Single column on mobile, 3-column on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Active Session
            </CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-lg font-bold text-foreground truncate">{activeName}</div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize text-xs font-mono">
                {activeRole}
              </Badge>
              <span className="text-xs text-muted-foreground truncate">{activeEmail}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Node Scaffolding
            </CardTitle>
            <Cpu className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-lg font-bold text-foreground">ESP32 Ingestion</div>
            <p className="text-xs text-muted-foreground font-mono">
              Status: Ready for device binding
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Pipeline State
            </CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-lg font-bold text-foreground">Compost Cycle Stream</div>
            <p className="text-xs text-muted-foreground font-mono">
              Status: Socket connection ready
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Boilerplate Scaffolding Section */}
      <Card className="border-dashed border-border bg-card/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Telemetry & Hardware Scaffold</CardTitle>
          </div>
          <CardDescription>
            Live WebSocket metrics will mount here once physical devices connect to the ingestion pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-sm font-medium text-foreground">Awaiting Ingestion Stream</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sensors and device telemetry endpoints will populate automatically upon connection.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
