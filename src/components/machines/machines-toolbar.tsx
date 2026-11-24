import { useState, useEffect } from 'react'
import { Search, Calendar } from 'lucide-react'
import { CustomDropdown, type DropdownOption } from '@/components/ui/custom-dropdown'
import { ExportDropdown } from '@/components/ui/export-dropdown'

interface MachinesToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  dateRange: string
  onDateRangeChange: (value: string) => void
  onExportPdf?: () => void
  onExportSheets?: () => void
  onExport?: () => void
  isExporting?: boolean
}

const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
]

const DATE_RANGE_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'this-year', label: 'This year' },
]

export function MachinesToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  onExportPdf,
  onExportSheets,
  onExport,
  isExporting = false,
}: MachinesToolbarProps) {
  const [localSearch, setLocalSearch] = useState(search)
  const [prevSearch, setPrevSearch] = useState(search)

  if (prevSearch !== search) {
    setPrevSearch(search)
    setLocalSearch(search)
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch)
      }
    }, 300)

    return () => clearTimeout(handler)
  }, [localSearch, search, onSearchChange])

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between w-full">
      <div className="relative flex-1 lg:max-w-169">
        <label htmlFor="machine-search" className="sr-only">
          Search machine
        </label>
        <input
          id="machine-search"
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search a name or an email address.."
          className="h-11 sm:h-13 w-full rounded-[14px] border border-border bg-white px-4 pr-11 text-xs leading-[140%] text-foreground placeholder:text-text-secondary outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
        <Search
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-email"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <CustomDropdown
          id="machine-status-select"
          value={status}
          onChange={onStatusChange}
          options={STATUS_OPTIONS}
          ariaLabel="Filter by connection status"
          className="flex-1 min-w-28 sm:w-40 sm:flex-none"
        />

        <CustomDropdown
          id="machine-date-select"
          value={dateRange}
          onChange={onDateRangeChange}
          options={DATE_RANGE_OPTIONS}
          rightIcon={<Calendar className="h-4 w-4 text-text-email" />}
          ariaLabel="Filter by date registered"
          enableCustomDateRange
          align="right"
          className="flex-1 min-w-28 sm:w-40 sm:flex-none"
        />

        {(onExportPdf || onExportSheets || onExport) && (
          <ExportDropdown
            onExportPdf={onExportPdf ?? onExport ?? (() => {})}
            onExportSheets={onExportSheets ?? (() => {})}
            isExporting={isExporting}
          />
        )}
      </div>
    </div>
  )
}
