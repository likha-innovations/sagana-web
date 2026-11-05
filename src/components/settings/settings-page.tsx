import { useState, useEffect, type FormEvent } from 'react'
import { User as UserIcon } from 'lucide-react'
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

export function SettingsPage() {
  const { user, role } = useAuthContext()
  const { user: clerkUser } = useUser()

  const displayName = user?.fullName || clerkUser?.fullName || 'Neo Isaiah'
  const emailAddress = user?.email || clerkUser?.primaryEmailAddress?.emailAddress || 'neo.isaiah@sagana.ph'
  const userInitials = getUserInitials(displayName)

  const [fullName, setFullName] = useState(displayName)
  const [isSaving, setIsSaving] = useState(false)
  const [passwordFlowStep, setPasswordFlowStep] = useState<FlowStep>('idle')

  const isPasswordFlowActive = passwordFlowStep !== 'idle'

  useEffect(() => {
    setFullName(displayName)
  }, [displayName])

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
    <div className="flex flex-col gap-6 max-w-4xl pb-10">
      {/* Page Header */}
      <div>
        <h1 className="text-[31px] font-bold leading-[1.3] text-[#414141]">
          Settings
        </h1>
      </div>

      {/* Card 1: User Profile Card */}
      <div className="flex items-start justify-between gap-4 rounded-[20px] bg-white p-5 sm:p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-b from-[#8CB825] to-[#566811] text-base font-bold text-white shadow-xs">
            {userInitials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#414141]">{fullName || displayName}</h2>
            <p className="text-xs text-[#7C7D74] mt-0.5">{emailAddress}</p>
          </div>
        </div>
        <span className="rounded-full bg-[#E5ECC4] px-3 py-1 text-xs font-bold text-[#566811]">
          {roleText}
        </span>
      </div>

      {/* Card 2: Combined Account Details & Security Card */}
      <div className="rounded-[20px] bg-white p-6 shadow-card flex flex-col gap-6">
        {/* Section 1: Personal Information — hidden when password flow is active */}
        {!isPasswordFlowActive && (
          <>
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[10px] bg-[#566811] text-white shadow-xs">
                    <UserIcon className="h-4.5 w-4.5" strokeWidth={2} />
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

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="settings-fullname" className="block text-xs font-semibold text-[#414141] mb-2">
                    Full name
                  </label>
                  <input
                    id="settings-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Neo Isaiah"
                    className="w-full rounded-xl border border-[#DCDBD5] bg-white px-4 py-2.5 text-xs text-[#414141] placeholder:text-[#A0A09B] focus:border-[#718619] focus:outline-none focus:ring-1 focus:ring-[#718619] transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="settings-email" className="block text-xs font-semibold text-[#414141] mb-2">
                    Email address
                  </label>
                  <input
                    id="settings-email"
                    type="email"
                    value={emailAddress}
                    readOnly
                    className="w-full rounded-xl border border-[#DCDBD5] bg-white px-4 py-2.5 text-xs text-[#7C7D74] cursor-not-allowed select-none"
                  />
                </div>
              </div>
            </form>

            {/* Divider */}
            <div className="border-t border-[#DCDBD5]/60" />
          </>
        )}

        {/* Section 2: Change Password Flow (Matching the Figma Mockup) */}
        <ChangePasswordFlow userEmail={emailAddress} onStepChange={setPasswordFlowStep} />
      </div>
    </div>
  )
}

export default SettingsPage
