import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { MachinesHeader } from './machines-header'
import { MachinesStats } from './machines-stats'
import { MachinesToolbar } from './machines-toolbar'
import { MachinesTable } from './machines-table'
import { MachinesPagination } from './machines-pagination'
import { useMachines, useMachineStats } from '@/hooks/use-machines'
import { fetchMachines, type Machine } from '@/api/machine.api'
import { exportMachinesReport } from '@/lib/export-machines-report'

export function MachinesPage() {
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
    data: machinesData,
    isLoading,
    isError,
    refetch,
  } = useMachines({
    search: searchParam,
    status: statusParam as 'all' | 'online' | 'offline',
    dateRange: dateRangeParam,
    page: pageParam,
    pageSize,
  })

  const { data: statsData } = useMachineStats()

  const machines = machinesData?.data ?? []
  const totalItems = machinesData?.total ?? 0
  const totalPages = machinesData?.totalPages ?? 1

  const stats = statsData ?? {
    registered: 0,
    online: 0,
    offline: 0,
  }

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
            error={isError ? 'Failed to load machines. Please try again.' : null}
            onRetry={() => void refetch()}
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
