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
  const { signIn, isLoaded, isSignedIn } = useAuthContext()
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

  // If already signed in, redirect to admin
  if (isLoaded && isSignedIn) {
    return <Navigate to="/admin" replace />
  }

  const onSubmit = async (values: SignInInput) => {
    setIsSubmitting(true)
    setAuthError(null)

    try {
      await signIn(values.email, values.password)
      toast.success('Signed in successfully.')
      navigate('/admin')
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border bg-card">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Sagana Web
            </CardTitle>
            <p className="text-xs text-muted-foreground uppercase font-mono tracking-wider mt-0.5">
              Admin Console
            </p>
          </div>
          <CardDescription className="text-sm">
            Sign in with your authorized admin account to manage the platform.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {authError && (
            <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@sagana.ph"
                  className="pl-9 h-11 min-h-[44px] text-sm"
                  disabled={isSubmitting}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="pl-9 pr-11 h-11 min-h-[44px] text-sm"
                  disabled={isSubmitting}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              className="w-full gap-2 mt-2 h-11 min-h-[44px] text-sm"
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

          <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground">
            <span>Authorized personnel only. Contact system lead for account access.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
