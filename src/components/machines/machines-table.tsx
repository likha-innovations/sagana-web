import { Link } from 'react-router'
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
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[880px] table-fixed border-collapse text-left">
        <thead>
          <tr className="border-b border-[#DCDBD5] text-[12px] font-semibold text-[#414141]">
            <th scope="col" className="w-[10%] pb-3 font-semibold">
              Machine ID
            </th>
            <th scope="col" className="w-[19%] pb-3 font-semibold">
              Machine Name
            </th>
            <th scope="col" className="w-[18%] pb-3 font-semibold">
              Registered by
            </th>
            <th scope="col" className="w-[12%] pb-3 font-semibold">
              Connection status
            </th>
            <th scope="col" className="w-[25%] pb-3 font-semibold">
              Current batch
            </th>
            <th scope="col" className="w-[11%] pb-3 font-semibold">
              Date registered
            </th>
            <th scope="col" className="w-[5%] pb-3 text-right pr-8 sm:pr-10">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DCDBD5]">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="min-h-[58px]" role="status" aria-label="Loading row">
                <td className="py-3">
                  <Skeleton className="h-4 w-16 rounded" />
                </td>
                <td className="py-3">
                  <Skeleton className="h-4 w-28 rounded" />
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </div>
                </td>
                <td className="py-3">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </td>
                <td className="py-3">
                  <Skeleton className="h-4 w-32 rounded" />
                </td>
                <td className="py-3">
                  <Skeleton className="h-4 w-20 rounded" />
                </td>
                <td className="py-3 text-right pr-8 sm:pr-10">
                  <Skeleton className="ml-auto h-4 w-10 rounded" />
                </td>
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={7} className="py-12 text-center" role="status">
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
          ) : machines.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center" role="status">
                <p className="text-sm text-[#7C7D74] mb-3">
                  No machines found
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
            machines.map((machine) => {
              const isOnline = machine.status === 'online'

              return (
                <tr
                  key={machine.id}
                  className="min-h-[58px] transition-colors hover:bg-[#F2F1EB]/70"
                >
                  {/* Machine ID */}
                  <td className="py-3 pr-3">
                    <span className="text-xs font-semibold leading-[140%] text-[#414141]">
                      {machine.code}
                    </span>
                  </td>

                  {/* Machine Name */}
                  <td className="py-3 pr-3">
                    <span className="text-xs font-normal leading-[140%] text-[#414141]">
                      {machine.name}
                    </span>
                  </td>

                  {/* Registered By */}
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E5ECC4] text-[12px] font-normal leading-none text-[#566811]">
                        {machine.registeredBy.initials}
                      </div>
                      <span className="truncate text-xs font-normal leading-[140%] text-[#414141]">
                        {machine.registeredBy.name}
                      </span>
                    </div>
                  </td>

                  {/* Connection status badge */}
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none ${
                        isOnline
                          ? 'bg-[#E4F4D6] text-[#3D7826]'
                          : 'bg-[#FFEAEB] text-[#D92D20]'
                      }`}
                    >
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>

                  {/* Current Batch */}
                  <td className="py-3 pr-3">
                    {machine.currentBatch ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-normal leading-[1.3] text-[#414141] break-words">
                          {machine.currentBatch.code}
                        </span>
                        <span className="text-[12px] font-normal leading-[1.3] text-[#7C7D74]">
                          {machine.currentBatch.stage}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#7C7D74]">—</span>
                    )}
                  </td>

                  {/* Date registered */}
                  <td className="py-3 pr-3 text-xs font-normal text-[#414141]">
                    {machine.dateRegistered}
                  </td>

                  {/* Action: View */}
                  <td className="py-3 text-right pr-8 sm:pr-10">
                    <Link
                      to={`/admin/machines/${machine.id}`}
                      onClick={(e) => {
                        if (onView) {
                          e.preventDefault()
                          onView(machine)
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
