export type SystemHealthData = {
  summary: {
    apiUptime: number
    latencyMs: number
    alerts: number
    resolvedThisWeek: number
  }
  services: Array<{
    name: string
    status: 'healthy' | 'warning' | 'critical'
    uptime: string
    latency: string
    details: string
  }>
}

export const mockSystemHealthData: SystemHealthData = {
  summary: {
    apiUptime: 0,
    latencyMs: 0,
    alerts: 0,
    resolvedThisWeek: 0,
  },
  services: [],
}
