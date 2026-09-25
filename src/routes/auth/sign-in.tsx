import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuthContext } from '@/context/auth-context'
import { signInSchema, type SignInInput } from '@/types/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, ArrowRight } from 'lucide-react'

export function SignInPage() {
  const navigate = useNavigate()
  const { signIn, isLoaded, isSignedIn, role } = useAuthContext()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // If already signed in, redirect according to role
  if (isLoaded && isSignedIn) {
    if (role === 'superadmin') return <Navigate to="/superadmin" replace />
    if (role === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/" replace />
  }

  const onSubmit = async (values: SignInInput) => {
    setIsSubmitting(true)
    setAuthError(null)

    try {
      await signIn(values.email, values.password)
      toast.success('Signed in successfully!')
      navigate('/')
    } catch (err: unknown) {
      const errorObj = err as {
        errors?: Array<{ message?: string; longMessage?: string }>
        message?: string
      }
      const message =
        errorObj.errors?.[0]?.longMessage ||
        errorObj.errors?.[0]?.message ||
        errorObj.message ||
        'Unable to sign in. Please verify your credentials.'

      setAuthError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl border-border bg-card">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Sagana Web
            </CardTitle>
            <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider mt-0.5">
              Management Console
            </p>
          </div>
          <CardDescription className="text-sm">
            Sign in with your authorized admin or superadmin account to manage the IoT platform.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {authError && (
            <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@sagana.ph"
                  className="pl-9"
                  disabled={isSubmitting}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="pl-9 pr-9"
                  disabled={isSubmitting}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gap-2 mt-2"
              disabled={isSubmitting || !isLoaded}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground">
            <span>Enterprise security &bull; Authorized personnel only</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
