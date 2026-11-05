import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import type { OperatorAccount } from '@/api/operator.api'

interface SuspendOperatorModalProps {
  operator: OperatorAccount | null
  isOpen: boolean
  onClose: () => void
  onConfirm: (operator: OperatorAccount, newStatus: 'active' | 'suspended') => Promise<void>
}

export function SuspendOperatorModal({
  operator,
  isOpen,
  onClose,
  onConfirm,
}: SuspendOperatorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !operator) return null

  const isSuspended = operator.status === 'suspended'
  const targetStatus = isSuspended ? 'active' : 'suspended'

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true)
      await onConfirm(operator, targetStatus)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0"
        onClick={isSubmitting ? undefined : onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[420px] rounded-[24px] bg-white p-6 shadow-2xl border border-[#DCDBD5] animate-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="flex justify-center mb-3.5">
          {isSuspended ? (
            <div className="flex h-13 w-13 items-center justify-center rounded-full bg-[#E4F4D6] text-[#3D7826] border border-[#BCE6A3]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          ) : (
            <div className="flex h-13 w-13 items-center justify-center rounded-full bg-[#FFEAEB] text-[#D92D20] border border-[#F8C1C4]">
              <AlertTriangle className="h-6 w-6" />
            </div>
          )}
        </div>

        {/* Modal Header */}
        <h3 className="text-center text-[18px] font-semibold text-[#333333]">
          {isSuspended ? 'Activate Operator Account?' : 'Suspend Operator Account?'}
        </h3>

        <p className="mt-2 text-center text-[13px] leading-relaxed text-[#666666]">
          {isSuspended ? (
            <>
              Are you sure you want to activate{' '}
              <span className="font-medium text-[#333333]">{operator.name}</span>?
              They will regain access to their account.
            </>
          ) : (
            <>
              Are you sure you want to suspend{' '}
              <span className="font-medium text-[#333333]">{operator.name}</span>?
              They will no longer have access to the system.
            </>
          )}
        </p>

        {/* Action Buttons: "Cancel" and "Yes, suspend" / "Yes, activate" */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-[46px] rounded-[14px] border border-[#DCDBD5] bg-white text-[13px] font-medium text-[#555555] hover:bg-[#F7F6F1] transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`flex-1 h-[46px] rounded-[14px] text-[13px] font-medium text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 ${
              isSuspended
                ? 'bg-[#718619] hover:bg-[#627515] active:bg-[#536312]'
                : 'bg-[#D92D20] hover:bg-[#B42318] active:bg-[#912018]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isSuspended ? 'Activating...' : 'Suspending...'}</span>
              </>
            ) : isSuspended ? (
              <span>Yes, activate</span>
            ) : (
              <span>Yes, suspend</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

