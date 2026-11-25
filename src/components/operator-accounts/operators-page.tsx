import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { Archive } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/ui/page-header'
import { FilterToolbar } from '@/components/ui/filter-toolbar'
import { Pagination } from '@/components/ui/pagination'
import { type DropdownOption } from '@/components/ui/custom-dropdown'
import { OperatorStats } from './operator-stats'
import { AccountsTable } from './accounts-table'
import { SuspendOperatorModal } from './suspend-operator-modal'
import { UserInfoModal } from './user-info-modal'
import { ArchiveSidePanel } from './archive-side-panel'
import {
  useOperators,
  useOperatorStats,
  useArchivedOperators,
  operatorKeys,
} from '@/hooks/use-operators'
import {
  fetchOperatorAccounts,
  updateOperatorStatus,
  updateOperator,
  deleteOperator,
  type OperatorAccount,
} from '@/api/operator.api'
import { exportOperatorsReport } from '@/lib/export-operators-report'
import { exportOperatorsToSheets } from '@/lib/export-sheets'

const OPERATOR_STATUS_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
]

export function OperatorAccountsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()


  const searchParam = searchParams.get('search') || ''
  const statusParam = searchParams.get('status') || 'all'
  const dateRangeParam = searchParams.get('dateRange') || 'all'
  const pageParam = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 10

  const updateParams = useCallback(
    (newParams: Record<string, string | number | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(newParams).forEach(([key, val]) => {
          if (val === null || val === '' || val === 'all') {
            next.delete(key)
          } else {
            next.set(key, String(val))
          }
        })
        return next
      })
    },
    [setSearchParams]
  )

  const {
    data: operatorsData,
    isLoading,
    isError,
    refetch,
  } = useOperators({
    search: searchParam,
    status: statusParam as 'all' | 'active' | 'suspended',
    dateRange: dateRangeParam,
    page: pageParam,
    pageSize,
  })

  const { data: statsData } = useOperatorStats()
  const { data: archivedData, isLoading: isArchiveLoading } = useArchivedOperators()

  const accounts = operatorsData?.data ?? []
  const totalItems = operatorsData?.total ?? 0
  const totalPages = operatorsData?.totalPages ?? 1
  const archivedAccounts = archivedData ?? []

  const stats = statsData ?? {
    total: 0,
    active: 0,
    inactive: 0,
    barangayCode: '',
    barangayName: '',
  }

  const [selectedOperator, setSelectedOperator] = useState<OperatorAccount | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [userInfoOperator, setUserInfoOperator] = useState<OperatorAccount | null>(null)
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false)


  const handleClearFilters = () => {
    updateParams({
      search: null,
      status: null,
      dateRange: null,
      page: 1,
    })
  }


  const handleConfirmStatus = async (
    operator: OperatorAccount,
    newStatus: 'active' | 'suspended'
  ) => {
    try {
      await updateOperatorStatus(operator.id, newStatus)
      if (newStatus === 'suspended') {
        toast.success(`Operator ${operator.name} suspended and moved to archive`)
      } else {
        toast.success(`Operator ${operator.name} has been activated`)
      }
      void queryClient.invalidateQueries({ queryKey: operatorKeys.all })
    } catch {
      toast.error('Failed to update operator status on server')
    }
  }


  const handleRestoreFromArchive = async (accountsToRestore: OperatorAccount[]) => {
    try {
      await Promise.all(
        accountsToRestore.map((a) => updateOperatorStatus(a.id, 'active'))
      )
      toast.success(
        accountsToRestore.length === 1
          ? `Operator ${accountsToRestore[0].name} restored successfully`
          : `Restored ${accountsToRestore.length} operator accounts`
      )
      void queryClient.invalidateQueries({ queryKey: operatorKeys.all })
    } catch {
      toast.error('Failed to restore operator accounts')
    }
  }


  const handleDeleteFromArchive = async (accountsToDelete: OperatorAccount[]) => {
    try {
      await Promise.all(accountsToDelete.map((a) => deleteOperator(a.id)))
      toast.success(
        accountsToDelete.length === 1
          ? `Operator ${accountsToDelete[0].name} permanently deleted`
          : `Permanently deleted ${accountsToDelete.length} operator accounts`
      )
      void queryClient.invalidateQueries({ queryKey: operatorKeys.all })
    } catch {
      toast.error('Failed to delete operator accounts')
    }
  }

  const [isExporting, setIsExporting] = useState(false)


  const handleSaveUserInfo = async (
    operator: OperatorAccount,
    data: { firstName: string; lastName: string; birthday: string }
  ) => {
    try {
      await updateOperator(operator.id, data)
      toast.success(`Operator ${data.firstName} ${data.lastName} updated`)
      setUserInfoOperator((prev) =>
        prev
          ? {
              ...prev,
              name: `${data.firstName} ${data.lastName}`.trim(),
              firstName: data.firstName,
              lastName: data.lastName,
              birthday: data.birthday,
            }
          : null
      )
      void queryClient.invalidateQueries({ queryKey: operatorKeys.all })
    } catch {
      toast.error('Failed to update operator')
    }
  }


  const handleArchiveFromUserInfo = async (operator: OperatorAccount) => {
    try {
      await updateOperatorStatus(operator.id, 'suspended')
      toast.success(`Operator ${operator.name} archived`)
      void queryClient.invalidateQueries({ queryKey: operatorKeys.all })
    } catch {
      toast.error('Failed to archive operator')
    }
  }

  const handleExportPdf = async () => {
    try {
      setIsExporting(true)
      const res = await fetchOperatorAccounts({
        search: searchParam,
        status: statusParam as 'all' | 'active' | 'suspended',
        dateRange: dateRangeParam,
        page: 1,
        pageSize: 1000,
      })
      exportOperatorsReport({
        accounts: res.data.length > 0 ? res.data : accounts,
        barangay: stats.barangayName,
        status: statusParam,
        dateRange: dateRangeParam,
        search: searchParam,
      })
      toast.success('Operator accounts report opened in new tab')
    } catch {
      exportOperatorsReport({
        accounts,
        barangay: stats.barangayName,
        status: statusParam,
        dateRange: dateRangeParam,
        search: searchParam,
      })
      toast.success('Operator accounts report opened in new tab')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportSheets = async () => {
    try {
      setIsExporting(true)
      const res = await fetchOperatorAccounts({
        search: searchParam,
        status: statusParam as 'all' | 'active' | 'suspended',
        dateRange: dateRangeParam,
        page: 1,
        pageSize: 1000,
      })
      exportOperatorsToSheets(res.data.length > 0 ? res.data : accounts)
      toast.success('Operator accounts exported as Sheets (CSV)')
    } catch {
      exportOperatorsToSheets(accounts)
      toast.success('Operator accounts exported as Sheets (CSV)')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <PageHeader title="Operator Accounts" />

      <OperatorStats
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
        barangayCode={stats.barangayCode}
        barangayName={stats.barangayName}
        isLoading={isLoading}
      />

      <section
        aria-label="Operator directory"
        className="flex flex-col gap-3.5 rounded-[20px] bg-white px-4 sm:px-5 pt-4.5 pb-2.5 shadow-card w-full overflow-hidden"
      >
        <FilterToolbar
          search={searchParam}
          onSearchChange={(val) => updateParams({ search: val, page: 1 })}
          searchId="operator-search"
          searchLabel="Search a name or an email address"
          searchPlaceholder="Search a name or an email address.."
          status={statusParam}
          onStatusChange={(val) => updateParams({ status: val, page: 1 })}
          statusOptions={OPERATOR_STATUS_OPTIONS}
          statusId="status-select"
          statusAriaLabel="Filter by status"
          dateRange={dateRangeParam}
          onDateRangeChange={(val) => updateParams({ dateRange: val, page: 1 })}
          dateId="date-range-select"
          dateAriaLabel="Filter by date joined"
          onExportPdf={handleExportPdf}
          onExportSheets={handleExportSheets}
          isExporting={isExporting}
          actions={
            <button
              type="button"
              onClick={() => setIsArchiveOpen(true)}
              title={
                archivedAccounts.length > 0
                  ? `Archived Accounts (${archivedAccounts.length})`
                  : 'Archived Accounts'
              }
              aria-label="View archived accounts"
              className="relative flex h-11 sm:h-13 shrink-0 items-center gap-2 rounded-[14px] border border-border bg-white px-3 sm:px-4.5 text-xs font-bold leading-[140%] text-foreground shadow-xs transition-colors hover:border-primary hover:bg-[#FAF9F5] active:scale-95 cursor-pointer"
            >
              <Archive className="h-4 w-4 shrink-0 text-foreground" />
              <span className="hidden sm:inline">Archive</span>
              {archivedAccounts.length > 0 && (
                <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#D92D20] px-1 text-[10px] font-bold text-white shadow-xs">
                  {archivedAccounts.length}
                </span>
              )}
            </button>
          }
        />

        <div className="mt-5">
          <AccountsTable
            accounts={accounts}
            isLoading={isLoading}
            error={isError ? 'Failed to load operator accounts. Please try again.' : null}
            onRetry={() => void refetch()}
            onClearFilters={handleClearFilters}
            onSuspend={(account) => {
              setSelectedOperator(account)
              setIsModalOpen(true)
            }}
            onRowClick={(account) => {
              setUserInfoOperator(account)
              setIsUserInfoOpen(true)
            }}
          />
        </div>

        <Pagination
          currentPage={pageParam}
          totalPages={totalPages}
          totalItems={totalItems}
          currentCount={accounts.length}
          pageSize={pageSize}
          ariaLabel="Table pagination"
          onPageChange={(page) => updateParams({ page })}
        />
      </section>

      <SuspendOperatorModal
        isOpen={isModalOpen}
        operator={selectedOperator}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedOperator(null)
        }}
        onConfirm={handleConfirmStatus}
      />

      <UserInfoModal
        isOpen={isUserInfoOpen}
        operator={userInfoOperator}
        onClose={() => {
          setIsUserInfoOpen(false)
          setUserInfoOperator(null)
        }}
        onSave={handleSaveUserInfo}
        onArchive={handleArchiveFromUserInfo}
      />

      {isArchiveOpen && (
        <ArchiveSidePanel
          isOpen={isArchiveOpen}
          onClose={() => setIsArchiveOpen(false)}
          archivedAccounts={archivedAccounts}
          isLoading={isArchiveLoading}
          onRestore={handleRestoreFromArchive}
          onDelete={handleDeleteFromArchive}
        />
      )}
    </div>
  )
}

export { OperatorAccountsPage as OperatorsPage }
export default OperatorAccountsPage
