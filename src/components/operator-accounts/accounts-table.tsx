import { StatusBadge } from './status-badge'
import { Skeleton } from '@/ui/skeleton'
import { Ban, ShieldCheck } from 'lucide-react'
import type { OperatorAccount } from '@/api/operator.api'

interface AccountsTableProps {
  accounts: OperatorAccount[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  onClearFilters?: () => void
  onSuspend?: (account: OperatorAccount) => void
  onManage?: (account: OperatorAccount) => void
  onRowClick?: (account: OperatorAccount) => void
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
  onRowClick,
}: AccountsTableProps) {
  if (isLoading) {
    return (
      <>
        <div className="flex flex-col gap-3 sm:hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
              <Skeleton className="h-3 w-40 rounded mb-2" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          ))}
        </div>
        <div className="hidden sm:block w-full overflow-x-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
          <table className="w-full min-w-175 table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-[13px] font-semibold text-foreground">
                <th scope="col" className="w-[27.5%] pb-3 font-semibold">Account</th>
                <th scope="col" className="w-[31.5%] pb-3 font-semibold">Email Address</th>
                <th scope="col" className="w-[16%] pb-3 font-semibold">Account Status</th>
                <th scope="col" className="w-[17%] pb-3 font-semibold">Date Joined</th>
                <th scope="col" className="w-[8%] pb-3 text-right pr-10"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="h-13.5" role="status" aria-label="Loading row">
                  <td className="py-2.5"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 w-28 rounded" /></div></td>
                  <td className="py-2.5"><Skeleton className="h-4 w-36 rounded" /></td>
                  <td className="py-2.5"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="py-2.5"><Skeleton className="h-4 w-24 rounded" /></td>
                  <td className="py-2.5 text-right pr-10"><Skeleton className="ml-auto h-4 w-12 rounded" /></td>
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

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center" role="status">
        <p className="text-sm text-text-email mb-3">No operator accounts found</p>
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
        {accounts.map((account) => {
          const initials = getInitials(account.name)
          return (
            <div
              key={account.id}
              onClick={() => onRowClick?.(account)}
              className="rounded-2xl border border-border bg-white px-4 py-3 active:bg-[#F2F1EB] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[13px] font-normal leading-none text-brand-700">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{account.name}</p>
                  <p className="text-xs text-text-email truncate">{account.email}</p>
                </div>
                <StatusBadge status={account.status} />
                <div onClick={(e) => e.stopPropagation()}>
                  {account.status === 'suspended' ? (
                    <button
                      type="button"
                      onClick={() => (onSuspend || onManage)?.(account)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-primary active:scale-95 cursor-pointer"
                      aria-label="Activate account"
                    >
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => (onSuspend || onManage)?.(account)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-destructive active:scale-95 cursor-pointer"
                      aria-label="Suspend account"
                    >
                      <Ban className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="hidden sm:block w-full overflow-x-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
        <table className="w-full min-w-175 table-fixed border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-[13px] font-semibold text-foreground">
              <th scope="col" className="w-[27.5%] pb-3 font-semibold">Account</th>
              <th scope="col" className="w-[31.5%] pb-3 font-semibold">Email Address</th>
              <th scope="col" className="w-[16%] pb-3 font-semibold">Account Status</th>
              <th scope="col" className="w-[17%] pb-3 font-semibold">Date Joined</th>
              <th scope="col" className="w-[8%] pb-3 text-right pr-10"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {accounts.map((account) => {
              const initials = getInitials(account.name)
              return (
                <tr key={account.id} onClick={() => onRowClick?.(account)} className="h-13.5 transition-colors hover:bg-[#F2F1EB]/70 cursor-pointer">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[13px] font-normal leading-none text-brand-700">{initials}</div>
                      <span className="truncate text-[13px] font-normal leading-[140%] text-foreground">{account.name}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3"><span className="truncate text-[13px] font-normal leading-[140%] text-text-email">{account.email}</span></td>
                  <td className="py-2 pr-3"><StatusBadge status={account.status} /></td>
                  <td className="py-2 pr-3 text-[13px] font-normal text-foreground">{formatDate(account.dateJoined)}</td>
                  <td className="py-2 text-right pr-10" onClick={(e) => e.stopPropagation()}>
                    {account.status === 'suspended' ? (
                      <button type="button" onClick={() => (onSuspend || onManage)?.(account)} className="inline-block text-[13px] font-semibold leading-none text-primary hover:opacity-80 transition-opacity cursor-pointer">Activate</button>
                    ) : (
                      <button type="button" onClick={() => (onSuspend || onManage)?.(account)} className="inline-block text-[13px] font-semibold leading-none text-destructive hover:opacity-80 transition-opacity cursor-pointer">Suspend</button>
                    )}
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
