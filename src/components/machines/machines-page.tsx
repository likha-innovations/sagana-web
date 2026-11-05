import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { MachinesHeader } from './machines-header'
import { MachinesStats } from './machines-stats'
import { MachinesToolbar } from './machines-toolbar'
import { MachinesTable } from './machines-table'
import { MachinesPagination } from './machines-pagination'
import { useSocketContext } from '@/context/socket-context'
import {
  fetchMachines,
  fetchMachineStats,
  type Machine,
  type MachineStatsData,
} from '@/api/machine.api'
import { exportMachinesReport } from '@/lib/export-machines-report'

export function MachinesPage() {
  const { lastUpdateTimestamp } = useSocketContext()
  const [searchParams, setSearchParams] = useSearchParams()

  const searchParam = searchParams.get('search') || ''
  const statusParam = searchParams.get('status') || 'all'
  const dateRangeParam = searchParams.get('dateRange') || 'all'
  const pageParam = parseInt(searchParams.get('page') || '1', 10)

  const [machines, setMachines] = useState<Machine[]>([])
  const [stats, setStats] = useState<MachineStatsData>({
    registered: 7,
    online: 6,
    offline: 1,
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
    fetchMachineStats().then(setStats).catch(() => {})
  }, [])

  const isFetchingRef = useRef(false)

  const loadMachines = useCallback(
    (isInitial = false) => {
      if (isFetchingRef.current) return
      isFetchingRef.current = true

      if (isInitial) {
        setIsLoading(true)
      }
      setError(null)

      fetchMachines({
        search: searchParam,
        status: statusParam as 'all' | 'online' | 'offline',
        dateRange: dateRangeParam,
        page: pageParam,
        pageSize,
      })
        .then((res) => {
          setMachines(res.data)
          setTotalItems(res.total)
          setTotalPages(res.totalPages)
        })
        .catch(() => {
          if (isInitial) {
            setError('Failed to load machines. Please try again.')
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
    loadMachines(true)
  }, [loadMachines])

  // Real-time live update on WebSocket event (silent in background, no screen flicker!)
  useEffect(() => {
    if (lastUpdateTimestamp > 0) {
      loadMachines(false)
      fetchMachineStats().then(setStats).catch(() => {})
    }
  }, [lastUpdateTimestamp, loadMachines])

  // Background live poll (silent in background, no screen flicker!)
  useEffect(() => {
    const timer = setInterval(() => {
      loadMachines(false)
      fetchMachineStats().then(setStats).catch(() => {})
    }, 10000)
    return () => clearInterval(timer)
  }, [loadMachines])

  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const res = await fetchMachines({
        search: searchParam,
        status: statusParam as 'all' | 'online' | 'offline',
        dateRange: dateRangeParam,
        page: 1,
        pageSize: 1000,
      })
      exportMachinesReport({
        machines: res.data.length > 0 ? res.data : machines,
        search: searchParam,
        status: statusParam,
        dateRange: dateRangeParam,
      })
      toast.success('Machines report opened in new tab')
    } catch {
      exportMachinesReport({
        machines,
        search: searchParam,
        status: statusParam,
        dateRange: dateRangeParam,
      })
      toast.success('Machines report opened in new tab')
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

  const handleViewMachine = (machine: Machine) => {
    toast.info(`Viewing machine: ${machine.code} (${machine.name})`)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Overview heading row */}
      <MachinesHeader filteredMachines={machines} />

      {/* KPI 3 summary cards row */}
      <MachinesStats
        registered={stats.registered}
        online={stats.online}
        offline={stats.offline}
        isLoading={isLoading}
      />

      {/* Machines directory container card */}
      <section
        aria-label="Machines directory"
        className="flex flex-col gap-3.5 rounded-[20px] bg-white px-5 pt-4.5 pb-2.5 shadow-card w-full"
      >
        {/* Toolbar */}
        <MachinesToolbar
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
          <MachinesTable
            machines={machines}
            isLoading={isLoading}
            error={error}
            onRetry={loadMachines}
            onClearFilters={handleClearFilters}
            onView={handleViewMachine}
          />
        </div>

        {/* Pagination Footer */}
        <MachinesPagination
          currentPage={pageParam}
          totalPages={totalPages}
          totalItems={totalItems}
          currentCount={machines.length}
          onPageChange={(page) => updateParams({ page })}
        />
      </section>
    </div>
  )
}

export default MachinesPage
