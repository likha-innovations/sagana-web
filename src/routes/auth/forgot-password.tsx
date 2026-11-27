import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router'
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
import { useAuthContext } from '@/context/auth-context'
import { PasswordChecklist } from '@/components/auth/password-checklist'
import { resetPasswordRequestSchema, verifyCodeSchema } from '@/types/auth'
import {
  applyOtpChange,
  extractClerkErrorMessage,
  isPasswordValid,
} from '@/lib/password-reset'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ForgotPasswordPage')

function SaganaLogo({ className = '' }: { className?: string }) {
  return (
    <img
      src={saganaLogo}
      alt="SAGANA"
      className={`w-36 sm:w-60 h-auto brightness-0 invert ${className}`}
    />
  )
}

type ForgotStep = 'email' | 'otp' | 'new_password' | 'success'

const ERROR_RED = '#D92D20'
const EMPTY_OTP = ['', '', '', '', '', '']

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    requestPasswordReset,
    verifyPasswordResetCode,
    resetPassword,
    isLoaded,
    resetPrepStatus,
    resetPrepError,
    clearResetPrep,
  } = useAuthContext()
  const isPreparingReset = resetPrepStatus === 'pending'

  const initialEmail = searchParams.get('email') || ''
  const initialStep: ForgotStep =
    searchParams.get('step') === 'otp' && initialEmail ? 'otp' : 'email'
  const [step, setStep] = useState<ForgotStep>(initialStep)

  const [email, setEmail] = useState(initialEmail)
  const [emailError, setEmailError] = useState<string | null>(null)

  const [otp, setOtp] = useState<string[]>(EMPTY_OTP)
  const [otpError, setOtpError] = useState<string | null>(null)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPasswordError, setNewPasswordError] = useState(false)
  const [confirmPasswordError, setConfirmPasswordError] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const stepAttemptRef = useRef(0)

  const transitionToStep = (nextStep: ForgotStep) => {
    stepAttemptRef.current += 1
    setStep(nextStep)
  }

  useEffect(() => {
    return () => {
      clearResetPrep()
    }
  }, [clearResetPrep])

  useEffect(() => {
    if (step !== 'otp' || resetPrepStatus !== 'sent') return
    const timer = setTimeout(() => {
      setResendCooldown(60)
      clearResetPrep()
    }, 0)
    return () => clearTimeout(timer)
  }, [step, resetPrepStatus, clearResetPrep])

  const displayedOtpError =
    otpError ??
    (step === 'otp' && resetPrepStatus === 'failed'
      ? resetPrepError || 'No code was sent. Click Resend to try again.'
      : null)

  useEffect(() => {
    if (step === 'otp') {
      const timer = setTimeout(() => {
        otpInputRefs.current[0]?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [step])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const parsed = resetPasswordRequestSchema.safeParse({ email })
    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message || 'Please enter a valid email address')
      return
    }

    const attemptId = ++stepAttemptRef.current
    setIsSendingOtp(true)
    setEmailError(null)

    try {
      await requestPasswordReset(parsed.data.email)
      if (stepAttemptRef.current !== attemptId) return
      setOtp(EMPTY_OTP)
      setOtpError(null)
      setResendCooldown(60)
      transitionToStep('otp')
    } catch (err: unknown) {
      if (stepAttemptRef.current !== attemptId) return
      logger.warn('Password reset request failed:', err)
      setEmailError(
        extractClerkErrorMessage(err, 'Unable to find account with this email address')
      )
    } finally {
      if (stepAttemptRef.current === attemptId) {
        setIsSendingOtp(false)
      }
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSendingOtp || isPreparingReset || !email.trim()) return

    const attemptId = ++stepAttemptRef.current
    clearResetPrep()
    setIsSendingOtp(true)
    setOtpError(null)

    try {
      await requestPasswordReset(email.trim())
      if (stepAttemptRef.current !== attemptId) return
      setOtp(EMPTY_OTP)
      setResendCooldown(60)
      otpInputRefs.current[0]?.focus()
    } catch (err: unknown) {
      if (stepAttemptRef.current !== attemptId) return
      logger.warn('Resend OTP failed:', err)
      setOtpError(extractClerkErrorMessage(err, 'Unable to resend OTP. Please try again.'))
    } finally {
      if (stepAttemptRef.current === attemptId) {
        setIsSendingOtp(false)
      }
    }
  }

  const verifyOtpCode = async (code: string) => {
    if (isVerifyingOtp || isPreparingReset) return

    const parsed = verifyCodeSchema.safeParse({ code })
    if (!parsed.success) {
      setOtpError('Please enter the 6-digit code')
      return
    }

    const attemptId = ++stepAttemptRef.current
    setIsVerifyingOtp(true)
    setOtpError(null)

    try {
      await verifyPasswordResetCode(parsed.data.code)
      if (stepAttemptRef.current !== attemptId) return
      transitionToStep('new_password')
    } catch (err: unknown) {
      if (stepAttemptRef.current !== attemptId) return
      logger.warn('OTP verification failed:', err)
      setOtpError(extractClerkErrorMessage(err, 'Incorrect one-time code'))
    } finally {
      if (stepAttemptRef.current === attemptId) {
        setIsVerifyingOtp(false)
      }
    }
  }

  const applyOtpInput = (index: number, rawValue: string) => {
    if (otpError) setOtpError(null)
    if (resetPrepStatus === 'failed') clearResetPrep()

    const { nextOtp, focusIndex } = applyOtpChange(otp, index, rawValue)
    setOtp(nextOtp)

    if (focusIndex !== null) {
      otpInputRefs.current[focusIndex]?.focus()
    }

    // ponytail: trigger auto-verify on input completion rather than an effect to avoid bounce-back on Back
    if (nextOtp.every(Boolean)) {
      void verifyOtpCode(nextOtp.join(''))
    }
  }

  const handleOtpChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    applyOtpInput(index, e.target.value)
  }

  const handleOtpPaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (!pasted) return
    e.preventDefault()
    applyOtpInput(index, pasted)
  }

  const handleOtpKeyDown = (index: number, e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const nextOtp = [...otp]
      nextOtp[index - 1] = ''
      setOtp(nextOtp)
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    void verifyOtpCode(otp.join('').trim())
  }

  const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      setNewPasswordError(!newPassword)
      setConfirmPasswordError(!confirmPassword)
      setPasswordError('Please enter and confirm your new password')
      return
    }

    if (!isPasswordValid(newPassword)) {
      setNewPasswordError(true)
      setConfirmPasswordError(false)
      setPasswordError("Password doesn't meet requirements")
      return
    }

    if (newPassword !== confirmPassword) {
      setNewPasswordError(false)
      setConfirmPasswordError(true)
      setPasswordError("Passwords don't match")
      return
    }

    const attemptId = ++stepAttemptRef.current
    setIsResetting(true)
    setNewPasswordError(false)
    setConfirmPasswordError(false)
    setPasswordError(null)

    try {
      await resetPassword(newPassword, otp.join('').trim())
      if (stepAttemptRef.current !== attemptId) return
      transitionToStep('success')
    } catch (err: unknown) {
      if (stepAttemptRef.current !== attemptId) return
      logger.warn('Password reset completion failed:', err)
      setNewPasswordError(true)
      setConfirmPasswordError(true)
      setPasswordError(
        extractClerkErrorMessage(err, 'Failed to reset password. The OTP may have expired.')
      )
    } finally {
      if (stepAttemptRef.current === attemptId) {
        setIsResetting(false)
      }
    }
  }

  const handleBack = () => {
    if (step === 'email') {
      navigate('/sign-in')
    } else if (step === 'otp') {
      setOtpError(null)
      setIsVerifyingOtp(false)
      setIsSendingOtp(false)
      transitionToStep('email')
    } else if (step === 'new_password') {
      setNewPasswordError(false)
      setConfirmPasswordError(false)
      setPasswordError(null)
      setIsResetting(false)
      transitionToStep('otp')
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

              <form onSubmit={(e) => void handleEmailSubmit(e)} className="mt-8 space-y-6" noValidate>
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
                      className={`w-full h-13 bg-[#FDFCF7] rounded-2xl px-4.5 pr-11 text-sm outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
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
                  disabled={isSendingOtp || !isLoaded}
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
                {email.trim() ? (
                  <>
                    Enter the 6-digit one-time code sent to{' '}
                    <span className="font-semibold text-foreground break-all">{email.trim()}</span>.
                  </>
                ) : (
                  'To reset your password kindly check your email for an OTP and enter it here.'
                )}
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
                        autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e)}
                        onPaste={(e) => handleOtpPaste(idx, e)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        disabled={isVerifyingOtp || isPreparingReset}
                        aria-label={`One-time code digit ${idx + 1} of 6`}
                        style={displayedOtpError ? { borderColor: ERROR_RED } : undefined}
                        className={`h-13 w-11 sm:w-12 text-center text-xl font-bold rounded-2xl outline-none transition-all disabled:opacity-50 ${
                          displayedOtpError
                            ? 'border-2 border-red-500 bg-red-50/20 text-red-600 focus:border-red-500'
                            : digit
                            ? 'border-[1.5px] border-foreground/50 bg-white text-foreground'
                            : 'border border-border bg-[#FDFCF7] text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20'
                        }`}
                      />
                    ))}
                  </div>

                  {displayedOtpError && (
                    <div
                      role="alert"
                      className="flex items-center gap-1.5 pt-1 text-sm font-semibold text-red-600"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{displayedOtpError}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-text-email select-none">
                  Didn&apos;t receive any code?{' '}
                  {resendCooldown > 0 ? (
                    <span className="font-semibold text-text-email">
                      Resend ({Math.floor(resendCooldown / 60)}:
                      {String(resendCooldown % 60).padStart(2, '0')})
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleResendOtp()}
                      disabled={isSendingOtp || isPreparingReset}
                      className="font-bold text-brand-700 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {isSendingOtp || isPreparingReset ? 'Resending...' : 'Resend'}
                    </button>
                  )}
                </div>

                <button
                  id="forgot-otp-submit"
                  type="submit"
                  disabled={isVerifyingOtp || isPreparingReset || otp.some((d) => !d)}
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

          {step === 'new_password' && (
            <div className="animate-in fade-in zoom-in-98 duration-200">
              <h1 className="text-foreground font-bold text-2xl sm:text-[28px] leading-tight tracking-tight">
                Reset password
              </h1>
              <p className="text-text-email text-sm mt-2 leading-relaxed">
                Your new password must contain at least 12 characters, a number, and a special symbol.
              </p>

              <form onSubmit={(e) => void handlePasswordSubmit(e)} className="mt-8 space-y-4" noValidate>
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
                        if (newPasswordError) setNewPasswordError(false)
                        if (passwordError) setPasswordError(null)
                      }}
                      placeholder="New password"
                      autoComplete="new-password"
                      disabled={isResetting}
                      aria-invalid={newPasswordError}
                      style={newPasswordError ? { borderColor: ERROR_RED } : undefined}
                      className={`w-full h-13 bg-[#FDFCF7] rounded-2xl px-4.5 pr-12 text-sm outline-none transition-all disabled:opacity-50 ${
                        newPasswordError
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

                <div className="space-y-1.5">
                  <label htmlFor="confirm-password" className="sr-only">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (confirmPasswordError) setConfirmPasswordError(false)
                        if (passwordError) setPasswordError(null)
                      }}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      disabled={isResetting}
                      aria-invalid={confirmPasswordError}
                      style={confirmPasswordError ? { borderColor: ERROR_RED } : undefined}
                      className={`w-full h-13 bg-[#FDFCF7] rounded-2xl px-4.5 pr-12 text-sm outline-none transition-all disabled:opacity-50 ${
                        confirmPasswordError
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

                {passwordError && (
                  <div
                    role="alert"
                    className="flex items-center gap-1.5 pt-0.5 text-sm font-semibold text-red-600"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <PasswordChecklist password={newPassword} hasError={newPasswordError} />

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
