import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { MachinesHeader } from './machines-header'
import { MachinesStats } from './machines-stats'
import { MachinesToolbar } from './machines-toolbar'
import { MachinesTable } from './machines-table'
import { MachinesPagination } from './machines-pagination'
import { MachineInfoModal } from './machine-info-modal'
import { useMachines, useMachineStats } from '@/hooks/use-machines'
import { fetchMachines, type Machine } from '@/api/machine.api'
import { exportMachinesReport } from '@/lib/export-machines-report'
import { exportMachinesToSheets } from '@/lib/export-sheets'

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
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleExportPdf = async () => {
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

  const handleExportSheets = async () => {
    try {
      setIsExporting(true)
      const res = await fetchMachines({
        search: searchParam,
        status: statusParam as 'all' | 'online' | 'offline',
        dateRange: dateRangeParam,
        page: 1,
        pageSize: 1000,
      })
      exportMachinesToSheets(res.data.length > 0 ? res.data : machines)
      toast.success('Machines inventory exported as Sheets (CSV)')
    } catch {
      exportMachinesToSheets(machines)
      toast.success('Machines inventory exported as Sheets (CSV)')
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
    setSelectedMachine(machine)
    setIsModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <MachinesHeader filteredMachines={machines} />

      <MachinesStats
        registered={stats.registered}
        online={stats.online}
        offline={stats.offline}
        isLoading={isLoading}
      />

      <section
        aria-label="Machines directory"
        className="flex flex-col gap-3.5 rounded-[20px] bg-white px-4 sm:px-5 pt-4.5 pb-2.5 shadow-card w-full overflow-hidden"
      >
        <MachinesToolbar
          search={searchParam}
          onSearchChange={(val) => updateParams({ search: val, page: 1 })}
          status={statusParam}
          onStatusChange={(val) => updateParams({ status: val, page: 1 })}
          dateRange={dateRangeParam}
          onDateRangeChange={(val) => updateParams({ dateRange: val, page: 1 })}
          onExportPdf={handleExportPdf}
          onExportSheets={handleExportSheets}
          isExporting={isExporting}
        />

        <div className="mt-5">
          <MachinesTable
            machines={machines}
            isLoading={isLoading}
            error={isError ? 'Failed to load machines. Please try again.' : null}
            onRetry={() => void refetch()}
            onClearFilters={handleClearFilters}
            onView={handleViewMachine}
          />
        </div>

        <MachinesPagination
          currentPage={pageParam}
          totalPages={totalPages}
          totalItems={totalItems}
          currentCount={machines.length}
          pageSize={pageSize}
          onPageChange={(page) => updateParams({ page })}
        />
      </section>

      <MachineInfoModal
        isOpen={isModalOpen}
        machine={selectedMachine}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedMachine(null)
        }}
      />
    </div>
  )
}

export default MachinesPage
