import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { OverviewHeader } from './overview-header'
import { OperatorStats } from './operator-stats'
import { AccountsToolbar } from './accounts-toolbar'
import { AccountsTable } from './accounts-table'
import { AccountsPagination } from './accounts-pagination'
import { SuspendOperatorModal } from './suspend-operator-modal'
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
  deleteOperator,
  type OperatorAccount,
} from '@/api/operator.api'
import { exportOperatorsReport } from '@/lib/export-operators-report'

export function OperatorAccountsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  // Read search params
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

  // Clear filters
  const handleClearFilters = () => {
    updateParams({
      search: null,
      status: null,
      dateRange: null,
      page: 1,
    })
  }

  // Update status from modal with backend persistence
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

  // Archive bulk/individual restore
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

  // Archive bulk/individual delete
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

  const handleExport = async () => {
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

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Overview heading row */}
      <OverviewHeader />

      {/* KPI summary row with preserved gap between 3 cards and Barangay card */}
      <OperatorStats
        total={stats.total}
        active={stats.active}
        inactive={stats.inactive}
        barangayCode={stats.barangayCode}
        barangayName={stats.barangayName}
        isLoading={isLoading}
      />

      {/* Operator directory container card */}
      <section
        aria-label="Operator directory"
        className="flex flex-col gap-3.5 rounded-[20px] bg-white px-5 pt-4.5 pb-2.5 shadow-card w-full"
      >
        {/* Toolbar */}
        <AccountsToolbar
          search={searchParam}
          onSearchChange={(val) => updateParams({ search: val, page: 1 })}
          status={statusParam}
          onStatusChange={(val) => updateParams({ status: val, page: 1 })}
          dateRange={dateRangeParam}
          onDateRangeChange={(val) => updateParams({ dateRange: val, page: 1 })}
          onExport={handleExport}
          isExporting={isExporting}
          onOpenArchive={() => setIsArchiveOpen(true)}
          archivedCount={archivedAccounts.length}
        />

        {/* Table with 20px space from toolbar */}
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
          />
        </div>

        {/* Pagination Footer */}
        <AccountsPagination
          currentPage={pageParam}
          totalPages={totalPages}
          totalItems={totalItems}
          currentCount={accounts.length}
          onPageChange={(page) => updateParams({ page })}
        />
      </section>

      {/* Suspend / Activate Operator Modal */}
      <SuspendOperatorModal
        isOpen={isModalOpen}
        operator={selectedOperator}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedOperator(null)
        }}
        onConfirm={handleConfirmStatus}
      />

      {/* Archive Side Panel */}
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
