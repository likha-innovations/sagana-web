import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { Archive } from 'lucide-react'
import { toast } from 'sonner'
import { createLogger } from '@/lib/logger'
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
  useUpdateOperator,
  useUpdateOperatorStatus,
  useDeleteOperator,
} from '@/hooks/use-operators'
import { fetchOperatorAccounts } from '@/api/operator.api'
import {
  getOperatorName,
  type OperatorAccount,
  type UpdateOperatorInput,
} from '@/types/operator'
import { exportOperatorsReport } from '@/lib/export-operators-report'
import { exportOperatorsToSheets } from '@/lib/export-sheets'

const logger = createLogger('OperatorsPage')

const OPERATOR_STATUS_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
]

export function OperatorAccountsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const updateOperatorMutation = useUpdateOperator()
  const updateStatusMutation = useUpdateOperatorStatus()
  const deleteOperatorMutation = useDeleteOperator()


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
      await updateStatusMutation.mutateAsync({ id: operator.id, status: newStatus })
      const name = getOperatorName(operator)
      if (newStatus === 'suspended') {
        toast.success(`Operator ${name} suspended and moved to archive`)
      } else {
        toast.success(`Operator ${name} has been activated`)
      }
    } catch (err) {
      logger.error('Failed to update operator status:', err)
      toast.error('Failed to update operator status on server')
    }
  }


  const handleRestoreFromArchive = async (accountsToRestore: OperatorAccount[]) => {
    try {
      await Promise.all(
        accountsToRestore.map((a) =>
          updateStatusMutation.mutateAsync({ id: a.id, status: 'active' })
        )
      )
      toast.success(
        accountsToRestore.length === 1
          ? `Operator ${getOperatorName(accountsToRestore[0])} restored successfully`
          : `Restored ${accountsToRestore.length} operator accounts`
      )
    } catch (err) {
      logger.error('Failed to restore operator accounts:', err)
      toast.error('Failed to restore operator accounts')
    }
  }


  const handleDeleteFromArchive = async (accountsToDelete: OperatorAccount[]) => {
    try {
      await Promise.all(
        accountsToDelete.map((a) => deleteOperatorMutation.mutateAsync(a.id))
      )
      toast.success(
        accountsToDelete.length === 1
          ? `Operator ${getOperatorName(accountsToDelete[0])} permanently deleted`
          : `Permanently deleted ${accountsToDelete.length} operator accounts`
      )
    } catch (err) {
      logger.error('Failed to delete operator accounts:', err)
      toast.error('Failed to delete operator accounts')
    }
  }

  const [isExporting, setIsExporting] = useState(false)


  const handleSaveUserInfo = async (
    operator: OperatorAccount,
    data: UpdateOperatorInput
  ) => {
    try {
      await updateOperatorMutation.mutateAsync({ id: operator.id, data })
      toast.success(`Operator ${data.fullName} updated`)
      setUserInfoOperator((prev) =>
        prev
          ? {
              ...prev,
              fullName: data.fullName,
              birthday: data.birthday ?? null,
            }
          : null
      )
    } catch (err) {
      logger.error('Failed to update operator:', err)
      toast.error('Failed to update operator')
    }
  }


  const handleArchiveFromUserInfo = async (operator: OperatorAccount) => {
    try {
      await updateStatusMutation.mutateAsync({ id: operator.id, status: 'suspended' })
      toast.success(`Operator ${getOperatorName(operator)} archived`)
    } catch (err) {
      logger.error('Failed to archive operator:', err)
      toast.error('Failed to archive operator')
    }
  }

  const fetchAllOperatorsForExport = async (): Promise<OperatorAccount[]> => {
    // ponytail: fetchOperatorAccounts loads /operators once and slices client-side, so 1 call collects all matching rows
    const res = await fetchOperatorAccounts({
      search: searchParam,
      status: statusParam as 'all' | 'active' | 'suspended',
      dateRange: dateRangeParam,
      page: 1,
      pageSize: Number.MAX_SAFE_INTEGER,
    })
    return res.data
  }

  const handleExportPdf = async () => {
    try {
      setIsExporting(true)
      const allAccounts = await fetchAllOperatorsForExport()
      exportOperatorsReport({
        accounts: allAccounts,
        barangay: stats.barangayName,
        status: statusParam,
        dateRange: dateRangeParam,
        search: searchParam,
      })
      toast.success('Operator accounts report opened in new tab')
    } catch (err) {
      logger.error('Failed to export operator accounts report:', err)
      toast.error('Failed to export operator accounts report. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportSheets = async () => {
    try {
      setIsExporting(true)
      const allAccounts = await fetchAllOperatorsForExport()
      exportOperatorsToSheets(allAccounts)
      toast.success('Operator accounts exported as Sheets (CSV)')
    } catch (err) {
      logger.error('Failed to export operator accounts to sheets:', err)
      toast.error('Failed to export operator accounts. Please try again.')
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
