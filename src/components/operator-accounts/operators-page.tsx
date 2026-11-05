import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { OverviewHeader } from './overview-header'
import { OperatorStats } from './operator-stats'
import { AccountsToolbar } from './accounts-toolbar'
import { AccountsTable } from './accounts-table'
import { AccountsPagination } from './accounts-pagination'
import { SuspendOperatorModal } from './suspend-operator-modal'
import { ArchiveSidePanel } from './archive-side-panel'
import { useSocketContext } from '@/context/socket-context'
import {
  fetchOperatorAccounts,
  fetchOperatorStats,
  fetchArchivedOperators,
  updateOperatorStatus,
  deleteOperator,
  type OperatorAccount,
  type OperatorStatsData,
} from '@/api/operator.api'
import { exportOperatorsReport } from '@/lib/export-operators-report'

export function OperatorAccountsPage() {
  const { lastUpdateTimestamp } = useSocketContext()
  const [searchParams, setSearchParams] = useSearchParams()

  // Read search params
  const searchParam = searchParams.get('search') || ''
  const statusParam = searchParams.get('status') || 'all'
  const barangayParam = searchParams.get('barangay') || 'all'
  const dateRangeParam = searchParams.get('dateRange') || 'all'
  const pageParam = parseInt(searchParams.get('page') || '1', 10)

  // State
  const [accounts, setAccounts] = useState<OperatorAccount[]>([])
  const [stats, setStats] = useState<OperatorStatsData>({
    total: 8,
    active: 5,
    inactive: 1,
    barangayCode: '67SHVY',
    barangayName: 'Barangay 176-E',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOperator, setSelectedOperator] = useState<OperatorAccount | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Archive side panel state
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [archivedAccounts, setArchivedAccounts] = useState<OperatorAccount[]>([])
  const [isArchiveLoading, setIsArchiveLoading] = useState(false)

  const isArchiveFetchingRef = useRef(false)
  const hasLoadedArchiveRef = useRef(false)

  const loadArchive = useCallback((isInitial = false) => {
    if (isArchiveFetchingRef.current) return
    isArchiveFetchingRef.current = true

    // Only show loading spinner on the very first load
    if (isInitial && !hasLoadedArchiveRef.current) {
      setIsArchiveLoading(true)
    }

    fetchArchivedOperators()
      .then((data) => {
        setArchivedAccounts(data)
        hasLoadedArchiveRef.current = true
      })
      .catch(() => {})
      .finally(() => {
        if (isInitial) {
          setIsArchiveLoading(false)
        }
        isArchiveFetchingRef.current = false
      })
  }, [])

  useEffect(() => {
    loadArchive(true)
  }, [loadArchive])

  // Pagination state
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 10

  // Helper to update URL params
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

  // Load stats
  useEffect(() => {
    fetchOperatorStats().then(setStats).catch(() => {
      // Keep defaults
    })
  }, [])

  const isFetchingRef = useRef(false)

  // Load accounts — only trigger full skeleton loading when isInitial is true
  const loadAccounts = useCallback(
    (isInitial = false) => {
      if (isFetchingRef.current) return
      isFetchingRef.current = true

      if (isInitial) {
        setIsLoading(true)
      }
      setError(null)

      fetchOperatorAccounts({
        search: searchParam,
        status: statusParam as 'all' | 'active' | 'suspended',
        barangay: barangayParam,
        dateRange: dateRangeParam,
        page: pageParam,
        pageSize,
      })
        .then((res) => {
          setAccounts(res.data)
          setTotalItems(res.total)
          setTotalPages(res.totalPages)
        })
        .catch(() => {
          if (isInitial) {
            setError('Failed to load operator accounts. Please try again.')
          }
        })
        .finally(() => {
          if (isInitial) {
            setIsLoading(false)
          }
          isFetchingRef.current = false
        })
    },
    [searchParam, statusParam, barangayParam, dateRangeParam, pageParam]
  )

  // Initial load or parameter change (shows skeleton)
  useEffect(() => {
    loadAccounts(true)
    fetchOperatorStats().then(setStats).catch(() => {})
  }, [loadAccounts])

  // Real-time live update on WebSocket event (silent in background, no screen flicker!)
  useEffect(() => {
    if (lastUpdateTimestamp > 0) {
      loadAccounts(false)
      loadArchive()
      fetchOperatorStats().then(setStats).catch(() => {})
    }
  }, [lastUpdateTimestamp, loadAccounts, loadArchive])

  // Background live poll (silent in background, no screen flicker!)
  useEffect(() => {
    const timer = setInterval(() => {
      loadAccounts(false)
      loadArchive()
      fetchOperatorStats().then(setStats).catch(() => {})
    }, 10000)
    return () => clearInterval(timer)
  }, [loadAccounts, loadArchive])

  // Barangay options
  const barangayOptions = useMemo(() => {
    const list = accounts.map((a) => a.barangay).filter(Boolean)
    const unique = Array.from(new Set(list))
    return unique.length > 0 ? unique : ['Barangay 176-E']
  }, [accounts])

  // Clear filters
  const handleClearFilters = () => {
    updateParams({
      search: null,
      status: null,
      barangay: null,
      dateRange: null,
      page: 1,
    })
  }

  // Update status from modal with backend persistence
  const handleConfirmStatus = async (
    operator: OperatorAccount,
    newStatus: 'active' | 'suspended'
  ) => {
    // Optimistic UI update
    setAccounts((prev) =>
      prev.map((op) => (op.id === operator.id ? { ...op, status: newStatus } : op))
    )
    try {
      await updateOperatorStatus(operator.id, newStatus)
      if (newStatus === 'suspended') {
        toast.success(`Operator ${operator.name} suspended and moved to archive`)
      } else {
        toast.success(`Operator ${operator.name} has been activated`)
      }
      loadAccounts()
      loadArchive()
      fetchOperatorStats().then(setStats).catch(() => {})
    } catch {
      toast.error('Failed to update operator status on server')
      loadAccounts()
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
      loadAccounts()
      loadArchive()
      fetchOperatorStats().then(setStats).catch(() => {})
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
      loadArchive()
      loadAccounts()
      fetchOperatorStats().then(setStats).catch(() => {})
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
        barangay: barangayParam,
        dateRange: dateRangeParam,
        page: 1,
        pageSize: 1000,
      })
      exportOperatorsReport({
        accounts: res.data.length > 0 ? res.data : accounts,
        barangay: barangayParam,
        status: statusParam,
        dateRange: dateRangeParam,
        search: searchParam,
      })
      toast.success('Operator accounts report opened in new tab')
    } catch {
      exportOperatorsReport({
        accounts,
        barangay: barangayParam,
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
          barangay={barangayParam}
          onBarangayChange={(val) => updateParams({ barangay: val, page: 1 })}
          barangayOptions={barangayOptions}
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
            error={error}
            onRetry={loadAccounts}
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
