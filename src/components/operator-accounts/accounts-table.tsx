import { StatusBadge } from './status-badge'
import { Skeleton } from '@/ui/skeleton'
import type { OperatorAccount } from '@/api/operator.api'

interface AccountsTableProps {
  accounts: OperatorAccount[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  onClearFilters?: () => void
  onSuspend?: (account: OperatorAccount) => void
  onManage?: (account: OperatorAccount) => void
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return dateStr
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function AccountsTable({
  accounts,
  isLoading = false,
  error = null,
  onRetry,
  onClearFilters,
  onSuspend,
  onManage,
}: AccountsTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[700px] table-fixed border-collapse text-left">
        <thead>
          <tr className="border-b border-[#DCDBD5] text-[13px] font-semibold text-[#414141]">
            <th scope="col" className="w-[27.5%] pb-3 font-semibold">
              Account
            </th>
            <th scope="col" className="w-[31.5%] pb-3 font-semibold">
              Email Address
            </th>
            <th scope="col" className="w-[16%] pb-3 font-semibold">
              Account Status
            </th>
            <th scope="col" className="w-[17%] pb-3 font-semibold">
              Date Joined
            </th>
            <th scope="col" className="w-[8%] pb-3 text-right pr-8 sm:pr-10">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#DCDBD5]">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="h-[54px]" role="status" aria-label="Loading row">
                <td className="py-2.5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-4 w-28 rounded" />
                  </div>
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-4 w-36 rounded" />
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-4 w-24 rounded" />
                </td>
                <td className="py-2.5 text-right pr-8 sm:pr-10">
                  <Skeleton className="ml-auto h-4 w-12 rounded" />
                </td>
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={5} className="py-12 text-center" role="status">
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
          ) : accounts.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-12 text-center" role="status">
                <p className="text-sm text-[#7C7D74] mb-3">
                  No operator accounts found
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
            accounts.map((account) => {
              const initials = getInitials(account.name)

              return (
                <tr
                  key={account.id}
                  className="h-[54px] transition-colors hover:bg-[#F2F1EB]/70"
                >
                  {/* Account: 36x36 avatar bg #E5ECC4 with initials #566811 + Name #414141 */}
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E5ECC4] text-[13px] font-normal leading-none text-[#566811]">
                        {initials}
                      </div>
                      <span className="truncate text-[13px] font-normal leading-[140%] text-[#414141]">
                        {account.name}
                      </span>
                    </div>
                  </td>

                  {/* Email: 13px, regular, #7C7D74 */}
                  <td className="py-2 pr-3">
                    <span className="truncate text-[13px] font-normal leading-[140%] text-[#7C7D74]">
                      {account.email}
                    </span>
                  </td>

                  {/* Status: StatusBadge */}
                  <td className="py-2 pr-3">
                    <StatusBadge status={account.status} />
                  </td>

                  {/* Date Joined: 13px, #414141 */}
                  <td className="py-2 pr-3 text-[13px] font-normal text-[#414141]">
                    {formatDate(account.dateJoined)}
                  </td>

                  {/* Action: Suspend button */}
                  <td className="py-2 text-right pr-8 sm:pr-10">
                    {account.status === 'suspended' ? (
                      <button
                        type="button"
                        onClick={() => (onSuspend || onManage)?.(account)}
                        className="inline-block text-[13px] font-semibold leading-none text-[#718619] opacity-60 hover:opacity-100 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#718619]"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => (onSuspend || onManage)?.(account)}
                        className="inline-block text-[13px] font-semibold leading-none text-[#D92D20] opacity-55 hover:opacity-100 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D92D20]"
                      >
                        Suspend
                      </button>
                    )}
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
