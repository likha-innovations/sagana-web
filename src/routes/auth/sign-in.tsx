import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useAuthContext } from '@/context/auth-context'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import saganaLogo from '@/assets/sagana-logo.png'

function SaganaLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src={saganaLogo}
      alt="SAGANA"
      className={`w-36 sm:w-60 h-auto brightness-0 invert ${className}`}
    />
  )
}


const ERROR_RED = '#D92D20'

export function SignInPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, isLoaded, isSignedIn } = useAuthContext()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(false)


  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const stored = sessionStorage.getItem('sagana_failed_sign_in_attempts')
      return stored ? parseInt(stored, 10) || 0 : 0
    } catch {
      return 0
    }
  })


  const initialError = searchParams.get('error') === 'unauthorized' ? 'Incorrect credentials, try again' : null
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError)
  const [hasError, setHasError] = useState<boolean>(Boolean(initialError))


  if (isLoaded && isSignedIn) {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()


    if (failedAttempts >= 5) {
      const msg = 'Too many failed attempts, you may try again later'
      setErrorMessage(msg)
      setHasError(true)
      toast.error(msg)
      return
    }


    if (!email.trim() || !password) {
      const msg = 'Please enter your credentials'
      setErrorMessage(msg)
      setHasError(true)
      toast.error(msg)
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setHasError(false)

    try {
      await signIn(email.trim(), password, keepSignedIn)
      try {
        sessionStorage.removeItem('sagana_failed_sign_in_attempts')
      } catch { /* noop */ }
      setFailedAttempts(0)
      toast.success('Signed in successfully.')
      navigate('/admin')
    } catch (err: unknown) {
      const nextCount = failedAttempts + 1
      setFailedAttempts(nextCount)
      try {
        sessionStorage.setItem('sagana_failed_sign_in_attempts', String(nextCount))
      } catch { /* noop */ }
      setHasError(true)


      if (nextCount >= 5) {
        const msg = 'Too many failed attempts, you may try again later'
        setErrorMessage(msg)
        toast.error(msg)
        return
      }

      const rawMessage = (err as Error)?.message || ''
      if (/too many/i.test(rawMessage)) {
        const msg = 'Too many failed attempts, you may try again later'
        setErrorMessage(msg)
        toast.error(msg)
      } else {
        const msg = 'Incorrect credentials, try again'
        setErrorMessage(msg)
        toast.error(msg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const emailInputClassName = hasError
    ? 'border-2 border-red-500 placeholder:text-red-400 text-red-600 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
    : 'border border-border placeholder:text-text-secondary text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20'

  const passwordInputClassName = hasError
    ? 'border-2 border-red-500 placeholder:text-red-400 text-red-600 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
    : 'border border-border placeholder:text-text-secondary text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20'


  const errorBorderStyle = hasError ? { borderColor: ERROR_RED } : undefined

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col lg:grid lg:grid-cols-2">
      <div
        className="relative shrink-0 lg:shrink lg:block"
        style={{ background: 'linear-gradient(to bottom, #C9E752, #518251)' }}
      >
        <div className="p-6 sm:p-8 lg:p-16">
          <SaganaLogo />
        </div>
      </div>

      <div className="bg-page flex-1 flex items-center justify-center p-5 sm:p-6 overflow-y-auto">
        <div
          id="login-card"
          className="w-full max-w-105 bg-[#FDFCF7] rounded-[28px] p-8 sm:p-10 shadow-[0_12px_32px_rgba(65,65,65,0.08)]"
        >
          <h1 className="text-foreground font-bold text-2xl sm:text-[28px] leading-tight tracking-tight">
            Welcome back
          </h1>
          <p className="text-text-email text-sm mt-2 leading-relaxed">
            Sign in to the SAGANA Admin Web Dashboard.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
            noValidate
          >
            <div className="space-y-1.5">
              <label htmlFor="sign-in-email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <input
                  id="sign-in-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (hasError) {
                      setHasError(false)
                      setErrorMessage(null)
                    }
                  }}
                  placeholder="Email address"
                  autoComplete="email"
                  disabled={isSubmitting}
                  aria-invalid={hasError}
                  style={errorBorderStyle}
                  className={`w-full h-13 bg-[#FDFCF7] rounded-2xl px-4.5 pr-11 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${emailInputClassName}`}
                />
                {hasError && (
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
                    <AlertCircle className="w-5 h-5" />
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sign-in-password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="sign-in-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (hasError) {
                      setHasError(false)
                      setErrorMessage(null)
                    }
                  }}
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? 'login-error' : undefined}
                  style={errorBorderStyle}
                  className={`w-full h-13 bg-[#FDFCF7] rounded-2xl px-4.5 pr-20 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${passwordInputClassName}`}
                />
                {hasError && (
                  <span className="absolute right-11 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
                    <AlertCircle className="w-5 h-5" />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-0 top-0 h-13 w-12 min-h-11 flex items-center justify-center transition-colors cursor-pointer ${
                    hasError ? 'text-red-500 hover:text-red-600' : 'text-text-secondary hover:text-foreground'
                  }`}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div
                id="login-error"
                role="alert"
                className="flex items-center gap-1.5 pt-0.5 text-sm font-semibold text-red-600"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm pt-1">
              <label
                htmlFor="keep-signed-in"
                className="flex items-center gap-2.5 cursor-pointer select-none"
              >
                <input
                  id="keep-signed-in"
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="appearance-none h-5 w-5 min-h-5 min-w-5 rounded-lg border border-border bg-white checked:bg-primary checked:border-primary cursor-pointer transition-colors relative after:content-[''] after:absolute after:left-1.5 after:top-0.5 after:w-1.5 after:h-2.5 after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:opacity-0 checked:after:opacity-100"
                />
                <span className="text-text-email text-xs sm:text-sm">Keep me signed in</span>
              </label>

              <Link
                to={email.trim() ? `/forgot-password?email=${encodeURIComponent(email.trim())}` : '/forgot-password'}
                className="text-primary font-semibold hover:underline transition-colors min-h-11 flex items-center cursor-pointer text-xs sm:text-sm"
              >
                Forgot password?
              </Link>
            </div>

            <button
              id="sign-in-submit"
              type="submit"
              disabled={isSubmitting || !isLoaded}
              className="w-full h-12 bg-primary hover:bg-[#627920] active:bg-[#566d1b] text-white font-semibold rounded-full mt-6 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
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

export default SignInPage
