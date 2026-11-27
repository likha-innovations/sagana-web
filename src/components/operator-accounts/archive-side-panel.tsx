import { useState, useMemo } from 'react'
import {
  X,
  Archive,
  Search,
  RotateCcw,
  Trash2,
  Loader2,
  CheckCheck,
} from 'lucide-react'
import {
  getOperatorBarangayName,
  getOperatorName,
  type OperatorAccount,
} from '@/types/operator'
import { formatDate, getInitials } from '@/lib/utils'

interface ArchiveSidePanelProps {
  isOpen: boolean
  onClose: () => void
  archivedAccounts: OperatorAccount[]
  isLoading?: boolean
  onRestore: (accounts: OperatorAccount[]) => Promise<void>
  onDelete: (accounts: OperatorAccount[]) => Promise<void>
}

function formatArchivedDate(dateStr?: string): string {
  return `Archived ${formatDate(dateStr, 'Nov 09, 2026')}`
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


  const [confirmModal, setConfirmModal] = useState<{
    type: 'restore' | 'delete'
    accounts: OperatorAccount[]
  } | null>(null)
  const [deleteInput, setDeleteInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)


  const safeAccounts = useMemo(
    () => (Array.isArray(archivedAccounts) ? archivedAccounts : []),
    [archivedAccounts]
  )


  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return safeAccounts
    return safeAccounts.filter((op) => {
      const name = getOperatorName(op).toLowerCase()
      const email = op?.email?.toLowerCase() || ''
      const barangay = getOperatorBarangayName(op).toLowerCase()
      return name.includes(q) || email.includes(q) || barangay.includes(q)
    })
  }, [safeAccounts, search])


  const selectedAccounts = useMemo(
    () => safeAccounts.filter((a) => selectedIds.has(a.id)),
    [safeAccounts, selectedIds]
  )


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
    setSelectedIds(new Set(filteredAccounts.map((a) => a.id)))
  }

  const handleDeselectAll = () => {
    setSelectedIds(new Set())
  }


  const promptRestore = (accounts: OperatorAccount[]) => {
    setConfirmModal({ type: 'restore', accounts })
  }

  const promptDelete = (accounts: OperatorAccount[]) => {
    setDeleteInput('')
    setConfirmModal({ type: 'delete', accounts })
  }

  if (!isOpen) return null


  const handleExecuteRestore = async () => {
    if (!confirmModal || confirmModal.type !== 'restore') return
    try {
      setIsProcessing(true)
      await onRestore(confirmModal.accounts)
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

  const isAllSelected =
    filteredAccounts.length > 0 && selectedIds.size === filteredAccounts.length

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
          aria-hidden="true"
        />

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="relative w-screen max-w-full sm:max-w-115 bg-[#F8F7F2] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-7 py-6 border-b border-border bg-[#F8F7F2]">
              <div className="flex items-center gap-3">
                <Archive className="h-6 w-6 text-foreground stroke-[2.2]" />
                <h2 className="text-[20px] font-bold text-foreground tracking-tight">
                  Archived accounts
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-10.5 w-10.5 items-center justify-center rounded-[16px] border border-border bg-transparent text-foreground hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Close archive panel"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="relative w-full">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search a name or an email address.."
                  className="h-13 w-full rounded-[18px] border border-border bg-transparent px-5 pr-12 text-xs text-foreground placeholder:text-text-secondary outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
                <Search className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-foreground stroke-[2.2]" />
              </div>

              {safeAccounts.length > 0 && (
                <div className="flex flex-wrap items-center justify-end gap-2.5">
                  {!isAllSelected && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="flex h-10 items-center gap-2 rounded-[14px] border border-border bg-transparent px-4 text-xs font-bold text-foreground hover:bg-black/5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <CheckCheck className="h-4 w-4 stroke-[2.5]" />
                      <span>Select all</span>
                    </button>
                  )}

                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="flex h-10 items-center gap-2 rounded-[14px] border border-border bg-transparent px-4 text-xs font-bold text-foreground hover:bg-black/5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <X className="h-4 w-4 stroke-[2.5]" />
                      <span>{isAllSelected ? 'Deselect all' : 'Deselect selection'}</span>
                    </button>
                  )}

                  {selectedIds.size > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => promptRestore(selectedAccounts)}
                        title={`Restore selected (${selectedIds.size})`}
                        aria-label={`Restore selected (${selectedIds.size})`}
                        className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-brand-100 text-primary hover:bg-[#dbe4af] transition-colors cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="h-4.5 w-4.5 stroke-[2.2]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => promptDelete(selectedAccounts)}
                        title={`Delete selected (${selectedIds.size})`}
                        aria-label={`Delete selected (${selectedIds.size})`}
                        className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#FBDDDD] text-destructive hover:bg-[#fad4d1] transition-colors cursor-pointer shadow-2xs"
                      >
                        <Trash2 className="h-4.5 w-4.5 stroke-[2.2]" />
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="flex-1 space-y-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-text-email">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-3 text-xs">Loading archived accounts...</p>
                  </div>
                ) : filteredAccounts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-transparent border border-border text-text-secondary">
                      <Archive className="h-7 w-7" />
                    </div>
                    <h3 className="mt-3.5 text-sm font-semibold text-foreground">
                      {search ? 'No matching accounts' : 'No archived accounts'}
                    </h3>
                    <p className="mt-1 text-xs text-text-email max-w-70">
                      {search
                        ? 'Try adjusting your search query'
                        : 'When you suspend an operator account, it will appear here.'}
                    </p>
                  </div>
                ) : (
                  filteredAccounts.map((account) => {
                    const isSelected = selectedIds.has(account.id)
                    const name = getOperatorName(account)
                    const initials = getInitials(name, 'OP')

                    return (
                      <div
                        key={account.id}
                        className="relative flex items-center justify-between rounded-[22px] border border-border bg-transparent p-5 transition-all hover:border-[#CAC9C2]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                            {initials}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <h3 className="truncate text-xs font-bold text-foreground leading-snug">
                              {name}
                            </h3>
                            <p className="truncate text-xs text-text-email leading-snug">
                              {account.email}
                            </p>
                            <p className="text-xs text-text-email leading-snug">
                              {formatArchivedDate(account.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between self-stretch shrink-0 ml-4 min-h-[68px]">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(account.id)}
                            aria-label={isSelected ? `Deselect ${name}` : `Select ${name}`}
                            className="cursor-pointer"
                          >
                            {isSelected ? (
                              <div className="h-4.5 w-4.5 rounded-full bg-[#99A857] flex items-center justify-center p-[2px]">
                                <div className="h-full w-full rounded-full bg-[#DBDFC3] flex items-center justify-center p-[1px]">
                                  <div className="h-full w-full rounded-full bg-[#7D902C]" />
                                </div>
                              </div>
                            ) : (
                              <div className="h-4.5 w-4.5 rounded-full border border-border bg-transparent" />
                            )}
                          </button>

                          {!isSelected ? (
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() => promptRestore([account])}
                                title={`Restore ${name}`}
                                aria-label={`Restore ${name}`}
                                className="flex h-8.5 w-8.5 items-center justify-center rounded-[12px] bg-brand-100 text-primary hover:bg-[#dbe4af] transition-colors cursor-pointer"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => promptDelete([account])}
                                title={`Delete ${name}`}
                                aria-label={`Delete ${name}`}
                                className="flex h-8.5 w-8.5 items-center justify-center rounded-[12px] bg-[#FBDDDD] text-destructive hover:bg-[#fad4d1] transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="h-8.5" />
                          )}
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

      {confirmModal && confirmModal.type === 'restore' && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-105 rounded-[28px] bg-[#F8F7F2] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-brand-100 text-primary">
                <RotateCcw className="h-6 w-6 stroke-[2.2]" />
              </div>
            </div>

            <h3 className="text-center text-base font-bold text-foreground">
              Restore Operator Account?
            </h3>

            <p className="mt-3 text-center text-xs leading-relaxed text-foreground">
              {confirmModal.accounts.length === 1 ? (
                <>
                  Are you sure you want to restore <span className="font-bold">{getOperatorName(confirmModal.accounts[0])}</span>’s account? Their account will be reactivated and returned to the main operator list.
                </>
              ) : (
                <>
                  Are you sure you want to restore the accounts? The accounts will be reactivated and returned to the main operator list.
                </>
              )}
            </p>

            <div className="mt-7 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={isProcessing}
                className="flex-1 h-12 rounded-full border border-border bg-transparent text-xs font-bold text-foreground hover:bg-black/5 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isProcessing}
                className="flex-1 h-12 rounded-full bg-primary hover:bg-[#627515] active:bg-[#536312] text-xs font-bold text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
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

      {confirmModal && confirmModal.type === 'delete' && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-105 rounded-[28px] bg-[#F8F7F2] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#FBDDDD] text-destructive">
                <Trash2 className="h-6 w-6 stroke-[2.2]" />
              </div>
            </div>

            <h3 className="text-center text-base font-bold text-foreground">
              Permanently delete the account?
            </h3>

            <p className="mt-3 text-center text-xs leading-relaxed text-foreground">
              {confirmModal.accounts.length === 1 ? (
                <>
                  <span className="font-bold">{getOperatorName(confirmModal.accounts[0])}</span>’s account will be permanently deleted, and <span className="text-destructive font-semibold">this action won’t be undone</span>.
                </>
              ) : (
                <>
                  The selected accounts will be permanently deleted, and <span className="text-destructive font-semibold">this action won’t be undone</span>.
                </>
              )}
            </p>

            <div className="mt-5 space-y-2.5">
              <p className="text-center text-xs text-foreground">
                To confirm, enter “<span className="font-bold text-destructive">delete</span>” below
              </p>
              <input
                id="delete-confirmation-input"
                type="text"
                autoFocus
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder='Enter “delete”'
                className="h-12 w-full rounded-2xl border border-border bg-transparent px-4 text-xs text-foreground placeholder:text-text-secondary outline-none transition-all focus:border-destructive focus:ring-1 focus:ring-destructive/25"
              />
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmModal(null)
                  setDeleteInput('')
                }}
                disabled={isProcessing}
                className="flex-1 h-12 rounded-full border border-border bg-transparent text-xs font-bold text-foreground hover:bg-black/5 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deleteInput.trim().toLowerCase() !== 'delete' || isProcessing}
                className={`flex-1 h-12 rounded-full text-xs font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 ${
                  deleteInput.trim().toLowerCase() !== 'delete'
                    ? 'bg-text-secondary cursor-not-allowed'
                    : 'bg-destructive hover:bg-[#d63f3f] active:bg-[#c43636] cursor-pointer'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
