import { api } from './client'
import type { User, UpdateProfileInput } from '@/types/auth'

export const userApi = {
  getProfile: () => api.get<User>('/me'),
  updateProfile: (data: UpdateProfileInput) => api.patch<User>('/me', data),
}
