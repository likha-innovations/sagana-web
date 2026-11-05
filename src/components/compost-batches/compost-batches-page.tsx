import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { CompostBatchesHeader } from './compost-batches-header'
import { CompostBatchesStats } from './compost-batches-stats'
import { CompostBatchesToolbar } from './compost-batches-toolbar'
import { CompostBatchesTable } from './compost-batches-table'
import { CompostBatchesPagination } from './compost-batches-pagination'
import { useSocketContext } from '@/context/socket-context'
import {
  fetchBatches,
  fetchBatchStats,
  type Batch,
  type BatchStatsData,
  type BatchPhase,
} from '@/api/batch.api'
import { exportBatchesReport } from '@/lib/export-batches-report'

export function CompostBatchesPage() {
  const { lastUpdateTimestamp } = useSocketContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const searchParam = searchParams.get('search') || ''
  const statusParam = searchParams.get('status') || 'all'
  const dateRangeParam = searchParams.get('dateRange') || 'all'
  const pageParam = parseInt(searchParams.get('page') || '1', 10)

  const [batches, setBatches] = useState<Batch[]>([])
  const [stats, setStats] = useState<BatchStatsData>({
    allTimeTotalProduced: '741 kg',
    totalCompostBatches: 8,
    finishedBatches: 5,
    ongoingBatches: 3,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
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

  useEffect(() => {
    fetchBatchStats().then(setStats).catch(() => {})
  }, [])

  const isFetchingRef = useRef(false)

  const loadBatches = useCallback(
    (isInitial = false) => {
      if (isFetchingRef.current) return
      isFetchingRef.current = true

      if (isInitial) {
        setIsLoading(true)
      }
      setError(null)

      fetchBatches({
        search: searchParam,
        status: statusParam as 'all' | BatchPhase,
        dateRange: dateRangeParam,
        page: pageParam,
        pageSize,
      })
        .then((res) => {
          setBatches(res.data)
          setTotalItems(res.total)
          setTotalPages(res.totalPages)
        })
        .catch(() => {
          if (isInitial) {
            setError('Failed to load compost batches. Please try again.')
          }
        })
        .finally(() => {
          if (isInitial) {
            setIsLoading(false)
          }
          isFetchingRef.current = false
        })
    },
    [searchParam, statusParam, dateRangeParam, pageParam]
  )

  // Initial load or parameter change (shows skeleton)
  useEffect(() => {
    loadBatches(true)
  }, [loadBatches])

  // Real-time live update on WebSocket event (silent in background, no screen flicker!)
  useEffect(() => {
    if (lastUpdateTimestamp > 0) {
      loadBatches(false)
      fetchBatchStats().then(setStats).catch(() => {})
    }
  }, [lastUpdateTimestamp, loadBatches])

  // Background live poll (silent in background, no screen flicker!)
  useEffect(() => {
    const timer = setInterval(() => {
      loadBatches(false)
      fetchBatchStats().then(setStats).catch(() => {})
    }, 10000)
    return () => clearInterval(timer)
  }, [loadBatches])

  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const res = await fetchBatches({
        search: searchParam,
        status: statusParam as 'all' | BatchPhase,
        dateRange: dateRangeParam,
        page: 1,
        pageSize: 1000,
      })
      exportBatchesReport({
        batches: res.data.length > 0 ? res.data : batches,
        search: searchParam,
        status: statusParam,
        dateRange: dateRangeParam,
      })
      toast.success('Compost batches report opened in new tab')
    } catch {
      exportBatchesReport({
        batches,
        search: searchParam,
        status: statusParam,
        dateRange: dateRangeParam,
      })
      toast.success('Compost batches report opened in new tab')
    } finally {
      setIsExporting(false)
    }
  }

  const handleClearFilters = () => {
    updateParams({
      search: null,
      status: null,
      dateRange: null,
      page: 1,
    })
  }

  const handleViewBatch = (batch: Batch) => {
    toast.info(`Viewing batch: ${batch.code} (${batch.status})`)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Overview heading row */}
      <CompostBatchesHeader filteredBatches={batches} />

      {/* KPI 4 summary cards row */}
      <CompostBatchesStats stats={stats} isLoading={isLoading} />

      {/* Compost batches directory container card */}
      <section
        aria-label="Compost batches directory"
        className="flex flex-col gap-3.5 rounded-[20px] bg-white px-5 pt-4.5 pb-2.5 shadow-card w-full"
      >
        {/* Toolbar */}
        <CompostBatchesToolbar
          search={searchParam}
          onSearchChange={(val) => updateParams({ search: val, page: 1 })}
          status={statusParam}
          onStatusChange={(val) => updateParams({ status: val, page: 1 })}
          dateRange={dateRangeParam}
          onDateRangeChange={(val) => updateParams({ dateRange: val, page: 1 })}
          onExport={handleExport}
          isExporting={isExporting}
        />

        {/* Table with 20px space from toolbar */}
        <div className="mt-[20px]">
          <CompostBatchesTable
            batches={batches}
            isLoading={isLoading}
            error={error}
            onRetry={loadBatches}
            onClearFilters={handleClearFilters}
            onView={handleViewBatch}
          />
        </div>

        {/* Pagination Footer */}
        <CompostBatchesPagination
          currentPage={pageParam}
          totalPages={totalPages}
          totalItems={totalItems}
          currentCount={batches.length}
          onPageChange={(page) => updateParams({ page })}
        />
      </section>
    </div>
  )
}

export default CompostBatchesPage
