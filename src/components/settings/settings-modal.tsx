import { useState, useEffect, useRef, type FormEvent, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Check, ChevronLeft, KeyRound, LogOut, X } from 'lucide-react'
import { useUser } from '@clerk/react'
import { toast } from 'sonner'
import { useAuthContext } from '@/context/auth-context'
import { userApi } from '@/api/user.api'

type ModalView = 'main' | 'otp' | 'reset-password'

function getUserInitials(fullName?: string | null) {
  if (!fullName) return 'A'
  return fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface AccountSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

function AccountSettingsModalContent({ onClose }: { onClose: () => void }) {
  const { user, role, signOut } = useAuthContext()
  const { user: clerkUser } = useUser()

  const displayName = user?.fullName || clerkUser?.fullName || 'Alex Morgan'
  const emailAddress = user?.email || clerkUser?.primaryEmailAddress?.emailAddress || 'alex.morgan@example.com'

  const nameParts = displayName.split(' ')
  const defaultFirstName = nameParts[0] || ''
  const defaultLastName = nameParts.slice(1).join(' ') || ''

  const [view, setView] = useState<ModalView>('main')
  const [firstName, setFirstName] = useState(defaultFirstName)
  const [lastName, setLastName] = useState(defaultLastName)
  const [savedFirstName, setSavedFirstName] = useState(defaultFirstName)
  const [savedLastName, setSavedLastName] = useState(defaultLastName)
  const [isSaving, setIsSaving] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)


  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isOtpLoading, setIsOtpLoading] = useState(false)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])


  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  const userInitials = getUserInitials(displayName)
  const roleLabel = role === 'admin' ? 'Administrator' : 'Operator'
  const hasNameChanged = firstName.trim() !== savedFirstName || lastName.trim() !== savedLastName


  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLogoutConfirm) {
          setShowLogoutConfirm(false)
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [showLogoutConfirm, onClose])


  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((p) => p - 1), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])


  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault()
    if (!hasNameChanged) return
    setIsSaving(true)
    try {
      const trimmedFirst = firstName.trim()
      const trimmedLast = lastName.trim()
      const fullName = `${trimmedFirst} ${trimmedLast}`.trim()
      try {
        if (clerkUser) {
          await clerkUser.update({ firstName: trimmedFirst, lastName: trimmedLast })
        }
        await userApi.updateProfile({ fullName })
      } catch { /* noop */ }
      setSavedFirstName(trimmedFirst)
      setSavedLastName(trimmedLast)
      toast.success('Profile information has been updated')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePasswordClick = async () => {
    setIsOtpLoading(true)
    try {
      await userApi.sendPasswordOtp()
    } catch { /* noop */ } finally {
      setIsOtpLoading(false)
      setOtp(['', '', '', '', '', ''])
      setOtpError(null)
      setResendCooldown(30)
      setView('otp')
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    try {
      await userApi.sendPasswordOtp()
    } catch { /* noop */ } finally {
      setResendCooldown(30)
      setOtp(['', '', '', '', '', ''])
      setOtpError(null)
      toast.info('Verification code sent')
      otpRefs.current[0]?.focus()
    }
  }

  const verifyCode = async (code: string) => {
    setIsOtpLoading(true)
    try {
      await userApi.verifyPasswordOtp(code)
    } catch { /* noop */ } finally {
      setIsOtpLoading(false)
      setView('reset-password')
    }
  }

  const handleOtpChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '')
    const next = [...otp]
    if (val.length > 1) {
      val.slice(0, 6).split('').forEach((ch, i) => {
        if (i < 6) next[i] = ch
      })
      setOtp(next)
      setOtpError(null)
      const full = next.join('')
      if (full.length === 6) {
        void verifyCode(full)
      } else {
        otpRefs.current[Math.min(val.length, 5)]?.focus()
      }
      return
    }
    next[index] = val ? val[val.length - 1] : ''
    setOtp(next)
    setOtpError(null)
    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
    const full = next.join('')
    if (full.length === 6) {
      void verifyCode(full)
    }
  }

  const handleOtpKeyDown = (index: number, e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleFinishReset = async (e: FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setIsResetting(true)
    try {
      const code = otp.join('')
      await userApi.changePassword({ code, newPassword })
    } catch { /* noop */ } finally {
      setIsResetting(false)
      toast.success('Password has been changed')
      setView('main')
      setNewPassword('')
      setConfirmPassword('')
      setOtp(['', '', '', '', '', ''])
    }
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    onClose()
    await signOut()
  }


  const headerTitle = view === 'main' ? 'Account Settings' : 'Change password'
  const showBack = view !== 'main'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-125 rounded-[22px] sm:rounded-[28px] bg-[#F8F7F2] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 sm:px-8 pt-7 pb-2">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                type="button"
                onClick={() => setView('main')}
                className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-transparent text-foreground hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Back"
              >
                <ChevronLeft className="h-4.5 w-4.5 stroke-[2.2]" />
              </button>
            )}
            <h2 className="text-base font-bold text-foreground">{headerTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-transparent text-foreground hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5 stroke-[2.2]" />
          </button>
        </div>

        <div className="px-5 sm:px-8 pt-4 pb-8">
          {view === 'main' && (
            <div className="space-y-4.5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-b from-[#C9E752] to-positive text-sm font-bold text-white shadow-xs">
                  {userInitials}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground leading-tight">{displayName}</p>
                  <p className="text-xs text-text-email mt-0.5">{roleLabel}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-transparent px-4 sm:px-5 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-transparent px-4 sm:px-5 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Email Address</label>
                <div className="flex h-11 sm:h-13 w-full items-center rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 text-xs text-text-email">
                  {emailAddress}
                </div>
              </div>

              {hasNameChanged && (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => void handleSaveChanges(e)}
                    disabled={isSaving}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary bg-transparent px-5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Check className="h-4 w-4 stroke-[2.5]" />
                    <span>{isSaving ? 'Saving...' : 'Save changes'}</span>
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => void handleChangePasswordClick()}
                  disabled={isOtpLoading}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-transparent px-4.5 text-xs font-semibold text-foreground hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="h-3.5 w-3.5 stroke-2" />
                  <span>{isOtpLoading ? 'Sending...' : 'Change password'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-[#E53E3E] bg-transparent px-4.5 text-xs font-semibold text-[#E53E3E] hover:bg-[#E53E3E]/5 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 stroke-2" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}

          {view === 'otp' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-foreground">Enter one-time code</h3>
                <p className="text-xs text-text-email mt-1.5 leading-relaxed">
                  To reset your password kindly check your email for an OTP and enter it here.
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpRefs.current[idx] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`h-12 sm:h-13 w-full max-w-13 rounded-[14px] sm:rounded-[18px] border bg-[#F5F5F3] text-center text-lg font-bold text-foreground transition-all focus:outline-none ${otpError
                        ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-border focus:border-primary focus:bg-transparent focus:ring-1 focus:ring-primary/20'
                      }`}
                  />
                ))}
              </div>

              {otpError && (
                <p className="text-xs text-red-600 font-medium">{otpError}</p>
              )}

              <p className="text-xs text-text-email">
                Didn't receive any code?{' '}
                <button
                  type="button"
                  onClick={() => void handleResendOtp()}
                  disabled={resendCooldown > 0}
                  className="font-bold text-primary hover:underline disabled:opacity-50 cursor-pointer"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                </button>
              </p>
            </div>
          )}

          {view === 'reset-password' && (
            <form onSubmit={(e) => void handleFinishReset(e)} className="space-y-4.5">
              <div>
                <h3 className="text-base font-bold text-foreground">Reset password</h3>
                <p className="text-xs text-text-email mt-1.5 leading-relaxed">
                  Your new password must be different from previous passwords and contain at least 8 characters.
                </p>
              </div>

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-transparent px-4 sm:px-5 text-xs text-foreground placeholder:text-[#A0A09B] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-transparent px-4 sm:px-5 text-xs text-foreground placeholder:text-[#A0A09B] outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
              />

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isResetting || !newPassword || !confirmPassword}
                  className="h-9 rounded-full bg-primary px-7 text-xs font-bold text-white shadow-xs hover:bg-[#627515] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isResetting ? 'Saving...' : 'Finish'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Log out confirmation sub-dialog */}
      {showLogoutConfirm && (
        <>
          <div
            className="fixed inset-0 z-60 bg-black/40"
            onClick={() => setShowLogoutConfirm(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <div className="w-full max-w-85 rounded-[22px] sm:rounded-[28px] bg-white p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] sm:rounded-[18px] bg-[#FEE2E2]">
                <LogOut className="h-5 w-5 text-[#E53E3E]" />
              </div>
              <p className="text-sm font-bold text-foreground mb-6">
                Log out of this account?
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="h-9 rounded-full border border-border bg-[#F5F5F3] text-xs font-semibold text-foreground hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="h-9 rounded-full bg-[#E53E3E] text-xs font-bold text-white hover:bg-[#C53030] transition-colors cursor-pointer"
                >
                  Yes, log out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function AccountSettingsModal({ isOpen, onClose }: AccountSettingsModalProps) {
  const { user } = useAuthContext()
  const { user: clerkUser } = useUser()
  const displayName = user?.fullName || clerkUser?.fullName || 'Alex Morgan'

  if (!isOpen) return null

  return <AccountSettingsModalContent key={displayName} onClose={onClose} />
}

// Export both named and default for backward compatibility
export { AccountSettingsModal as SettingsModal }
export default AccountSettingsModal
