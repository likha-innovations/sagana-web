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

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  role: z.enum(['operator', 'admin']),
  contactNumber: z
    .string()
    .trim()
    .optional(),
  location: z
    .string()
    .trim()
    .optional(),
})

export type SignUpInput = z.infer<typeof signUpSchema>

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  contactNumber: z.string().optional(),
  location: z.string().optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
