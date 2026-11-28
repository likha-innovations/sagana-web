import { useState, useEffect, type ReactNode } from 'react'
import { Search, Calendar } from 'lucide-react'
import { CustomDropdown, type DropdownOption } from './custom-dropdown'
import { ExportDropdown } from './export-dropdown'
import { DATE_RANGE_OPTIONS } from '@/lib/date-range'

export interface FilterToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  searchId: string
  searchLabel: string
  searchPlaceholder: string
  status: string
  onStatusChange: (value: string) => void
  statusOptions: DropdownOption[]
  statusId: string
  statusAriaLabel: string
  dateRange: string
  onDateRangeChange: (value: string) => void
  dateId: string
  dateAriaLabel: string
  onExportPdf?: () => void
  onExportSheets?: () => void
  onExport?: () => void
  isExporting?: boolean
  actions?: ReactNode
}

export function FilterToolbar({
  search,
  onSearchChange,
  searchId,
  searchLabel,
  searchPlaceholder,
  status,
  onStatusChange,
  statusOptions,
  statusId,
  statusAriaLabel,
  dateRange,
  onDateRangeChange,
  dateId,
  dateAriaLabel,
  onExportPdf,
  onExportSheets,
  onExport,
  isExporting = false,
  actions,
}: FilterToolbarProps) {
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
        <label htmlFor={searchId} className="sr-only">
          {searchLabel}
        </label>
        <input
          id={searchId}
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-11 sm:h-13 w-full rounded-[14px] border border-border bg-white px-4 pr-11 text-xs leading-[140%] text-foreground placeholder:text-text-secondary outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30"
        />
        <Search
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-email"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <CustomDropdown
          id={statusId}
          value={status}
          onChange={onStatusChange}
          options={statusOptions}
          ariaLabel={statusAriaLabel}
          className="flex-1 min-w-28 sm:w-40 sm:flex-none"
        />

        <CustomDropdown
          id={dateId}
          value={dateRange}
          onChange={onDateRangeChange}
          options={DATE_RANGE_OPTIONS}
          rightIcon={<Calendar className="h-4 w-4 text-text-email" />}
          ariaLabel={dateAriaLabel}
          enableCustomDateRange
          align="right"
          className="flex-1 min-w-28 sm:w-40 sm:flex-none"
        />

        {actions}

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
