import { useState, useMemo } from 'react'
import { X, Archive, Check, Loader2 } from 'lucide-react'
import { formatBirthday, type OperatorAccount } from '@/api/operator.api'

interface UserInfoModalProps {
  isOpen: boolean
  operator: OperatorAccount | null
  onClose: () => void
  onSave: (
    operator: OperatorAccount,
    data: { firstName: string; lastName: string; birthday: string }
  ) => Promise<void>
  onArchive: (operator: OperatorAccount) => Promise<void>
}

function formatDateDisplay(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

function UserInfoModalContent({
  operator,
  onClose,
  onSave,
  onArchive,
}: {
  operator: OperatorAccount
  onClose: () => void
  onSave: (
    operator: OperatorAccount,
    data: { firstName: string; lastName: string; birthday: string }
  ) => Promise<void>
  onArchive: (operator: OperatorAccount) => Promise<void>
}) {
  const [firstName, setFirstName] = useState(operator.firstName || '')
  const [lastName, setLastName] = useState(operator.lastName || '')
  const [birthday, setBirthday] = useState(() => formatBirthday(operator.birthday))
  const [isSaving, setIsSaving] = useState(false)
  const [isArchiving, setIsArchiving] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  const initialBirthday = useMemo(
    () => formatBirthday(operator.birthday),
    [operator.birthday]
  )

  const hasChanges = useMemo(() => {
    return (
      firstName.trim() !== (operator.firstName || '').trim() ||
      lastName.trim() !== (operator.lastName || '').trim() ||
      birthday.trim() !== initialBirthday.trim()
    )
  }, [operator, firstName, lastName, birthday, initialBirthday])

  const handleDiscard = () => {
    setFirstName(operator.firstName || '')
    setLastName(operator.lastName || '')
    setBirthday(initialBirthday)
  }

  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value

    const digitsOnly = val.replace(/\D/g, '')
    if (
      val.length > birthday.length &&
      (digitsOnly.length === 2 || digitsOnly.length === 4) &&
      !val.endsWith('/')
    ) {
      setBirthday(val + '/')
      return
    }

    setBirthday(val.replace(/[^\d/]/g, '').slice(0, 10))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSave(operator, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        birthday: birthday.trim(),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleArchiveConfirm = async () => {
    try {
      setIsArchiving(true)
      await onArchive(operator)
      setShowArchiveConfirm(false)
      onClose()
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="fixed inset-0"
          onClick={isSaving ? undefined : onClose}
          aria-hidden="true"
        />

        <div className="relative w-full max-w-196.5 max-h-[90vh] overflow-y-auto rounded-[28px] bg-[#F8F7F2] shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5 border-b border-border">
            <h2 className="text-base font-bold text-foreground">
              User Information
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-transparent text-foreground hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4.5 w-4.5 stroke-[2.2]" />
            </button>
          </div>

          <div className="px-5 sm:px-8 py-5 sm:py-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-transparent px-4 sm:px-5 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-transparent px-4 sm:px-5 text-xs text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Date of Birth
              </label>
              <input
                type="text"
                value={birthday}
                onChange={handleBirthdayChange}
                placeholder="mm/dd/yyyy"
                className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-transparent px-4 sm:px-5 text-xs text-foreground placeholder:text-text-secondary outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                  Date Joined
                </label>
                <div className="flex h-11 sm:h-13 w-full items-center rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 text-xs text-text-email">
                  {formatDateDisplay(operator.dateJoined)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                  Barangay
                </label>
                <div className="flex h-11 sm:h-13 w-full items-center rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 text-xs text-text-email">
                  {operator.barangay}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Email Address
              </label>
              <div className="flex h-11 sm:h-13 w-full items-center rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 text-xs text-text-email truncate">
                {operator.email}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Account Creation Method
              </label>
              <div className="flex h-11 sm:h-13 w-full items-center rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 text-xs text-text-email">
                {operator.accountCreationMethod || 'Google'}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between px-5 sm:px-8 py-4 sm:py-5 border-t border-border">
            <button
              type="button"
              onClick={() => setShowArchiveConfirm(true)}
              disabled={isSaving}
              className="flex h-9 items-center justify-center gap-2 rounded-full border border-border bg-transparent px-4 text-xs font-bold text-foreground hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Archive className="h-4 w-4 stroke-[2.2]" />
              <span>Archive</span>
            </button>

            {hasChanges && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={isSaving}
                  className="flex h-9 flex-1 sm:flex-none items-center justify-center gap-2 rounded-full border border-border bg-transparent px-4 text-xs font-bold text-foreground hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="h-4 w-4 stroke-[2.2]" />
                  <span>Discard</span>
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex h-9 flex-1 sm:flex-none items-center justify-center gap-2 rounded-full bg-primary hover:bg-[#627515] active:bg-[#536312] px-4 text-xs font-bold text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showArchiveConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-105 rounded-[28px] bg-[#F8F7F2] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBDDDD] text-destructive">
                <Archive className="h-6 w-6 stroke-[2.2]" />
              </div>
            </div>

            <h3 className="text-center text-base font-bold text-foreground">
              Archive this account?
            </h3>

            <p className="mt-3 text-center text-xs leading-relaxed text-foreground">
              This operator won’t be able to log in, and the account will go the the archives list.
            </p>

            <div className="mt-7 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowArchiveConfirm(false)}
                disabled={isArchiving}
                className="flex-1 h-12 rounded-full border border-border bg-transparent text-xs font-bold text-foreground hover:bg-black/5 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchiveConfirm}
                disabled={isArchiving}
                className="flex-1 h-12 rounded-full bg-destructive hover:bg-[#d63f3f] active:bg-[#c43636] text-xs font-bold text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isArchiving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Archiving...</span>
                  </>
                ) : (
                  <span>Yes, archive</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function UserInfoModal({
  isOpen,
  operator,
  onClose,
  onSave,
  onArchive,
}: UserInfoModalProps) {
  if (!isOpen || !operator) return null

  return (
    <UserInfoModalContent
      key={`${operator.id}-${operator.name}-${operator.birthday ?? ''}`}
      operator={operator}
      onClose={onClose}
      onSave={onSave}
      onArchive={onArchive}
    />
  )
}
