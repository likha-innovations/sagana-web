import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { Cpu, Wifi, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { createLogger } from '@/lib/logger'
import { PageHeader } from '@/components/ui/page-header'
import { StatsGrid } from '@/components/ui/stats-grid'
import { FilterToolbar } from '@/components/ui/filter-toolbar'
import { Pagination } from '@/components/ui/pagination'
import { type DropdownOption } from '@/components/ui/custom-dropdown'
import { MachinesTable } from './machines-table'
import { MachineInfoModal } from './machine-info-modal'
import { useMachines, useMachineStats } from '@/hooks/use-machines'
import { fetchMachines } from '@/api/machine.api'
import type { Machine } from '@/types/machine'
import { exportMachinesReport } from '@/lib/export-machines-report'
import { exportMachinesToSheets } from '@/lib/export-sheets'

const logger = createLogger('MachinesPage')

const MACHINE_STATUS_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
]

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
        machines: res.data,
        search: searchParam,
        status: statusParam,
        dateRange: dateRangeParam,
      })
      toast.success('Machines report opened in new tab')
    } catch (err) {
      logger.error('Failed to export machines report:', err)
      toast.error('Failed to export machines report. Please try again.')
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
      exportMachinesToSheets(res.data)
      toast.success('Machines inventory exported as Sheets (CSV)')
    } catch (err) {
      logger.error('Failed to export machines inventory:', err)
      toast.error('Failed to export machines inventory. Please try again.')
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
      <PageHeader title="Machines" />

      <StatsGrid
        ariaLabel="Machines Statistics"
        columnsClassName="grid-cols-2 sm:grid-cols-3"
        isLoading={isLoading}
        cards={[
          { label: 'Registered machines', value: stats.registered, icon: Cpu },
          { label: 'Online machines', value: stats.online, icon: Wifi },
          { label: 'Offline machines', value: stats.offline, icon: WifiOff },
        ]}
      />

      <section
        aria-label="Machines directory"
        className="flex flex-col gap-3.5 rounded-[20px] bg-white px-4 sm:px-5 pt-4.5 pb-2.5 shadow-card w-full overflow-hidden"
      >
        <FilterToolbar
          search={searchParam}
          onSearchChange={(val) => updateParams({ search: val, page: 1 })}
          searchId="machine-search"
          searchLabel="Search machine"
          searchPlaceholder="Search a name or an email address.."
          status={statusParam}
          onStatusChange={(val) => updateParams({ status: val, page: 1 })}
          statusOptions={MACHINE_STATUS_OPTIONS}
          statusId="machine-status-select"
          statusAriaLabel="Filter by connection status"
          dateRange={dateRangeParam}
          onDateRangeChange={(val) => updateParams({ dateRange: val, page: 1 })}
          dateId="machine-date-select"
          dateAriaLabel="Filter by date registered"
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

        <Pagination
          currentPage={pageParam}
          totalPages={totalPages}
          totalItems={totalItems}
          currentCount={machines.length}
          pageSize={pageSize}
          ariaLabel="Machines table pagination"
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
