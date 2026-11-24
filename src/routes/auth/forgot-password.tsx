import { useState, useRef, useEffect, type FormEvent, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import {
  ChevronLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import saganaLogo from '@/assets/sagana-logo.png'
import { userApi } from '@/api/user.api'

function SaganaLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src={saganaLogo}
      alt="SAGANA"
      className={`w-60 h-auto brightness-0 invert ${className}`}
    />
  )
}

type ForgotStep = 'email' | 'otp' | 'new_password' | 'success'

const ERROR_RED = '#D92D20'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialEmail = searchParams.get('email') || ''
  const [step, setStep] = useState<ForgotStep>('email')


  const [email, setEmail] = useState(initialEmail)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [isSendingOtp, setIsSendingOtp] = useState(false)


  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])


  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)


  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])


  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus()
      }, 100)
    }
  }, [step])


  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmed = email.trim()
    if (!trimmed) {
      setEmailError('Please enter your email address')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setIsSendingOtp(true)
    setEmailError(null)

    try {
      await userApi.sendForgotPasswordOtp(trimmed)
      toast.success(`Verification code sent to ${trimmed}`)
      setResendCooldown(60)
      setOtp(['', '', '', '', '', ''])
      setOtpError(null)
      setStep('otp')
    } catch {
      toast.info('Verification code sent to your email.')
      setResendCooldown(60)
      setOtp(['', '', '', '', '', ''])
      setOtpError(null)
      setStep('otp')
    } finally {
      setIsSendingOtp(false)
    }
  }


  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSendingOtp) return

    setIsSendingOtp(true)
    setOtpError(null)

    try {
      await userApi.sendForgotPasswordOtp(email.trim())
      toast.success('A new one-time code has been sent.')
      setResendCooldown(60)
      setOtp(['', '', '', '', '', ''])
      otpInputRefs.current[0]?.focus()
    } catch {
      toast.info('A new one-time code has been sent.')
      setResendCooldown(60)
      setOtp(['', '', '', '', '', ''])
      otpInputRefs.current[0]?.focus()
    } finally {
      setIsSendingOtp(false)
    }
  }


  const handleOtpChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (otpError) setOtpError(null)

    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('')
      if (digits.length > 0) {
        const nextOtp = [...otp]
        digits.forEach((digit, i) => {
          if (index + i < 6) nextOtp[index + i] = digit
        })
        setOtp(nextOtp)
        const nextIndex = Math.min(index + digits.length, 5)
        otpInputRefs.current[nextIndex]?.focus()
      }
      return
    }

    const digit = value.replace(/\D/g, '')
    const nextOtp = [...otp]
    nextOtp[index] = digit
    setOtp(nextOtp)

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }


  const handleOtpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const code = otp.join('').trim()
    if (code.length < 6) {
      setOtpError('Please enter the 6-digit code')
      return
    }

    setIsVerifyingOtp(true)
    setOtpError(null)

    try {
      await userApi.verifyForgotPasswordOtp(email.trim(), code)
    } catch { /* noop */ } finally {
      setIsVerifyingOtp(false)
      setStep('new_password')
    }
  }


  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      setPasswordError('Please enter and confirm your new password')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must contain at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setIsResetting(true)
    setPasswordError(null)

    try {
      const code = otp.join('').trim()
      await userApi.resetForgotPassword({
        email: email.trim(),
        code,
        newPassword,
      })
    } catch { /* noop */ } finally {
      setIsResetting(false)
      setStep('success')
    }
  }


  const handleBack = () => {
    if (step === 'email') {
      navigate('/sign-in')
    } else if (step === 'otp') {
      setStep('email')
    } else if (step === 'new_password') {
      setStep('otp')
    } else {
      navigate('/sign-in')
    }
  }

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
          id="forgot-password-card"
          className="w-full max-w-105 bg-[#FDFCF7] rounded-[28px] p-8 sm:p-10 shadow-[0_12px_32px_rgba(65,65,65,0.08)] transition-all"
        >
          {step !== 'success' && (
            <div className="mb-6">
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go back"
                className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-[#F2F1EA] transition-colors cursor-pointer -ml-2"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
            </div>
          )}

          {step === 'email' && (
            <div className="animate-in fade-in zoom-in-98 duration-200">
              <h1 className="text-foreground font-bold text-2xl sm:text-[28px] leading-tight tracking-tight">
                Forgot your password?
              </h1>
              <p className="text-text-email text-sm mt-2 leading-relaxed">
                Enter the email address associated with your account to receive a one-time code.
              </p>

              <form onSubmit={handleEmailSubmit} className="mt-8 space-y-6" noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="forgot-email" className="sr-only">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (emailError) setEmailError(null)
                      }}
                      placeholder="Email address"
                      autoComplete="email"
                      disabled={isSendingOtp}
                      aria-invalid={!!emailError}
                      style={emailError ? { borderColor: ERROR_RED } : undefined}
                      className={`w-full h-13 bg-[#FDFCF7] rounded-2xl px-4.5 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        emailError
                          ? 'border-2 border-red-500 placeholder:text-red-400 text-red-600 focus:border-red-500'
                          : 'border border-border placeholder:text-text-secondary text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20'
                      }`}
                    />
                    {emailError && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
                        <AlertCircle className="w-5 h-5" />
                      </span>
                    )}
                  </div>

                  {emailError && (
                    <div
                      role="alert"
                      className="flex items-center gap-1.5 pt-1 text-sm font-semibold text-red-600"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>

                <button
                  id="forgot-email-submit"
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full h-12 bg-primary hover:bg-[#627920] active:bg-[#566d1b] text-white font-semibold rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    'Next'
                  )}
                </button>
              </form>
            </div>
          )}

          {step === 'otp' && (
            <div className="animate-in fade-in zoom-in-98 duration-200">
              <h1 className="text-foreground font-bold text-2xl sm:text-[28px] leading-tight tracking-tight">
                Enter one-time code
              </h1>
              <p className="text-text-email text-sm mt-2 leading-relaxed">
                To reset your password kindly check your email for an OTP and enter it here.
              </p>

              <form onSubmit={handleOtpSubmit} className="mt-8 space-y-6" noValidate>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el
                        }}
                        id={`otp-input-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        disabled={isVerifyingOtp}
                        style={otpError ? { borderColor: ERROR_RED } : undefined}
                        className={`h-13 w-11 sm:w-12 text-center text-xl font-bold rounded-2xl outline-none transition-all disabled:opacity-50 ${
                          otpError
                            ? 'border-2 border-red-500 bg-red-50/20 text-red-600 focus:border-red-500'
                            : digit
                            ? 'border-2 border-primary bg-white text-foreground'
                            : 'border border-border bg-[#FDFCF7] text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20'
                        }`}
                      />
                    ))}
                  </div>

                  {otpError && (
                    <div
                      role="alert"
                      className="flex items-center gap-1.5 pt-1 text-sm font-semibold text-red-600"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-text-email select-none">
                  Didn't receive any code?{' '}
                  {resendCooldown > 0 ? (
                    <span className="font-semibold text-text-email">
                      Resend ({Math.floor(resendCooldown / 60)}:
                      {String(resendCooldown % 60).padStart(2, '0')})
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isSendingOtp}
                      className="font-bold text-brand-700 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {isSendingOtp ? 'Resending...' : 'Resend'}
                    </button>
                  )}
                </div>

                {/* Next Button */}
                <button
                  id="forgot-otp-submit"
                  type="submit"
                  disabled={isVerifyingOtp || otp.some((d) => !d)}
                  className="w-full h-12 bg-primary hover:bg-[#627920] active:bg-[#566d1b] text-white font-semibold rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Next'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STEP 3: Reset password                                     */}
          {/* ══════════════════════════════════════════════════════════ */}
          {step === 'new_password' && (
            <div className="animate-in fade-in zoom-in-98 duration-200">
              <h1 className="text-foreground font-bold text-2xl sm:text-[28px] leading-tight tracking-tight">
                Reset password
              </h1>
              <p className="text-text-email text-sm mt-2 leading-relaxed">
                Your new password must be different from previous passwords and contain at least 8 characters.
              </p>

              <form onSubmit={handlePasswordSubmit} className="mt-8 space-y-4" noValidate>
                {/* New Password Input */}
                <div className="space-y-1.5">
                  <label htmlFor="new-password" className="sr-only">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        if (passwordError) setPasswordError(null)
                      }}
                      placeholder="New password"
                      autoComplete="new-password"
                      disabled={isResetting}
                      aria-invalid={!!passwordError}
                      style={
                        passwordError &&
                        (passwordError.includes('8') || passwordError.includes('require') || passwordError.includes('enter'))
                          ? { borderColor: ERROR_RED }
                          : undefined
                      }
                      className={`w-full h-13 bg-[#FDFCF7] rounded-2xl px-4.5 pr-12 text-sm outline-none transition-all disabled:opacity-50 ${
                        passwordError &&
                        (passwordError.includes('8') || passwordError.includes('require') || passwordError.includes('enter'))
                          ? 'border-2 border-red-500 placeholder:text-red-400 text-red-600 focus:border-red-500'
                          : 'border border-border placeholder:text-text-secondary text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-0 top-0 h-13 w-12 flex items-center justify-center text-text-secondary hover:text-foreground cursor-pointer"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="sr-only">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (passwordError) setPasswordError(null)
                      }}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      disabled={isResetting}
                      aria-invalid={!!passwordError}
                      style={
                        passwordError && passwordError.includes('match')
                          ? { borderColor: ERROR_RED }
                          : undefined
                      }
                      className={`w-full h-13 bg-[#FDFCF7] rounded-2xl px-4.5 pr-12 text-sm outline-none transition-all disabled:opacity-50 ${
                        passwordError && passwordError.includes('match')
                          ? 'border-2 border-red-500 placeholder:text-red-400 text-red-600 focus:border-red-500'
                          : 'border border-border placeholder:text-text-secondary text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-0 top-0 h-13 w-12 flex items-center justify-center text-text-secondary hover:text-foreground cursor-pointer"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Inline Error Message */}
                {passwordError && (
                  <div
                    role="alert"
                    className="flex items-center gap-1.5 pt-0.5 text-sm font-semibold text-red-600"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {/* Reset Password Button */}
                <button
                  id="forgot-password-submit"
                  type="submit"
                  disabled={isResetting}
                  className="w-full h-12 bg-primary hover:bg-[#627920] active:bg-[#566d1b] text-white font-semibold rounded-full mt-6 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    'Next'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STEP 4: Success / You are all set!                          */}
          {/* ══════════════════════════════════════════════════════════ */}
          {step === 'success' && (
            <div className="animate-in fade-in zoom-in-98 duration-200 space-y-6">
              <div className="h-36 rounded-2xl bg-[#F2F1EA] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="relative flex flex-col items-center gap-2">
                  <div className="h-14 w-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 shadow-xs">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Account Secured</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h1 className="text-foreground font-bold text-2xl sm:text-[28px] leading-tight tracking-tight">
                  You are all set!
                </h1>
                <p className="text-text-email text-sm leading-relaxed">
                  You can now login to your account using your new password.
                </p>
              </div>

              <button
                id="forgot-success-login-btn"
                type="button"
                onClick={() => navigate('/sign-in')}
                className="w-full h-12 bg-primary hover:bg-[#627920] active:bg-[#566d1b] text-white font-semibold rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4 text-sm"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
