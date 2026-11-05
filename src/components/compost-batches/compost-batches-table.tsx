import { Link } from 'react-router'
import { Skeleton } from '@/ui/skeleton'
import type { Batch, BatchPhase } from '@/api/batch.api'

interface CompostBatchesTableProps {
  batches: Batch[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  onClearFilters?: () => void
  onView?: (batch: Batch) => void
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
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[800px] table-fixed border-collapse text-left">
        <thead>
          <tr className="border-b border-[#DCDBD5] text-[12px] font-semibold text-[#414141]">
            <th scope="col" className="w-[12%] pb-3 font-semibold">
              Batch ID
            </th>
            <th scope="col" className="w-[16%] pb-3 font-semibold">
              Started by
            </th>
            <th scope="col" className="w-[15%] pb-3 font-semibold">
              Machine
            </th>
            <th scope="col" className="w-[15%] pb-3 font-semibold">
              Status
            </th>
            <th scope="col" className="w-[14%] pb-3 font-semibold">
              Feedstock weight
            </th>
            <th scope="col" className="w-[12%] pb-3 font-semibold">
              Started on
            </th>
            <th scope="col" className="w-[10%] pb-3 font-semibold">
              Days composting
            </th>
            <th scope="col" className="w-[6%] pb-3 text-right pr-8 sm:pr-10">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DCDBD5]">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="h-[54px]" role="status" aria-label="Loading row">
                <td className="py-2.5">
                  <Skeleton className="h-4 w-20 rounded" />
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-4 w-28 rounded" />
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-4 w-24 rounded" />
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-4 w-16 rounded" />
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-4 w-20 rounded" />
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-4 w-8 rounded" />
                </td>
                <td className="py-2.5 text-right pr-8 sm:pr-10">
                  <Skeleton className="ml-auto h-4 w-10 rounded" />
                </td>
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={8} className="py-12 text-center" role="status">
                <p className="text-sm font-medium text-[#414141] mb-2">{error}</p>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center justify-center rounded-xl bg-[#718619] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#627515] cursor-pointer"
                  >
                    Retry
                  </button>
                )}
              </td>
            </tr>
          ) : batches.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-12 text-center" role="status">
                <p className="text-sm text-[#7C7D74] mb-3">
                  No compost batches found
                </p>
                {onClearFilters && (
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="inline-flex items-center justify-center rounded-xl border border-[#DCDBD5] bg-white px-3.5 py-1.5 text-xs font-medium text-[#414141] hover:bg-[#F2F1EB] transition-colors cursor-pointer"
                  >
                    Clear filters
                  </button>
                )}
              </td>
            </tr>
          ) : (
            batches.map((batch) => {
              return (
                <tr
                  key={batch.id}
                  className="h-[54px] transition-colors hover:bg-[#F2F1EB]/70"
                >
                  {/* Batch ID */}
                  <td className="py-2 pr-3">
                    <span className="text-xs font-semibold leading-[140%] text-[#414141]">
                      {batch.code}
                    </span>
                  </td>

                  {/* Started By */}
                  <td className="py-2 pr-3">
                    <span className="text-xs font-normal leading-[140%] text-[#414141]">
                      {batch.startedBy}
                    </span>
                  </td>

                  {/* Machine */}
                  <td className="py-2 pr-3">
                    <span className="text-xs font-normal leading-[140%] text-[#414141]">
                      {batch.machine}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-2 pr-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none ${getStatusBadgeClasses(
                        batch.status
                      )}`}
                    >
                      {batch.status}
                    </span>
                  </td>

                  {/* Feedstock weight */}
                  <td className="py-2 pr-3 text-xs font-normal text-[#414141]">
                    {batch.feedstockWeight}
                  </td>

                  {/* Started on */}
                  <td className="py-2 pr-3 text-xs font-normal text-[#414141]">
                    {batch.startedOn}
                  </td>

                  {/* Days composting */}
                  <td className="py-2 pr-3 text-xs font-normal text-[#414141]">
                    {batch.daysComposting}
                  </td>

                  {/* Action: View */}
                  <td className="py-2 text-right pr-8 sm:pr-10">
                    <Link
                      to={`/admin/compost-batches/${batch.id}`}
                      onClick={(e) => {
                        if (onView) {
                          e.preventDefault()
                          onView(batch)
                        }
                      }}
                      className="inline-block text-[12px] font-bold leading-none text-[#718619] hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#718619]"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
