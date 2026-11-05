import { useState, useEffect } from 'react'
import { Search, Calendar, Download, Loader2 } from 'lucide-react'
import { CustomDropdown, type DropdownOption } from '@/components/ui/custom-dropdown'

interface CompostBatchesToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  dateRange: string
  onDateRangeChange: (value: string) => void
  onExport?: () => void
  isExporting?: boolean
}

const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Cooling', label: 'Cooling' },
  { value: 'Thermophilic', label: 'Thermophilic' },
  { value: 'Mesophilic', label: 'Mesophilic' },
  { value: 'Completed', label: 'Completed' },
]

const DATE_RANGE_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'this-year', label: 'This year' },
]

export function CompostBatchesToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  dateRange,
  onDateRangeChange,
  onExport,
  isExporting = false,
}: CompostBatchesToolbarProps) {
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
      {/* Search Input */}
      <div className="relative flex-1 lg:max-w-[676px]">
        <label htmlFor="batch-search" className="sr-only">
          Search a batch ID, status, or feedstock weight
        </label>
        <input
          id="batch-search"
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search a batch ID, status, or feedstock weight.."
          className="h-[52px] w-full rounded-[14px] border border-[#DCDBD5] bg-white px-4 pr-11 text-xs leading-[140%] text-[#414141] placeholder:text-[#AFAEA7] outline-none transition-all focus:border-[#718619] focus:ring-1 focus:ring-[#718619]/30"
        />
        <Search
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7C7D74]"
          aria-hidden="true"
        />
      </div>

      {/* Filter group */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <CustomDropdown
          id="batch-status-select"
          value={status}
          onChange={onStatusChange}
          options={STATUS_OPTIONS}
          ariaLabel="Filter by batch status"
        />

        {/* Date Range Filter */}
        <CustomDropdown
          id="batch-date-select"
          value={dateRange}
          onChange={onDateRangeChange}
          options={DATE_RANGE_OPTIONS}
          rightIcon={<Calendar className="h-4 w-4 text-[#7C7D74]" />}
          ariaLabel="Filter by date"
          enableCustomDateRange
          align="right"
        />

        {/* Export Button */}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            disabled={isExporting}
            title="Export report"
            aria-label="Export report"
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] border border-[#DCDBD5] bg-white text-[#414141] shadow-xs transition-colors hover:border-[#718619] hover:bg-[#718619] hover:text-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Download className="h-4.5 w-4.5" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
