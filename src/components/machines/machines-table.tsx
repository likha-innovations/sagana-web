import { Skeleton } from '@/ui/skeleton'
import {
  getMachineCode,
  getMachineCurrentBatch,
  getMachineRegisteredBy,
  isMachineOnline,
  type Machine,
} from '@/types/machine'
import { formatDate, getInitials } from '@/lib/utils'

interface MachinesTableProps {
  machines: Machine[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  onClearFilters?: () => void
  onView?: (machine: Machine) => void
}

const MACHINE_COLUMNS = [
  { label: 'Machine ID', widthClass: 'w-[11%]' },
  { label: 'Machine Name', widthClass: 'w-[20%]' },
  { label: 'Registered by', widthClass: 'w-[19%]' },
  { label: 'Connection status', widthClass: 'w-[13%]' },
  { label: 'Current batch', widthClass: 'w-[25%]' },
  { label: 'Date registered', widthClass: 'w-[12%]' },
] as const

export function MachinesTable({
  machines,
  isLoading = false,
  error = null,
  onRetry,
  onClearFilters,
  onView,
}: MachinesTableProps) {
  const tableHeader = (
    <thead>
      <tr className="border-b border-border text-xs font-semibold text-foreground">
        {MACHINE_COLUMNS.map((col) => (
          <th key={col.label} scope="col" className={`${col.widthClass} pb-3 font-semibold`}>
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  )

  if (isLoading) {
    return (
      <>
        <div className="flex flex-col gap-3 sm:hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-white p-4">
              <Skeleton className="h-4 w-32 rounded mb-2" />
              <Skeleton className="h-3 w-24 rounded mb-2" />
              <Skeleton className="h-3 w-40 rounded mb-2" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
        <div className="hidden sm:block w-full overflow-x-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
          <table className="w-full min-w-220 table-fixed border-collapse text-left">
            {tableHeader}
            <tbody className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="min-h-14.5" role="status" aria-label="Loading row">
                  <td className="py-3"><Skeleton className="h-4 w-16 rounded" /></td>
                  <td className="py-3"><Skeleton className="h-4 w-28 rounded" /></td>
                  <td className="py-3"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 w-24 rounded" /></div></td>
                  <td className="py-3"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="py-3"><Skeleton className="h-4 w-32 rounded" /></td>
                  <td className="py-3"><Skeleton className="h-4 w-20 rounded" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
        <p className="text-sm text-text-email mb-2">{error}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#627515] cursor-pointer">
            Retry
          </button>
        )}
      </div>
    )
  }

  if (machines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
        <p className="text-sm text-text-email mb-3">No machines found</p>
        {onClearFilters && (
          <button type="button" onClick={onClearFilters} className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-[#F2F1EB] transition-colors cursor-pointer">
            Clear filters
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:hidden">
        {machines.map((machine) => {
          const isOnline = isMachineOnline(machine)
          const code = getMachineCode(machine)
          const registeredBy = getMachineRegisteredBy(machine)
          const currentBatch = getMachineCurrentBatch(machine)
          const dateRegistered = formatDate(machine.createdAt)
          return (
            <button
              type="button"
              key={machine.id}
              onClick={() => onView?.(machine)}
              className="w-full text-left rounded-2xl border border-border bg-white p-4 active:bg-[#F2F1EB] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{machine.name}</p>
                  <p className="text-xs text-text-email">{code}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${isOnline ? 'bg-[#E4F4D6] text-[#3D7826]' : 'bg-[#FFEAEB] text-[#D92D20]'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-email">Registered by</span>
                  <span className="text-foreground truncate ml-4 text-right">{registeredBy}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-email">Current batch</span>
                  <span className="text-foreground truncate ml-4 text-right">{currentBatch?.code || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-email">Date registered</span>
                  <span className="text-foreground">{dateRegistered}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="hidden sm:block w-full overflow-x-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
        <table className="w-full min-w-220 table-fixed border-collapse text-left">
          {tableHeader}
          <tbody className="divide-y divide-border">
            {machines.map((machine) => {
              const isOnline = isMachineOnline(machine)
              const code = getMachineCode(machine)
              const registeredBy = getMachineRegisteredBy(machine)
              const registeredInitials = getInitials(registeredBy, 'OP')
              const currentBatch = getMachineCurrentBatch(machine)
              const dateRegistered = formatDate(machine.createdAt)
              return (
                <tr key={machine.id} onClick={() => onView?.(machine)} className="min-h-14.5 transition-colors hover:bg-[#F2F1EB]/70 cursor-pointer">
                  <td className="py-3 pr-3"><span className="text-xs font-semibold leading-[140%] text-foreground">{code}</span></td>
                  <td className="py-3 pr-3"><span className="text-xs font-normal leading-[140%] text-foreground">{machine.name}</span></td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-normal leading-none text-brand-700">{registeredInitials}</div>
                      <span className="truncate text-xs font-normal leading-[140%] text-foreground">{registeredBy}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${isOnline ? 'bg-[#E4F4D6] text-[#3D7826]' : 'bg-[#FFEAEB] text-[#D92D20]'}`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    {currentBatch ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-normal leading-[1.3] text-foreground wrap-break-word">{currentBatch.code}</span>
                        <span className="text-xs font-normal leading-[1.3] text-text-email">{currentBatch.stage}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-email">—</span>
                    )}
                  </td>
                  <td className="py-3 text-xs font-normal text-foreground">{dateRegistered}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
