import { Skeleton } from '@/ui/skeleton'
import type { Machine } from '@/api/machine.api'

interface MachinesTableProps {
  machines: Machine[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  onClearFilters?: () => void
  onView?: (machine: Machine) => void
}

export function MachinesTable({
  machines,
  isLoading = false,
  error = null,
  onRetry,
  onClearFilters,
  onView,
}: MachinesTableProps) {
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
        <div className="hidden sm:block w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <table className="w-full min-w-[880px] table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-foreground">
                <th scope="col" className="w-[10%] pb-3 font-semibold">Machine ID</th>
                <th scope="col" className="w-[19%] pb-3 font-semibold">Machine Name</th>
                <th scope="col" className="w-[18%] pb-3 font-semibold">Registered by</th>
                <th scope="col" className="w-[12%] pb-3 font-semibold">Connection status</th>
                <th scope="col" className="w-[25%] pb-3 font-semibold">Current batch</th>
                <th scope="col" className="w-[11%] pb-3 font-semibold">Date registered</th>
                <th scope="col" className="w-[5%] pb-3 text-right pr-10"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="min-h-[58px]" role="status" aria-label="Loading row">
                  <td className="py-3"><Skeleton className="h-4 w-16 rounded" /></td>
                  <td className="py-3"><Skeleton className="h-4 w-28 rounded" /></td>
                  <td className="py-3"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 w-24 rounded" /></div></td>
                  <td className="py-3"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="py-3"><Skeleton className="h-4 w-32 rounded" /></td>
                  <td className="py-3"><Skeleton className="h-4 w-20 rounded" /></td>
                  <td className="py-3 text-right pr-10"><Skeleton className="ml-auto h-4 w-10 rounded" /></td>
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
          const isOnline = machine.status === 'online'
          return (
            <div
              key={machine.id}
              onClick={() => onView?.(machine)}
              className="rounded-2xl border border-border bg-white p-4 active:bg-[#F2F1EB] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{machine.name}</p>
                  <p className="text-xs text-text-email">{machine.code}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${isOnline ? 'bg-[#E4F4D6] text-[#3D7826]' : 'bg-[#FFEAEB] text-[#D92D20]'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-email">Registered by</span>
                  <span className="text-foreground truncate ml-4 text-right">{machine.registeredBy.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-email">Current batch</span>
                  <span className="text-foreground truncate ml-4 text-right">{machine.currentBatch?.code || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-email">Date registered</span>
                  <span className="text-foreground">{machine.dateRegistered}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="hidden sm:block w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <table className="w-full min-w-[880px] table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-xs font-semibold text-foreground">
              <th scope="col" className="w-[10%] pb-3 font-semibold">Machine ID</th>
              <th scope="col" className="w-[19%] pb-3 font-semibold">Machine Name</th>
              <th scope="col" className="w-[18%] pb-3 font-semibold">Registered by</th>
              <th scope="col" className="w-[12%] pb-3 font-semibold">Connection status</th>
              <th scope="col" className="w-[25%] pb-3 font-semibold">Current batch</th>
              <th scope="col" className="w-[11%] pb-3 font-semibold">Date registered</th>
              <th scope="col" className="w-[5%] pb-3 text-right pr-10"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {machines.map((machine) => {
              const isOnline = machine.status === 'online'
              return (
                <tr key={machine.id} onClick={() => onView?.(machine)} className="min-h-[58px] transition-colors hover:bg-[#F2F1EB]/70 cursor-pointer">
                  <td className="py-3 pr-3"><span className="text-xs font-semibold leading-[140%] text-foreground">{machine.code}</span></td>
                  <td className="py-3 pr-3"><span className="text-xs font-normal leading-[140%] text-foreground">{machine.name}</span></td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-normal leading-none text-brand-700">{machine.registeredBy.initials}</div>
                      <span className="truncate text-xs font-normal leading-[140%] text-foreground">{machine.registeredBy.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${isOnline ? 'bg-[#E4F4D6] text-[#3D7826]' : 'bg-[#FFEAEB] text-[#D92D20]'}`}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    {machine.currentBatch ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-normal leading-[1.3] text-foreground break-words">{machine.currentBatch.code}</span>
                        <span className="text-xs font-normal leading-[1.3] text-text-email">{machine.currentBatch.stage}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-text-email">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-xs font-normal text-foreground">{machine.dateRegistered}</td>
                  <td className="py-3 text-right pr-10" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => onView?.(machine)} className="inline-block text-xs font-bold leading-none text-primary hover:underline cursor-pointer">View</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
