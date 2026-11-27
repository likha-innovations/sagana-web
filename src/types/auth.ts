import { z } from 'zod'

export const userRoleSchema = z.enum(['operator', 'admin'])
export type UserRole = z.infer<typeof userRoleSchema>

export const userSchema = z.object({
  id: z.string(),
  fullName: z.string().nullable().optional(),
  email: z.string().email('Invalid email address'),
  contactNumber: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  role: userRoleSchema,
  status: z.string().default('active'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type User = z.infer<typeof userSchema>

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
})

export type SignInInput = z.infer<typeof signInSchema>

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters').optional(),
  birthday: z.string().trim().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const resetPasswordRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address')
    .email('Please enter a valid email address'),
})

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
})

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>

export const resetPasswordConfirmSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Reset code must be exactly 6 digits'),
  password: z
    .string()
    .min(12, 'Password must contain at least 12 characters'),
})

export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>
