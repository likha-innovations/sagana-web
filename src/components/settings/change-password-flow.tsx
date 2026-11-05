import { useState, useRef, useEffect, type FormEvent, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { CheckCircle2, Eye, EyeOff, Lock, ShieldCheck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useUser } from '@clerk/react'
import { userApi } from '@/api/user.api'

export type FlowStep = 'idle' | 'confirm_prompt' | 'otp' | 'enter_new' | 'success'

interface ChangePasswordFlowProps {
  userEmail?: string
  onClose?: () => void
  onSuccess?: () => void
  onStepChange?: (step: FlowStep) => void
}

export function ChangePasswordFlow({ userEmail, onClose, onSuccess, onStepChange }: ChangePasswordFlowProps) {
  const { user: clerkUser } = useUser()

  const effectiveEmail = clerkUser?.primaryEmailAddress?.emailAddress || userEmail || 'your email'

  const [step, _setStep] = useState<FlowStep>('idle')

  // Wrapper that also notifies parent of step changes
  const setStep = (newStep: FlowStep) => {
    _setStep(newStep)
    onStepChange?.(newStep)
  }

  // OTP state
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // New password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(false)

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Live password rules
  const hasMinLength = newPassword.length >= 8
  const hasUpperAndLower = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)
  const hasNumber = /\d/.test(newPassword)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  const isAllCriteriaMet = hasMinLength && hasUpperAndLower && hasNumber && hasSpecialChar

  // Helper to mask email (e.g., n***@sagana.ph)
  const maskedEmail = (() => {
    const parts = effectiveEmail.split('@')
    if (parts.length < 2) return effectiveEmail
    const name = parts[0]
    const domain = parts[1]
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`
    return `${maskedName}@${domain}`
  })()

  // Reset all states
  const handleResetFlow = () => {
    setStep('idle')
    setOtp(['', '', '', '', '', ''])
    setOtpError(null)
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setNewPasswordError(null)
    setConfirmPasswordError(null)
    setIsLoading(false)
  }

  // Handle Confirm — sends OTP via backend and goes directly to OTP step
  const handleConfirmAndSendOtp = async () => {
    setIsLoading(true)
    try {
      const res = await userApi.sendPasswordOtp()
      setOtp(['', '', '', '', '', ''])
      setOtpError(null)
      setResendCooldown(30)
      toast.info(`Verification code sent to ${maskedEmail}`)
      if (res?.debugCode) {
        console.log('[SAGANA DEV] Verification code:', res.debugCode)
      }
      setStep('otp')
      setTimeout(() => {
        otpInputRefs.current[0]?.focus()
      }, 100)
    } catch (err: unknown) {
      const errMsg = (err as { message?: string })?.message || 'Failed to send verification code'
      toast.error(errMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return

    try {
      const res = await userApi.sendPasswordOtp()
      setResendCooldown(30)
      setOtp(['', '', '', '', '', ''])
      setOtpError(null)
      toast.success(`New verification code sent to ${maskedEmail}`)
      if (res?.debugCode) {
        console.log('[SAGANA DEV] Resent code:', res.debugCode)
      }
      otpInputRefs.current[0]?.focus()
    } catch (err: unknown) {
      const errMsg = (err as { message?: string })?.message || 'Failed to resend code'
      toast.error(errMsg)
    }
  }

  // Handle OTP change
  const handleOtpChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    const newOtp = [...otp]

    if (val.length > 1) {
      // Pasted full code
      const pasted = val.slice(0, 6).split('')
      pasted.forEach((char, idx) => {
        if (idx < 6) newOtp[idx] = char
      })
      setOtp(newOtp)
      setOtpError(null)
      const nextIdx = Math.min(pasted.length, 5)
      otpInputRefs.current[nextIdx]?.focus()
      return
    }

    newOtp[index] = val ? val[val.length - 1] : ''
    setOtp(newOtp)
    setOtpError(null)

    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  // Handle OTP Keydown
  const handleOtpKeyDown = (index: number, e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  // Handle Verify OTP — verifies code with backend and moves to enter_new
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    setOtpError(null)

    const code = otp.join('')
    if (code.length < 6) {
      setOtpError('Please enter the full 6-digit verification code')
      return
    }

    setIsLoading(true)
    try {
      await userApi.verifyPasswordOtp(code)
      setStep('enter_new')
    } catch (err: unknown) {
      const errMsg = (err as { message?: string })?.message || 'Invalid or expired verification code'
      setOtpError(errMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Submit New Password
  const handleSubmitNewPassword = async (e: FormEvent) => {
    e.preventDefault()
    setNewPasswordError(null)
    setConfirmPasswordError(null)

    let hasError = false

    if (!newPassword) {
      setNewPasswordError('Please enter your new password')
      hasError = true
    } else if (!isAllCriteriaMet) {
      setNewPasswordError('Password does not meet requirements')
      hasError = true
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your new password')
      hasError = true
    } else if (newPassword && newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match')
      hasError = true
    }

    if (hasError) return

    setIsLoading(true)

    try {
      const code = otp.join('')
      await userApi.changePassword({ code, newPassword })

      setStep('success')
      toast.success('Password changed successfully')
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      const errMsg = (err as { message?: string })?.message || 'Failed to change password'
      if (errMsg.toLowerCase().includes('code') || errMsg.toLowerCase().includes('otp')) {
        setOtp(['', '', '', '', '', ''])
        setOtpError(errMsg)
        setStep('otp')
      } else {
        setNewPasswordError(errMsg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // RENDER: IDLE VIEW (Card Section in Settings)
  if (step === 'idle') {
    return (
      <div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[10px] bg-[#566811] text-white shadow-xs">
              <Lock className="h-4.5 w-4.5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#414141]">Change Password</h3>
              <p className="text-xs text-[#7C7D74] mt-0.5">
                Ensure your account is using a secure, updated password
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep('confirm_prompt')}
            className="rounded-xl bg-[#566811] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#46550e] active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
          >
            Change Password
          </button>
        </div>
      </div>
    )
  }

  // RENDER: CONFIRMATION PROMPT ("Change password? Are you sure?")
  if (step === 'confirm_prompt') {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5ECC4] text-[#566811] mb-3 shadow-xs">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-[#414141]">Change password?</h3>
        <p className="text-xs text-[#7C7D74] mt-1.5 max-w-sm">
          Are you sure you want to change your password? We'll send a verification code to your email to continue.
        </p>

        <div className="flex items-center justify-end gap-3 mt-6 w-full">
          <button
            type="button"
            onClick={() => setStep('idle')}
            disabled={isLoading}
            className="rounded-xl border border-[#DCDBD5] bg-white px-5 py-2.5 text-xs font-semibold text-[#414141] hover:bg-[#F2F1EA] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmAndSendOtp}
            disabled={isLoading}
            className="rounded-xl bg-[#566811] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#46550e] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Confirm'}
          </button>
        </div>
      </div>
    )
  }

  // RENDER: STEP 1 - OTP VERIFICATION
  if (step === 'otp') {
    return (
      <div>
        <h3 className="text-base font-bold text-[#414141] mb-2">Enter one-time code</h3>
        <p className="text-xs text-[#7C7D74] mb-6">
          A 6-digit code has been sent to your email <span className="font-semibold text-[#414141]">{maskedEmail}</span>. Enter the code below to reset your password.
        </p>

        <form onSubmit={handleVerifyOtp} className="space-y-5">
          {/* OTP 6-Digit Boxes - Centered */}
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-2.5">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className={`h-12 w-11 rounded-xl border bg-white text-center text-lg font-bold text-[#414141] transition-all focus:outline-none ${
                    otpError
                      ? 'border-red-500 text-red-600 focus:ring-1 focus:ring-red-500'
                      : 'border-[#DCDBD5] focus:border-[#718619] focus:ring-1 focus:ring-[#718619]'
                  }`}
                />
              ))}
            </div>

            {/* Error Message */}
            {otpError && (
              <p className="text-[12px] text-red-600 font-medium mt-2 flex items-center gap-1.5 animate-in fade-in duration-150">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{otpError}</span>
              </p>
            )}

            {/* Resend Link aligned with boxes */}
            <div className="mt-3 text-xs text-[#7C7D74] text-center">
              Didn't receive code?{' '}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="font-semibold text-[#566811] hover:text-[#718619] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer transition-colors"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
              </button>
            </div>
          </div>

          {/* Action buttons on the right side */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setStep('idle')}
              disabled={isLoading}
              className="rounded-xl border border-[#DCDBD5] bg-white px-5 py-2.5 text-xs font-semibold text-[#414141] hover:bg-[#F2F1EA] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-[#566811] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#46550e] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Next'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // RENDER: STEP 2 - ENTER NEW PASSWORD
  if (step === 'enter_new') {
    return (
      <div>
        <h3 className="text-base font-bold text-[#414141] mb-2">Enter new password</h3>
        <p className="text-xs text-[#7C7D74] mb-5">
          Enter your new password to proceed with the password reset.
        </p>

        <form onSubmit={handleSubmitNewPassword} className="space-y-4">
          {/* New Password Field */}
          <div>
            <label htmlFor="modal-new-pwd-flow" className="block text-xs font-semibold text-[#414141] mb-2">
              New password
            </label>
            <div className="relative">
              <input
                id="modal-new-pwd-flow"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (newPasswordError) setNewPasswordError(null)
                }}
                placeholder="At least 8 characters"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-11 text-xs text-[#414141] placeholder:text-[#A0A09B] transition-all focus:outline-none ${
                  newPasswordError
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-[#DCDBD5] focus:border-[#718619] focus:ring-1 focus:ring-[#718619]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7C7D74] hover:text-[#414141] transition-colors cursor-pointer"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPasswordError && (
              <p className="text-[12px] text-red-600 font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-150">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{newPasswordError}</span>
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="modal-confirm-pwd-flow" className="block text-xs font-semibold text-[#414141] mb-2">
              Confirm new password
            </label>
            <div className="relative">
              <input
                id="modal-confirm-pwd-flow"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (confirmPasswordError) setConfirmPasswordError(null)
                }}
                placeholder="Repeat new password"
                className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-11 text-xs text-[#414141] placeholder:text-[#A0A09B] transition-all focus:outline-none ${
                  confirmPasswordError
                    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-[#DCDBD5] focus:border-[#718619] focus:ring-1 focus:ring-[#718619]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7C7D74] hover:text-[#414141] transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="text-[12px] text-red-600 font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-150">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{confirmPasswordError}</span>
              </p>
            )}
          </div>

          {/* Password Requirements Checklist from Design */}
          <div className="rounded-xl bg-white p-3.5 border border-[#DCDBD5]/80 space-y-1.5 text-[12px]">
            <p className="font-semibold text-[#414141] mb-1">Password must contain:</p>
            <div className={`flex items-center gap-2 ${hasMinLength ? 'text-[#718619] font-medium' : 'text-[#7C7D74]'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${hasMinLength ? 'bg-[#718619]' : 'bg-[#DCDBD5]'}`} />
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-2 ${hasUpperAndLower ? 'text-[#718619] font-medium' : 'text-[#7C7D74]'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${hasUpperAndLower ? 'bg-[#718619]' : 'bg-[#DCDBD5]'}`} />
              <span>Uppercase & lowercase letters</span>
            </div>
            <div className={`flex items-center gap-2 ${hasNumber ? 'text-[#718619] font-medium' : 'text-[#7C7D74]'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${hasNumber ? 'bg-[#718619]' : 'bg-[#DCDBD5]'}`} />
              <span>At least one number (0-9)</span>
            </div>
            <div className={`flex items-center gap-2 ${hasSpecialChar ? 'text-[#718619] font-medium' : 'text-[#7C7D74]'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${hasSpecialChar ? 'bg-[#718619]' : 'bg-[#DCDBD5]'}`} />
              <span>At least one special character (!@#$%^&*)</span>
            </div>
          </div>

          {/* Action buttons on the right side */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setStep('otp')}
              disabled={isLoading}
              className="rounded-xl border border-[#DCDBD5] bg-white px-5 py-2.5 text-xs font-semibold text-[#414141] hover:bg-[#F2F1EA] transition-colors cursor-pointer disabled:opacity-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-[#566811] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#46550e] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save password'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  // RENDER: STEP 3 - SUCCESS / YOU ARE ALL SET!
  return (
    <div className="text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E5ECC4] text-[#566811] mb-3.5 shadow-xs">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-[#414141]">You are all set!</h3>
      <p className="text-xs text-[#7C7D74] mt-1.5 max-w-sm">
        Your password has been changed successfully. You can now use your new password next time you sign in.
      </p>

      <button
        type="button"
        onClick={() => {
          handleResetFlow()
          if (onClose) onClose()
        }}
        className="mt-6 rounded-xl bg-[#566811] px-7 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#46550e] active:scale-[0.99] transition-all cursor-pointer"
      >
        Done
      </button>
    </div>
  )
}
