import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuthContext } from '@/context/auth-context'
import { signUpSchema, type SignUpInput } from '@/types/auth'
import { createLogger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { UserPlus, ArrowLeft, Loader2 } from 'lucide-react'

const logger = createLogger('CreateUser')

export function CreateUserPage() {
  const navigate = useNavigate()
  const { signUp, isLoaded } = useAuthContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'operator',
      contactNumber: '',
      location: '',
    },
  })

  const onSubmit = async (values: SignUpInput) => {
    if (!isLoaded) {
      logger.warn('AuthContext is not loaded yet, aborting account submission')
      toast.error('Authentication service is initializing. Please try again.')
      return
    }

    setIsSubmitting(true)
    logger.info(`Attempting to create account: ${values.email} (Role: ${values.role})`)

    try {
      await signUp(values)
      logger.info(`Successfully provisioned account for ${values.email}`)
      toast.success(`Account for ${values.email} created successfully!`)
      reset()
      navigate('/superadmin')
    } catch (err: unknown) {
      const errorObj = err as { errors?: Array<{ message: string }>; message?: string }
      const message =
        errorObj.errors?.[0]?.message ||
        errorObj.message ||
        'Failed to create user account'

      logger.error(`Account creation failed for ${values.email}: ${message}`, err)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link to="/superadmin">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-xl">Create New User Account</CardTitle>
              <CardDescription>
                Provisions a new user in Clerk with platform role tags and syncs with PostgreSQL.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="e.g. Maria Santos"
                {...register('fullName')}
                disabled={isSubmitting}
              />
              {errors.fullName && (
                <p className="text-xs text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. operator@sagana.org"
                {...register('email')}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Temporary Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                {...register('password')}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Role Assignment */}
            <div className="space-y-1.5">
              <Label htmlFor="role">Assigned Platform Role *</Label>
              <select
                id="role"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                {...register('role')}
                disabled={isSubmitting}
              >
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Number */}
              <div className="space-y-1.5">
                <Label htmlFor="contactNumber">Contact Number (Optional)</Label>
                <Input
                  id="contactNumber"
                  placeholder="+63 917 123 4567"
                  {...register('contactNumber')}
                  disabled={isSubmitting}
                />
                {errors.contactNumber && (
                  <p className="text-xs text-destructive">
                    {errors.contactNumber.message}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label htmlFor="location">Facility / Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g. Quezon City Facility"
                  {...register('location')}
                  disabled={isSubmitting}
                />
                {errors.location && (
                  <p className="text-xs text-destructive">{errors.location.message}</p>
                )}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/superadmin')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
