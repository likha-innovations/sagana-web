import { Skeleton } from '@/ui/skeleton'
import {
  type CompostBatch,
  type BatchPhase,
  getBatchPhase,
  getDaysComposting,
  formatBatchDate,
} from '@/types/batch'

interface CompostBatchesTableProps {
  batches: CompostBatch[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  onClearFilters?: () => void
  onView?: (batch: CompostBatch) => void
}

function getStatusBadgeClasses(status: BatchPhase) {
  switch (status) {
    case 'Cooling':
      return 'bg-[#E2F4EC] text-[#15803D]'
    case 'Thermophilic':
      return 'bg-[#F3E8FF] text-[#7E22CE]'
    case 'Mesophilic':
      return 'bg-[#ECFCCB] text-[#4D7C0F]'
    case 'Completed':
    default:
      return 'bg-[#E4F4D6] text-[#3D7826]'
  }
}

export function CompostBatchesTable({
  batches,
  isLoading = false,
  error = null,
  onRetry,
  onClearFilters,
  onView,
}: CompostBatchesTableProps) {
  if (isLoading) {
    return (
      <>
        <div className="flex flex-col gap-3 sm:hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-white p-4">
              <Skeleton className="h-4 w-40 rounded mb-2" />
              <Skeleton className="h-3 w-28 rounded mb-2" />
              <Skeleton className="h-3 w-32 rounded mb-2" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
        <div className="hidden sm:block w-full overflow-x-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
          <table className="w-full min-w-200 table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-foreground">
                <th scope="col" className="w-[18%] pb-3 font-semibold">Batch ID</th>
                <th scope="col" className="w-[12%] pb-3 font-semibold">Started by</th>
                <th scope="col" className="w-[18%] pb-3 font-semibold">Machine</th>
                <th scope="col" className="w-[12%] pb-3 font-semibold">Status</th>
                <th scope="col" className="w-[14%] pb-3 font-semibold">Feedstock weight</th>
                <th scope="col" className="w-[12%] pb-3 font-semibold">Started on</th>
                <th scope="col" className="w-[9%] pb-3 font-semibold">Days composting</th>
                <th scope="col" className="w-[5%] pb-3 text-right pr-10"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="h-13.5" role="status" aria-label="Loading row">
                  <td className="py-2.5"><Skeleton className="h-4 w-20 rounded" /></td>
                  <td className="py-2.5"><Skeleton className="h-4 w-28 rounded" /></td>
                  <td className="py-2.5"><Skeleton className="h-4 w-24 rounded" /></td>
                  <td className="py-2.5"><Skeleton className="h-6 w-20 rounded-full" /></td>
                  <td className="py-2.5"><Skeleton className="h-4 w-16 rounded" /></td>
                  <td className="py-2.5"><Skeleton className="h-4 w-20 rounded" /></td>
                  <td className="py-2.5"><Skeleton className="h-4 w-8 rounded" /></td>
                  <td className="py-2.5 text-right pr-10"><Skeleton className="ml-auto h-4 w-10 rounded" /></td>
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

  if (batches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
        <p className="text-sm text-text-email mb-3">No compost batches found</p>
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
        {batches.map((batch) => {
          const phase = getBatchPhase(batch)
          const days = getDaysComposting(batch)
          const startedOn = formatBatchDate(batch.startDate)

          return (
            <button
              type="button"
              key={batch.id}
              onClick={() => onView?.(batch)}
              className="w-full text-left rounded-2xl border border-border bg-white p-4 active:bg-[#F2F1EB] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground truncate mr-3">{batch.batchCode}</p>
                <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${getStatusBadgeClasses(phase)}`}>
                  {phase}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-email">Machine</span>
                  <span className="text-foreground truncate ml-4 text-right">{batch.machineName || 'Unknown Machine'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-email">Feedstock weight</span>
                  <span className="text-foreground">{batch.totalWeight} kg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-email">Started on</span>
                  <span className="text-foreground">{startedOn}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-email">Days composting</span>
                  <span className="text-foreground">{days}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="hidden sm:block w-full overflow-x-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
        <table className="w-full min-w-200 table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-xs font-semibold text-foreground">
              <th scope="col" className="w-[18%] pb-3 font-semibold">Batch ID</th>
              <th scope="col" className="w-[12%] pb-3 font-semibold">Started by</th>
              <th scope="col" className="w-[18%] pb-3 font-semibold">Machine</th>
              <th scope="col" className="w-[12%] pb-3 font-semibold">Status</th>
              <th scope="col" className="w-[14%] pb-3 font-semibold">Feedstock weight</th>
              <th scope="col" className="w-[12%] pb-3 font-semibold">Started on</th>
              <th scope="col" className="w-[9%] pb-3 font-semibold">Days composting</th>
              <th scope="col" className="w-[5%] pb-3 text-right pr-10"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {batches.map((batch) => {
              const phase = getBatchPhase(batch)
              const days = getDaysComposting(batch)
              const startedOn = formatBatchDate(batch.startDate)

              return (
                <tr key={batch.id} onClick={() => onView?.(batch)} className="h-13.5 transition-colors hover:bg-[#F2F1EB]/70 cursor-pointer">
                  <td className="py-2 pr-3"><span className="text-xs font-normal leading-[140%] text-foreground">{batch.batchCode}</span></td>
                  <td className="py-2 pr-3"><span className="text-xs font-normal leading-[140%] text-foreground">Operator</span></td>
                  <td className="py-2 pr-3"><span className="text-xs font-normal leading-[140%] text-foreground">{batch.machineName || 'Unknown Machine'}</span></td>
                  <td className="py-2 pr-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${getStatusBadgeClasses(phase)}`}>{phase}</span>
                  </td>
                  <td className="py-2 pr-3 text-xs font-normal text-foreground">{batch.totalWeight} kg</td>
                  <td className="py-2 pr-3 text-xs font-normal text-foreground">{startedOn}</td>
                  <td className="py-2 pr-3 text-xs font-normal text-foreground">{days}</td>
                  <td className="py-2 text-right pr-10" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => onView?.(batch)} className="inline-block text-xs font-bold leading-none text-primary hover:underline cursor-pointer">View</button>
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
