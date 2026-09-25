import { apiFetch } from './client'
import type { User } from '@/types/auth'

export interface HealthResponse {
  status: string
  info?: Record<string, unknown>
  error?: Record<string, unknown>
  details?: Record<string, unknown>
  uptime?: number
  timestamp?: string
}

export const authApi = {
  getProfile: async (token: string): Promise<User> => {
    return apiFetch<User>('me', { token })
  },

  getHealth: async (): Promise<HealthResponse> => {
    return apiFetch<HealthResponse>('health')
  },
}
