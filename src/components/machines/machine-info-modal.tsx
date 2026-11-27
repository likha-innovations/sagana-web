import { useMemo, useRef } from 'react'
import { X } from 'lucide-react'
import {
  getMachineCode,
  getMachineCurrentBatch,
  getMachineRegisteredBy,
  type Machine,
} from '@/types/machine'
import { useBatches } from '@/hooks/use-batches'
import { useDialogFocus } from '@/hooks/use-dialog-focus'
import { formatDate } from '@/lib/utils'

interface MachineInfoModalProps {
  isOpen: boolean
  machine: Machine | null
  onClose: () => void
}

interface BatchDisplayItem {
  id: string
  batchCode: string
  startDate: string
  status: 'In progress' | 'Completed'
}

export function MachineInfoModal({
  isOpen,
  machine,
  onClose,
}: MachineInfoModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const { data: batchesData } = useBatches({ pageSize: 100 })

  useDialogFocus({
    isOpen: isOpen && Boolean(machine),
    dialogRef,
    onClose,
  })

  const machineBatches = useMemo<BatchDisplayItem[]>(() => {
    if (!machine) return []


    const matched = (batchesData?.data || []).filter(
      (b) =>
        b.machineId === machine.id ||
        (b.machineName && b.machineName.toLowerCase() === machine.name.toLowerCase())
    )

    if (matched.length > 0) {
      return matched.map((b) => ({
        id: b.id,
        batchCode: b.batchCode,
        startDate: formatDate(b.startDate),
        status:
          b.completionDate || b.status?.toLowerCase() === 'completed'
            ? 'Completed'
            : 'In progress',
      }))
    }


    return []
  }, [machine, batchesData])

  if (!isOpen || !machine) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-196.5 max-h-[90vh] overflow-y-auto rounded-[22px] sm:rounded-[28px] bg-[#F8F7F2] shadow-2xl animate-in zoom-in-95 duration-200 outline-none"
      >
        <div className="flex items-center justify-between px-5 sm:px-8 py-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">
            Machine Information
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-border bg-transparent text-foreground hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5 stroke-[2.2]" />
          </button>
        </div>

        <div className="px-5 sm:px-8 pt-5 sm:pt-6 pb-6 sm:pb-8 space-y-4.5">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
              Machine name
            </label>
            <div className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-transparent px-4 sm:px-5 flex items-center text-xs text-foreground font-medium">
              {machine.name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Machine ID
              </label>
              <div className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 flex items-center text-xs text-text-email">
                {getMachineCode(machine)}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Registered by
              </label>
              <div className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 flex items-center text-xs text-text-email truncate">
                {getMachineRegisteredBy(machine)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Date registered
              </label>
              <div className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 flex items-center text-xs text-text-email">
                {formatDate(machine.createdAt)}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 sm:mb-2">
                Current batch
              </label>
              <div className="h-11 sm:h-13 w-full rounded-[14px] sm:rounded-[18px] border border-border bg-[#F5F5F3] px-4 sm:px-5 flex items-center text-xs text-text-email">
                {getMachineCurrentBatch(machine)?.code || '—'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-2 sm:mb-2.5">
              Compost batches
            </label>

            {machineBatches.length === 0 ? (
              <p className="text-xs text-text-email py-4 text-center">No compost batches yet</p>
            ) : (
              <>
                <div className="space-y-2.5 sm:hidden">
                  {machineBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="rounded-2xl border border-border bg-white p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-normal text-foreground">{batch.batchCode}</span>
                        {batch.status === 'In progress' ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-brand-100 text-brand-700">
                            In progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-[#E4F4D6] text-[#3D7826]">
                            Completed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-email">Date started</span>
                        <span className="text-xs text-foreground">{batch.startDate}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden sm:block rounded-[18px] border border-border overflow-hidden bg-transparent">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border bg-transparent">
                        <th
                          scope="col"
                          className="w-[35%] py-3.5 px-5 text-xs font-bold text-foreground"
                        >
                          Batch ID
                        </th>
                        <th
                          scope="col"
                          className="w-[40%] py-3.5 px-5 text-xs font-bold text-foreground"
                        >
                          Date started
                        </th>
                        <th
                          scope="col"
                          className="w-[25%] py-3.5 px-5 text-xs font-bold text-foreground"
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {machineBatches.map((batch) => (
                        <tr
                          key={batch.id}
                          className="h-12 transition-colors hover:bg-black/2"
                        >
                          <td className="py-2.5 px-5 text-xs font-normal text-foreground">
                            {batch.batchCode}
                          </td>
                          <td className="py-2.5 px-5 text-xs font-normal text-foreground">
                            {batch.startDate}
                          </td>
                          <td className="py-2.5 px-5">
                            {batch.status === 'In progress' ? (
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-brand-100 text-brand-700">
                                In progress
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-[#E4F4D6] text-[#3D7826]">
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
