import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { AlertCircle, Check, ChevronLeft, Eye, EyeOff, KeyRound, Loader2, LogOut, X } from 'lucide-react'
import { useUser } from '@clerk/react'
import { toast } from 'sonner'
import { useAuthContext } from '@/context/auth-context'
import { userApi } from '@/api/user.api'
import { PasswordChecklist } from '@/components/auth/password-checklist'
import { extractClerkErrorMessage, isPasswordValid } from '@/lib/password-reset'
import { useDialogFocus } from '@/hooks/use-dialog-focus'
import { createLogger } from '@/lib/logger'
import { getInitials } from '@/lib/utils'

const logger = createLogger('SettingsModal')

type ModalView = 'profile' | 'current_password' | 'new_password'

interface AccountSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

function AccountSettingsModalContent({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { user, role, signOut, verifyCurrentPassword, updatePassword, preparePasswordReset } = useAuthContext()
  const { user: clerkUser } = useUser()

  const displayName = user?.fullName || clerkUser?.fullName || 'Administrator'
  const verifiedEmail = user?.email || clerkUser?.primaryEmailAddress?.emailAddress || ''
  const emailAddress = verifiedEmail || 'No email on file'

  const nameParts = displayName.split(' ')
  const defaultFirstName = nameParts[0] || ''
  const defaultLastName = nameParts.slice(1).join(' ') || ''

  const [view, setView] = useState<ModalView>('profile')
  const [firstName, setFirstName] = useState(defaultFirstName)
  const [lastName, setLastName] = useState(defaultLastName)
  const [savedFirstName, setSavedFirstName] = useState(defaultFirstName)
  const [savedLastName, setSavedLastName] = useState(defaultLastName)
  const [isSaving, setIsSaving] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showForgotConfirm, setShowForgotConfirm] = useState(false)

  // Password change flow state (Option B: mirrors sagana-mobile current -> new password)
  const [currentPassword, setCurrentPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null)
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [newPasswordError, setNewPasswordError] = useState(false)
  const [confirmPasswordError, setConfirmPasswordError] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const verifyAttemptRef = useRef(0)
  const forgotDialogRef = useRef<HTMLDivElement>(null)
  const forgotButtonRef = useRef<HTMLButtonElement>(null)

  useDialogFocus({
    isOpen: showForgotConfirm,
    dialogRef: forgotDialogRef,
    onClose: () => setShowForgotConfirm(false),
    restoreFocusRef: forgotButtonRef,
  })

  const userInitials = getInitials(displayName)
  const roleLabel = role === 'admin' ? 'Administrator' : 'Operator'
  const hasNameChanged = firstName.trim() !== savedFirstName || lastName.trim() !== savedLastName

  const resetPasswordState = () => {
    verifyAttemptRef.current += 1
    setIsVerifyingPassword(false)
    setCurrentPassword('')
    setShowCurrentPassword(false)
    setCurrentPasswordError(null)
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setNewPasswordError(false)
    setConfirmPasswordError(false)
    setPasswordError(null)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLogoutConfirm) {
          setShowLogoutConfirm(false)
        } else if (showForgotConfirm) {
          setShowForgotConfirm(false)
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
  }, [showLogoutConfirm, showForgotConfirm, onClose])

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault()
    if (!hasNameChanged) return
    setIsSaving(true)
    try {
      const trimmedFirst = firstName.trim()
      const trimmedLast = lastName.trim()
      const fullName = `${trimmedFirst} ${trimmedLast}`.trim()
      if (clerkUser) {
        await clerkUser.update({ firstName: trimmedFirst, lastName: trimmedLast })
      }
      await userApi.updateProfile({ fullName })
      setSavedFirstName(trimmedFirst)
      setSavedLastName(trimmedLast)
      toast.success('Profile information has been updated')
    } catch (err: unknown) {
      logger.error('Failed to save profile changes:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    onClose()
    await signOut()
  }

  const handleVerifyCurrentPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (!currentPassword.trim()) {
      setCurrentPasswordError('Please enter your current password')
      return
    }

    const attemptId = ++verifyAttemptRef.current
    setIsVerifyingPassword(true)
    setCurrentPasswordError(null)

    try {
      await verifyCurrentPassword(currentPassword)
      if (verifyAttemptRef.current !== attemptId) return
      setView('new_password')
    } catch (err: unknown) {
      if (verifyAttemptRef.current !== attemptId) return
      logger.warn('Current password verification failed:', err)
      const raw = extractClerkErrorMessage(err, 'Current password is incorrect')
      const isMismatch = /incorrect|password|invalid/i.test(raw)
      setCurrentPasswordError(isMismatch ? 'Current password is incorrect' : raw)
    } finally {
      if (verifyAttemptRef.current === attemptId) {
        setIsVerifyingPassword(false)
      }
    }
  }

  const handleUpdatePassword = async (e: FormEvent) => {
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

    if (newPassword === currentPassword) {
      setNewPasswordError(true)
      setConfirmPasswordError(false)
      setPasswordError('New password must be different from current password')
      return
    }

    if (newPassword !== confirmPassword) {
      setNewPasswordError(false)
      setConfirmPasswordError(true)
      setPasswordError("Passwords don't match")
      return
    }

    setIsUpdatingPassword(true)
    setNewPasswordError(false)
    setConfirmPasswordError(false)
    setPasswordError(null)

    try {
      await updatePassword(currentPassword, newPassword)
      resetPasswordState()
      setView('profile')
      toast.success('Password updated successfully')
    } catch (err: unknown) {
      logger.warn('Password update failed:', err)
      const raw = extractClerkErrorMessage(err, 'Failed to update password. Please try again.')
      if (/current.*password|incorrect.*password/i.test(raw)) {
        setPasswordError('Current password is incorrect')
      } else {
        setNewPasswordError(true)
        setConfirmPasswordError(true)
        setPasswordError(raw)
      }
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleForgotPasswordRedirect = async () => {
    setShowForgotConfirm(false)
    onClose()
    // ponytail: leave AuthGuard before signOut so /admin guard doesn't redirect to /sign-in
    navigate(
      verifiedEmail
        ? `/forgot-password?email=${encodeURIComponent(verifiedEmail)}&step=otp`
        : '/forgot-password',
      { replace: true }
    )

    try {
      if (verifiedEmail) {
        await preparePasswordReset(verifiedEmail)
      } else {
        await signOut({ skipRedirect: true })
      }
    } catch (err: unknown) {
      toast.error(
        extractClerkErrorMessage(err, 'Unable to send verification code. Please try again.')
      )
    }
  }

  const isPasswordFlow = view !== 'profile'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        inert={showForgotConfirm || showLogoutConfirm}
        className={`relative w-full ${
          isPasswordFlow ? 'max-w-120' : 'max-w-125'
        } rounded-[22px] sm:rounded-[28px] bg-[#F8F7F2] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 sm:px-8 py-4">
          <div className="flex items-center gap-3">
            {isPasswordFlow && (
              <button
                type="button"
                onClick={() => {
                  if (view === 'new_password') {
                    setNewPasswordError(false)
                    setConfirmPasswordError(false)
                    setPasswordError(null)
                    setView('current_password')
                  } else {
                    resetPasswordState()
                    setView('profile')
                  }
                }}
                className="flex h-9.5 w-9.5 items-center justify-center rounded-[14px] border border-border bg-transparent text-foreground hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Back"
              >
                <ChevronLeft className="h-4.5 w-4.5 stroke-[2.2]" />
              </button>
            )}
            <h2 className="text-base font-bold text-foreground">
              {isPasswordFlow ? 'Change password' : 'Account Settings'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9.5 w-9.5 items-center justify-center rounded-[14px] border border-border bg-transparent text-foreground hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5 stroke-[2.2]" />
          </button>
        </div>

        {view === 'profile' && (
          <div className="px-5 sm:px-8 pt-6 pb-8">
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
                  onClick={() => {
                    resetPasswordState()
                    setView('current_password')
                  }}
                  className="inline-flex h-9.5 items-center justify-center gap-2 rounded-[14px] border border-border bg-transparent px-4 text-xs font-bold text-foreground hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <KeyRound className="h-3.5 w-3.5 stroke-2" />
                  <span>Change password</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="inline-flex h-9.5 items-center justify-center gap-2 rounded-[14px] border border-[#E53E3E] bg-transparent px-4 text-xs font-bold text-[#E53E3E] hover:bg-[#E53E3E]/5 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 stroke-2" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'current_password' && (
          <form onSubmit={(e) => void handleVerifyCurrentPassword(e)} className="px-5 sm:px-8 pt-6 pb-8 space-y-5" noValidate>
            <div>
              <h3 className="text-lg font-bold text-foreground">Enter current password</h3>
              <p className="mt-1 text-xs text-text-email leading-relaxed">
                To protect your account, please enter your current password.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="settings-current-password" className="sr-only">
                Current password
              </label>
              <div className="relative">
                <input
                  id="settings-current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    if (currentPasswordError) setCurrentPasswordError(null)
                  }}
                  placeholder="Current password"
                  autoComplete="current-password"
                  disabled={isVerifyingPassword}
                  className={`h-12 w-full rounded-[14px] bg-transparent px-4 pr-11 text-xs outline-none transition-all disabled:opacity-50 ${
                    currentPasswordError
                      ? 'border-2 border-red-500 text-red-600 placeholder:text-red-400'
                      : 'border border-border text-foreground placeholder:text-text-secondary focus:border-primary focus:ring-1 focus:ring-primary/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-0 top-0 flex h-12 w-11 items-center justify-center text-text-secondary hover:text-foreground cursor-pointer"
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {currentPasswordError && (
                <div role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{currentPasswordError}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  ref={forgotButtonRef}
                  type="button"
                  onClick={() => setShowForgotConfirm(true)}
                  disabled={!verifiedEmail}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isVerifyingPassword || !currentPassword.trim()}
                className="inline-flex h-9.5 min-w-26 items-center justify-center gap-2 rounded-[14px] bg-primary px-5 text-xs font-bold text-white hover:bg-[#627920] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifyingPassword ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Next</span>
                )}
              </button>
            </div>
          </form>
        )}

        {view === 'new_password' && (
          <form onSubmit={(e) => void handleUpdatePassword(e)} className="px-5 sm:px-8 pt-6 pb-8 space-y-4" noValidate>
            <div>
              <h3 className="text-lg font-bold text-foreground">Reset password</h3>
              <p className="mt-1 text-xs text-text-email leading-relaxed">
                Your new password must be different from your current password and contain at least 12 characters.
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <input
                  id="settings-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (newPasswordError) setNewPasswordError(false)
                    if (passwordError) setPasswordError(null)
                  }}
                  placeholder="New password"
                  autoComplete="new-password"
                  disabled={isUpdatingPassword}
                  className={`h-12 w-full rounded-[14px] bg-transparent px-4 pr-11 text-xs outline-none transition-all disabled:opacity-50 ${
                    newPasswordError
                      ? 'border-2 border-red-500 text-red-600 placeholder:text-red-400'
                      : 'border border-border text-foreground placeholder:text-text-secondary focus:border-primary focus:ring-1 focus:ring-primary/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-0 top-0 flex h-12 w-11 items-center justify-center text-text-secondary hover:text-foreground cursor-pointer"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <div className="relative">
                <input
                  id="settings-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (confirmPasswordError) setConfirmPasswordError(false)
                    if (passwordError) setPasswordError(null)
                  }}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  disabled={isUpdatingPassword}
                  className={`h-12 w-full rounded-[14px] bg-transparent px-4 pr-11 text-xs outline-none transition-all disabled:opacity-50 ${
                    confirmPasswordError
                      ? 'border-2 border-red-500 text-red-600 placeholder:text-red-400'
                      : 'border border-border text-foreground placeholder:text-text-secondary focus:border-primary focus:ring-1 focus:ring-primary/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-0 flex h-12 w-11 items-center justify-center text-text-secondary hover:text-foreground cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <PasswordChecklist password={newPassword} hasError={newPasswordError} />

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="inline-flex h-9.5 min-w-26 items-center justify-center gap-2 rounded-[14px] bg-primary px-5 text-xs font-bold text-white hover:bg-[#627920] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Finish</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {showForgotConfirm && (
        <>
          <div
            className="fixed inset-0 z-60 bg-black/40"
            onClick={() => setShowForgotConfirm(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <div
              ref={forgotDialogRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="forgot-confirm-title"
              tabIndex={-1}
              className="w-full max-w-85 rounded-[22px] sm:rounded-[28px] bg-white p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 text-center outline-none"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] sm:rounded-[18px] bg-brand-100">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <p id="forgot-confirm-title" className="text-sm font-bold text-foreground mb-1.5">
                Reset via email code?
              </p>
              <p className="text-xs text-text-email mb-6">
                You&apos;ll be signed out to verify a one-time code sent to {verifiedEmail}.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowForgotConfirm(false)}
                  className="h-9 rounded-full border border-border bg-[#F5F5F3] text-xs font-semibold text-foreground hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleForgotPasswordRedirect()}
                  className="h-9 rounded-full bg-primary text-xs font-bold text-white hover:bg-[#627920] transition-colors cursor-pointer"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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
  const displayName = user?.fullName || clerkUser?.fullName || 'Administrator'

  if (!isOpen) return null

  return <AccountSettingsModalContent key={displayName} onClose={onClose} />
}

export { AccountSettingsModal as SettingsModal }
export default AccountSettingsModal
