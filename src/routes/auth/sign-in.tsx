import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuthContext } from '@/context/auth-context'
import { signInSchema, type SignInInput } from '@/types/auth'
import { Loader2 } from 'lucide-react'
import saganaLogo from '@/assets/sagana-logo.png'

function SaganaLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src={saganaLogo}
      alt="SAGANA"
      className={`w-60 h-auto brightness-0 invert ${className}`}
    />
  )
}

export function SignInPage() {
  const navigate = useNavigate()
  const { signIn, isLoaded, isSignedIn } = useAuthContext()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [keepSignedIn, setKeepSignedIn] = useState(false)

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

  // If already signed in, redirect to dashboard
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
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:grid lg:grid-cols-2">
      {/* ── Left Panel: Green branding ── */}
      <div className="relative shrink-0 lg:shrink lg:block" style={{ background: 'linear-gradient(to bottom, #C9E752, #518251)' }}>
        {/* Mobile: compact header strip */}
        <div className="p-6 sm:p-8 lg:p-16">
          <SaganaLogo />
        </div>
      </div>

      {/* ── Right Panel: Login form ── */}
      <div className="bg-[#F7F6F0] flex-1 flex items-center justify-center p-5 sm:p-6 overflow-y-auto">
        <div
          id="login-card"
          className="w-full max-w-110 bg-[#FDFCF7] rounded-3xl p-8 sm:p-10 shadow-xl"
        >
          {/* Header */}
          <h1 className="text-[#414141] font-bold text-[28px] leading-[120%] tracking-[-0.02em]">
            Welcome back
          </h1>
          <p className="text-[#717171] text-sm mt-1">
            Sign in to the SAGANA Admin Web Dashboard.
          </p>

          {/* Auth error banner */}
          {authError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {authError}
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-8 space-y-5"
            noValidate
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="sign-in-email" className="sr-only">
                Email address
              </label>
              <input
                id="sign-in-email"
                type="email"
                placeholder="Email address"
                autoComplete="email"
                disabled={isSubmitting}
                className="w-full h-12 min-h-11 bg-[#FDFCF7] border border-[#E5E3D9] rounded-xl px-4 text-sm text-[#414141] placeholder-[#A0A0A0] outline-none transition-all focus:ring-0 focus:border-[#E5E3D9] disabled:opacity-50 disabled:cursor-not-allowed"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-600 pl-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="sign-in-password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="sign-in-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="w-full h-12 min-h-11 bg-[#FDFCF7] border border-[#E5E3D9] rounded-xl px-4 pr-12 text-sm text-[#414141] placeholder-[#A0A0A0] outline-none transition-all focus:ring-2 focus:ring-[#718619]/40 focus:border-[#718619] disabled:opacity-50 disabled:cursor-not-allowed"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-12 w-12 min-h-11 min-w-11 flex items-center justify-center text-[#A0A0A0] hover:text-[#555] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 pl-1">{errors.password.message}</p>
              )}
            </div>

            {/* Options row */}
            <div className="flex justify-between items-center text-sm mt-4">
              <label
                htmlFor="keep-signed-in"
                className="flex items-center gap-2.5 cursor-pointer select-none"
              >
                <input
                  id="keep-signed-in"
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="appearance-none h-5 w-5 min-h-5 min-w-5 rounded-lg border border-[#E5E3D9] bg-white checked:bg-[#718619] checked:border-[#718619] cursor-pointer transition-colors relative after:content-[''] after:absolute after:left-1.5 after:top-0.5 after:w-1.5 after:h-2.5 after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:opacity-0 checked:after:opacity-100"
                />
                <span className="text-[#555]">Keep me signed in</span>
              </label>

              <button
                type="button"
                className="text-[#718619] font-semibold hover:underline transition-colors min-h-11 flex items-center"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              id="sign-in-submit"
              type="submit"
              disabled={isSubmitting || !isLoaded}
              className="w-full h-12 min-h-11 bg-[#718619] hover:bg-[#627920] active:bg-[#566d1b] text-white font-semibold rounded-full mt-6 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
