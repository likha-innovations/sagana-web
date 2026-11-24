import { api } from './client'
import type { User, UpdateProfileInput } from '@/types/auth'


export const userApi = {

  getProfile: () => api.get<User>('/me'),


  updateProfile: (data: UpdateProfileInput) => api.patch<User>('/me', data),


  sendPasswordOtp: () =>
    api.post<{ success: boolean; message: string; email?: string; debugCode?: string }>(
      '/me/send-password-otp'
    ),


  verifyPasswordOtp: (code: string) =>
    api.post<{ success: boolean; valid: boolean }>('/me/verify-password-otp', { code }),


  changePassword: (data: { code: string; newPassword: string }) =>
    api.post<{ success: boolean; message: string }>('/me/change-password', data),


  sendForgotPasswordOtp: (email: string) =>
    api.post<{ success: boolean; message: string; email?: string; debugCode?: string }>(
      '/auth/forgot-password/send-otp',
      { email }
    ),


  verifyForgotPasswordOtp: (email: string, code: string) =>
    api.post<{ success: boolean; valid: boolean }>('/auth/forgot-password/verify-otp', {
      email,
      code,
    }),


  resetForgotPassword: (data: { email: string; code: string; newPassword: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/forgot-password/reset', data),
}
