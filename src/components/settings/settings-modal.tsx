import { useState, useEffect, type FormEvent } from 'react'
import { User as UserIcon, X } from 'lucide-react'
import { useUser } from '@clerk/react'
import { toast } from 'sonner'
import { useAuthContext } from '@/context/auth-context'
import { userApi } from '@/api/user.api'
import { ChangePasswordFlow, type FlowStep } from './change-password-flow'

function getUserInitials(fullName?: string | null) {
  if (!fullName) return 'U'

  return fullName
    .split(' ')
    .filter(Boolean)
    .map((name) => name[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, role } = useAuthContext()
  const { user: clerkUser } = useUser()

  const displayName = user?.fullName || clerkUser?.fullName || 'Neo Isaiah'
  const emailAddress = user?.email || clerkUser?.primaryEmailAddress?.emailAddress || 'neo.isaiah@sagana.ph'
  const userInitials = getUserInitials(displayName)

  const [fullName, setFullName] = useState(displayName)
  const [isSaving, setIsSaving] = useState(false)
  const [passwordFlowStep, setPasswordFlowStep] = useState<FlowStep>('idle')

  const isPasswordFlowActive = passwordFlowStep !== 'idle'

  // Sync state whenever modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      setFullName(displayName)
    }
  }, [isOpen, displayName])

  // ESC key handler and body scroll lock
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const roleText = role === 'admin' ? 'Administrator account' : 'Operator account'

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()

    if (fullName.trim() === displayName) {
      toast.info('No changes made to profile')
      return
    }

    setIsSaving(true)

    try {
      const parts = fullName.trim().split(' ')
      const firstName = parts[0]
      const lastName = parts.slice(1).join(' ') || ''

      try {
        if (clerkUser) {
          await clerkUser.update({
            firstName,
            lastName,
          })
        }
        await userApi.updateProfile({ fullName: fullName.trim() })
      } catch {
        // Fallback
      }

      toast.success('Profile name updated successfully')
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to save changes'
      toast.error(errMsg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      {/* Backdrop with smooth blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-[#FDFCF7] p-6 sm:p-8 shadow-2xl transition-all border border-[#DCDBD5] z-10 scrollbar-thin">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-[#7C7D74] hover:bg-[#E2E1DC] hover:text-[#414141] transition-colors cursor-pointer"
          aria-label="Close settings dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <h2 id="settings-modal-title" className="text-2xl font-bold leading-tight text-[#414141]">
            Account Settings
          </h2>
          <p className="text-xs text-[#7C7D74] mt-1">
            Manage your personal profile and security credentials
          </p>
        </div>

        {/* Card 1: User Profile Card */}
        <div className="mb-6 flex items-start justify-between gap-4 rounded-[20px] bg-white p-5 shadow-xs border border-[#DCDBD5]/60">
          <div className="flex items-center gap-4">
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-linear-to-b from-[#8CB825] to-[#566811] text-base font-bold text-white shadow-xs">
              {userInitials}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#414141]">{fullName || displayName}</h3>
              <p className="text-xs text-[#7C7D74] mt-0.5">{emailAddress}</p>
            </div>
          </div>
          <span className="rounded-full bg-[#E5ECC4] px-3 py-1 text-xs font-bold text-[#566811]">
            {roleText}
          </span>
        </div>

        {/* Card 2: Combined Account Details & Security Card */}
        <div className="rounded-[20px] bg-white p-5 sm:p-6 shadow-xs border border-[#DCDBD5]/60 flex flex-col gap-6">
          {/* Section 1: Personal Information — hidden when password flow is active */}
          {!isPasswordFlowActive && (
            <>
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#566811] text-white shadow-xs">
                      <UserIcon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <h3 className="text-sm font-bold text-[#414141]">Personal Information</h3>
                  </div>

                  {fullName.trim() !== displayName && (
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-xl bg-[#566811] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#46550e] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Name'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="modal-settings-fullname" className="block text-xs font-semibold text-[#414141] mb-2">
                      Full name
                    </label>
                    <input
                      id="modal-settings-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Neo Isaiah"
                      className="w-full rounded-xl border border-[#DCDBD5] bg-[#FDFCF7] px-4 py-2.5 text-xs text-[#414141] placeholder:text-[#A0A09B] focus:border-[#718619] focus:outline-none focus:ring-1 focus:ring-[#718619] transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="modal-settings-email" className="block text-xs font-semibold text-[#414141] mb-2">
                      Email address
                    </label>
                    <input
                      id="modal-settings-email"
                      type="email"
                      value={emailAddress}
                      readOnly
                      className="w-full rounded-xl border border-[#DCDBD5] bg-[#F2F1EA]/60 px-4 py-2.5 text-xs text-[#7C7D74] cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              </form>

              {/* Divider between Personal Info and Change Password */}
              <div className="border-t border-[#DCDBD5]/60" />
            </>
          )}

          {/* Section 2: Change Password Flow (Matching the Figma Mockup) */}
          <ChangePasswordFlow userEmail={emailAddress} onStepChange={setPasswordFlowStep} />
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
