import { useState, useMemo } from 'react'
import {
  X,
  Archive,
  Search,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Loader2,
  Mail,
  MapPin,
} from 'lucide-react'
import type { OperatorAccount } from '@/api/operator.api'

interface ArchiveSidePanelProps {
  isOpen: boolean
  onClose: () => void
  archivedAccounts: OperatorAccount[]
  isLoading?: boolean
  onRestore: (accounts: OperatorAccount[]) => Promise<void>
  onDelete: (accounts: OperatorAccount[]) => Promise<void>
}

export function ArchiveSidePanel({
  isOpen,
  onClose,
  archivedAccounts,
  isLoading = false,
  onRestore,
  onDelete,
}: ArchiveSidePanelProps) {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    type: 'restore' | 'delete'
    accounts: OperatorAccount[]
  } | null>(null)
  const [deleteInput, setDeleteInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Safe list of archived accounts
  const safeAccounts = useMemo(
    () => (Array.isArray(archivedAccounts) ? archivedAccounts : []),
    [archivedAccounts]
  )

  // Filter archived accounts by search
  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return safeAccounts
    return safeAccounts.filter((op) => {
      const name = op?.name?.toLowerCase() || ''
      const email = op?.email?.toLowerCase() || ''
      const barangay = op?.barangay?.toLowerCase() || ''
      return name.includes(q) || email.includes(q) || barangay.includes(q)
    })
  }, [safeAccounts, search])

  // Selected accounts memo
  const selectedAccounts = useMemo(
    () => safeAccounts.filter((a) => selectedIds.has(a.id)),
    [safeAccounts, selectedIds]
  )

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === filteredAccounts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredAccounts.map((a) => a.id)))
    }
  }

  // Prompt actions
  const promptRestore = (accounts: OperatorAccount[]) => {
    setConfirmModal({ type: 'restore', accounts })
  }

  const promptDelete = (accounts: OperatorAccount[]) => {
    setDeleteInput('')
    setConfirmModal({ type: 'delete', accounts })
  }

  if (!isOpen) return null

  // Execution
  const handleExecuteRestore = async () => {
    if (!confirmModal || confirmModal.type !== 'restore') return
    try {
      setIsProcessing(true)
      await onRestore(confirmModal.accounts)
      // Clear selection for restored accounts
      setSelectedIds((prev) => {
        const next = new Set(prev)
        confirmModal.accounts.forEach((a) => next.delete(a.id))
        return next
      })
      setConfirmModal(null)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExecuteDelete = async () => {
    if (!confirmModal || confirmModal.type !== 'delete') return
    if (deleteInput.trim().toLowerCase() !== 'delete') return
    try {
      setIsProcessing(true)
      await onDelete(confirmModal.accounts)
      // Clear selection for deleted accounts
      setSelectedIds((prev) => {
        const next = new Set(prev)
        confirmModal.accounts.forEach((a) => next.delete(a.id))
        return next
      })
      setConfirmModal(null)
      setDeleteInput('')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      {/* Side Panel Overlay & Drawer */}
      <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="relative w-screen max-w-[460px] bg-[#F7F6F1] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header (Page background, no divider line) */}
            <div className="flex items-center justify-between px-6 pt-6 pb-3 bg-[#F7F6F1]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E5ECC4] text-[#566811]">
                  <Archive className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold text-[#333333] leading-tight">
                    Archived Accounts
                  </h2>
                  <p className="text-[12px] text-[#7C7D74] mt-0.5">
                    {safeAccounts.length}{' '}
                    {safeAccounts.length === 1 ? 'suspended operator' : 'suspended operators'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#7C7D74] hover:bg-[#EAE8E0] hover:text-[#414141] transition-colors cursor-pointer"
                aria-label="Close archive panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* White Container Card circling the search and suspended accounts */}
            <div className="flex-1 min-h-0 mx-5 mb-5 flex flex-col rounded-[20px] bg-white border border-[#DCDBD5] p-4.5 shadow-sm overflow-hidden">
              {/* Internal Search */}
              <div className="relative mb-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search suspended accounts..."
                  className="h-11 w-full rounded-xl border border-[#DCDBD5] bg-white px-3.5 pr-10 text-[13px] text-[#414141] placeholder:text-[#AFAEA7] outline-none transition-all focus:border-[#718619] focus:ring-1 focus:ring-[#718619]/25"
                />
                <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C7D74]" />
              </div>

              {/* Batch / Bulk Actions Bar */}
              {safeAccounts.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 text-[13px]">
                  {/* Select All Checkbox */}
                  <label className="flex items-center gap-2.5 text-[#555555] hover:text-[#414141] transition-colors cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedIds.size > 0 && selectedIds.size === filteredAccounts.length}
                      onChange={handleSelectAll}
                      aria-label="Select all archived accounts"
                      className="appearance-none h-5 w-5 min-h-5 min-w-5 rounded-lg border border-[#DCDBD5] bg-white checked:bg-[#718619] checked:border-[#718619] cursor-pointer transition-colors relative after:content-[''] after:absolute after:left-1.5 after:top-0.5 after:w-1.5 after:h-2.5 after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:opacity-0 checked:after:opacity-100"
                    />
                    <span>
                      Select all ({filteredAccounts.length})
                    </span>
                  </label>

                  {/* Bulk Action Buttons (Icon only, no box circling) */}
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        promptRestore(selectedIds.size > 0 ? selectedAccounts : filteredAccounts)
                      }
                      title={selectedIds.size > 0 ? `Restore selected (${selectedIds.size})` : 'Restore all'}
                      aria-label={selectedIds.size > 0 ? `Restore selected (${selectedIds.size})` : 'Restore all'}
                      className="flex items-center gap-1 text-[#718619] hover:text-[#566811] transition-colors cursor-pointer p-0.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {selectedIds.size > 0 && (
                        <span className="text-[12px] font-medium leading-none">
                          ({selectedIds.size})
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        promptDelete(selectedIds.size > 0 ? selectedAccounts : filteredAccounts)
                      }
                      title={selectedIds.size > 0 ? `Delete selected (${selectedIds.size})` : 'Delete all'}
                      aria-label={selectedIds.size > 0 ? `Delete selected (${selectedIds.size})` : 'Delete all'}
                      className="flex items-center gap-1 text-[#D92D20] hover:text-[#B42318] transition-colors cursor-pointer p-0.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {selectedIds.size > 0 && (
                        <span className="text-[12px] font-medium leading-none">
                          ({selectedIds.size})
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* List of Suspended Accounts */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-[#7C7D74]">
                    <Loader2 className="h-8 w-8 animate-spin text-[#718619]" />
                    <p className="mt-3 text-[13px]">Loading archived accounts...</p>
                  </div>
                ) : filteredAccounts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-[#DCDBD5] text-[#AFAEA7]">
                      <Archive className="h-7 w-7" />
                    </div>
                    <h3 className="mt-3.5 text-[15px] font-semibold text-[#333333]">
                      {search ? 'No matching accounts' : 'No archived accounts'}
                    </h3>
                    <p className="mt-1 text-[13px] text-[#7C7D74] max-w-[280px]">
                      {search
                        ? 'Try adjusting your search query'
                        : 'When you suspend an operator account, it will appear here.'}
                    </p>
                  </div>
                ) : (
                  filteredAccounts.map((account) => {
                    const isSelected = selectedIds.has(account.id)
                    const initials =
                      (account.name || 'OP')
                        .split(' ')
                        .filter(Boolean)
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'OP'

                    return (
                      <div
                        key={account.id}
                        className={`relative w-full flex items-start gap-3 rounded-[16px] border p-3.5 transition-all ${
                          isSelected
                            ? 'border-[#718619] bg-[#FAF9F0] shadow-xs'
                            : 'border-[#DCDBD5] bg-white hover:border-[#B5B4AC]'
                        }`}
                      >
                        {/* Checkbox for selecting 1 or 2 */}
                        <label className="mt-1 flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(account.id)}
                            aria-label={`Select ${account.name}`}
                            className="appearance-none h-5 w-5 min-h-5 min-w-5 rounded-lg border border-[#DCDBD5] bg-white checked:bg-[#718619] checked:border-[#718619] cursor-pointer transition-colors relative after:content-[''] after:absolute after:left-1.5 after:top-0.5 after:w-1.5 after:h-2.5 after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:opacity-0 checked:after:opacity-100"
                          />
                        </label>

                        {/* Operator Avatar */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E5ECC4] text-[12px] font-medium text-[#566811]">
                          {initials}
                        </div>

                        {/* Info & Row Actions */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[13px] font-medium text-[#333333]">
                              {account.name}
                            </p>
                            <span className="shrink-0 inline-flex items-center rounded-full bg-[#FFEAEB] px-2 py-0.5 text-[10px] font-medium text-[#D92D20]">
                              Suspended
                            </span>
                          </div>

                          <div className="mt-1 space-y-0.5 text-[11px] text-[#7C7D74]">
                            <p className="flex items-center gap-1.5 truncate">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{account.email}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span>{account.barangay}</span>
                            </p>
                          </div>

                          {/* Individual Card Actions (Icon only) */}
                          <div className="mt-2.5 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => promptRestore([account])}
                              title={`Restore ${account.name}`}
                              aria-label={`Restore ${account.name}`}
                              className="flex h-6 w-6 items-center justify-center text-[#718619] hover:text-[#566811] transition-colors cursor-pointer"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => promptDelete([account])}
                              title={`Delete ${account.name}`}
                              aria-label={`Delete ${account.name}`}
                              className="flex h-6 w-6 items-center justify-center text-[#D92D20] hover:text-[#B42318] transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* RESTORE CONFIRMATION MODAL                                 */}
      {/* ────────────────────────────────────────────────────────── */}
      {confirmModal && confirmModal.type === 'restore' && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[420px] rounded-[24px] bg-white p-6 shadow-2xl border border-[#DCDBD5] animate-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="flex justify-center mb-3.5">
              <div className="flex h-13 w-13 items-center justify-center rounded-full bg-[#E4F4D6] text-[#3D7826] border border-[#BCE6A3]">
                <RotateCcw className="h-6 w-6" />
              </div>
            </div>

            <h3 className="text-center text-[18px] font-semibold text-[#333333]">
              {confirmModal.accounts.length === 1
                ? 'Restore Operator Account?'
                : `Restore ${confirmModal.accounts.length} Operator Accounts?`}
            </h3>

            <p className="mt-2 text-center text-[13px] leading-relaxed text-[#666666]">
              {confirmModal.accounts.length === 1 ? (
                <>
                  Are you sure you want to restore{' '}
                  <span className="font-medium text-[#333333]">{confirmModal.accounts[0].name}</span>?
                  Their account will be reactivated and returned to the main operator list.
                </>
              ) : (
                <>
                  Are you sure you want to restore all{' '}
                  <span className="font-medium text-[#333333]">{confirmModal.accounts.length}</span>{' '}
                  selected accounts? They will be reactivated and returned to the main operator list.
                </>
              )}
            </p>

            {/* Actions: "Cancel" and "Yes, restore" */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={isProcessing}
                className="flex-1 h-[46px] rounded-[14px] border border-[#DCDBD5] bg-white text-[13px] font-medium text-[#555555] hover:bg-[#F7F6F1] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isProcessing}
                className="flex-1 h-[46px] rounded-[14px] bg-[#718619] hover:bg-[#627515] active:bg-[#536312] text-[13px] font-medium text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <span>Yes, restore</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* DELETE CONFIRMATION MODAL (Requires typing "delete")       */}
      {/* ────────────────────────────────────────────────────────── */}
      {confirmModal && confirmModal.type === 'delete' && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[440px] rounded-[24px] bg-white p-6 shadow-2xl border border-[#DCDBD5] animate-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="flex justify-center mb-3.5">
              <div className="flex h-13 w-13 items-center justify-center rounded-full bg-[#FFEAEB] text-[#D92D20] border border-[#F8C1C4]">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>

            <h3 className="text-center text-[18px] font-semibold text-[#333333]">
              {confirmModal.accounts.length === 1
                ? 'Permanently Delete Account?'
                : `Permanently Delete ${confirmModal.accounts.length} Accounts?`}
            </h3>

            <p className="mt-2 text-center text-[13px] leading-relaxed text-[#666666]">
              This action cannot be undone.
              {confirmModal.accounts.length === 1 ? (
                <>
                  {' '}The operator account for{' '}
                  <span className="font-medium text-[#333333]">{confirmModal.accounts[0].name}</span>{' '}
                  ({confirmModal.accounts[0].email}) will be permanently deleted.
                </>
              ) : (
                <>
                  {' '}All{' '}
                  <span className="font-medium text-[#333333]">{confirmModal.accounts.length}</span>{' '}
                  selected operator accounts will be permanently deleted.
                </>
              )}
            </p>

            {/* Type "delete" instruction */}
            <div className="mt-5 space-y-2">
              <label
                htmlFor="delete-confirmation-input"
                className="block text-[13px] text-[#555555]"
              >
                To confirm, type <span className="font-medium text-[#D92D20]">delete</span> below:
              </label>
              <input
                id="delete-confirmation-input"
                type="text"
                autoFocus
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder='Type "delete" to continue'
                className="h-11 w-full rounded-[14px] border border-[#DCDBD5] bg-white px-3.5 text-[13px] text-[#333333] placeholder:text-[#AFAEA7] outline-none transition-all focus:border-[#D92D20] focus:ring-1 focus:ring-[#D92D20]/25"
              />
            </div>

            {/* Actions: "Cancel" and "Yes, delete" */}
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmModal(null)
                  setDeleteInput('')
                }}
                disabled={isProcessing}
                className="flex-1 h-[46px] rounded-[14px] border border-[#DCDBD5] bg-white text-[13px] font-medium text-[#555555] hover:bg-[#F7F6F1] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deleteInput.trim().toLowerCase() !== 'delete' || isProcessing}
                className="flex-1 h-[46px] rounded-[14px] bg-[#D92D20] hover:bg-[#B42318] active:bg-[#912018] text-[13px] font-medium text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>
                    Yes, delete {confirmModal.accounts.length > 1 ? `(${confirmModal.accounts.length})` : ''}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
