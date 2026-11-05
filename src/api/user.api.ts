import { api } from './client'
import type { User, UpdateProfileInput } from '@/types/auth'

// User & Profile REST API Endpoints (sagana-backend UsersController)
export const userApi = {
  // GET /me — Fetches current authenticated user profile
  getProfile: () => api.get<User>('/me'),

  // PATCH /me — Updates current authenticated user profile
  updateProfile: (data: UpdateProfileInput) => api.patch<User>('/me', data),

  // POST /me/send-password-otp — Sends OTP code to user's email
  sendPasswordOtp: () =>
    api.post<{ success: boolean; message: string; email?: string; debugCode?: string }>(
      '/me/send-password-otp'
    ),

  // POST /me/verify-password-otp — Verifies the OTP code
  verifyPasswordOtp: (code: string) =>
    api.post<{ success: boolean; valid: boolean }>('/me/verify-password-otp', { code }),

  // POST /me/change-password — Updates password using verified OTP
  changePassword: (data: { code: string; newPassword: string }) =>
    api.post<{ success: boolean; message: string }>('/me/change-password', data),

  // POST /auth/forgot-password/send-otp — Sends OTP code to given email for unauthenticated users
  sendForgotPasswordOtp: (email: string) =>
    api.post<{ success: boolean; message: string; email?: string; debugCode?: string }>(
      '/auth/forgot-password/send-otp',
      { email }
    ),

  // POST /auth/forgot-password/verify-otp — Verifies unauthenticated OTP code
  verifyForgotPasswordOtp: (email: string, code: string) =>
    api.post<{ success: boolean; valid: boolean }>('/auth/forgot-password/verify-otp', {
      email,
      code,
    }),

  // POST /auth/forgot-password/reset — Resets password for unauthenticated users using verified OTP
  resetForgotPassword: (data: { email: string; code: string; newPassword: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/forgot-password/reset', data),
}
