import { useState, useEffect } from 'react'
import { Search, Calendar, Archive } from 'lucide-react'
import { CustomDropdown, type DropdownOption } from '@/components/ui/custom-dropdown'
import { ExportDropdown } from '@/components/ui/export-dropdown'

interface AccountsToolbarProps {
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
  onOpenArchive?: () => void
  archivedCount?: number
}

const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
]

const DATE_RANGE_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All time' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'this-year', label: 'This year' },
]

export function AccountsToolbar({
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
  onOpenArchive,
  archivedCount = 0,
}: AccountsToolbarProps) {

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
        <label htmlFor="operator-search" className="sr-only">
          Search a name or an email address
        </label>
        <input
          id="operator-search"
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

      <div className="flex items-center gap-2 sm:gap-3">
        <CustomDropdown
          id="status-select"
          value={status}
          onChange={onStatusChange}
          options={STATUS_OPTIONS}
          ariaLabel="Filter by status"
          className="flex-1 min-w-28 sm:w-40 sm:flex-none"
        />

        <CustomDropdown
          id="date-range-select"
          value={dateRange}
          onChange={onDateRangeChange}
          options={DATE_RANGE_OPTIONS}
          rightIcon={<Calendar className="h-4 w-4 text-text-email" />}
          ariaLabel="Filter by date joined"
          enableCustomDateRange
          align="right"
          className="flex-1 min-w-28 sm:w-40 sm:flex-none"
        />

        {onOpenArchive && (
          <button
            type="button"
            onClick={onOpenArchive}
            title={archivedCount > 0 ? `Archived Accounts (${archivedCount})` : 'Archived Accounts'}
            aria-label="View archived accounts"
            className="relative flex h-11 sm:h-13 shrink-0 items-center gap-2 rounded-[14px] border border-border bg-white px-3 sm:px-4.5 text-xs font-bold leading-[140%] text-foreground shadow-xs transition-colors hover:border-primary hover:bg-[#FAF9F5] active:scale-95 cursor-pointer"
          >
            <Archive className="h-4 w-4 shrink-0 text-foreground" />
            <span className="hidden sm:inline">Archive</span>
            {archivedCount > 0 && (
              <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#D92D20] px-1 text-[10px] font-bold text-white shadow-xs">
                {archivedCount}
              </span>
            )}
          </button>
        )}

        {(onExportPdf || onExportSheets || onExport) && (
          <ExportDropdown
            onExportPdf={onExportPdf ?? onExport ?? (() => { })}
            onExportSheets={onExportSheets ?? (() => { })}
            isExporting={isExporting}
          />
        )}
      </div>
    </div>
  )
}
