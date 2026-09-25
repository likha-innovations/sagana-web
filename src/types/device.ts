import { z } from 'zod'

export const publishCommandSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export type PublishCommandInput = z.infer<typeof publishCommandSchema>

export interface TelemetryData {
  temperature?: number
  humidity?: number
  moisture?: number
  waterLevel?: number
  [key: string]: unknown
}

export interface RealtimeEventLog {
  id: string
  type: 'telemetry' | 'command' | 'connection' | 'error'
  title: string
  payload: unknown
  timestamp: string
}
