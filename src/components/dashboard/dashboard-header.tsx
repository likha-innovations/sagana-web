import { CalendarDays, MapPin } from 'lucide-react'
import { DATE_RANGE_OPTIONS } from '@/lib/date-range'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { ExportDropdown } from '@/components/ui/export-dropdown'

type DashboardHeaderProps = {
  barangay?: string
  dateRange?: string
  onDateRangeChange?: (value: string) => void
  onExportPdf?: () => void | Promise<void>
  onExportSheets?: () => void | Promise<void>
  onExport?: () => void | Promise<void>
}

export function DashboardHeader({
  barangay = 'Assigned Barangay',
  dateRange = 'this-month',
  onDateRangeChange,
  onExportPdf,
  onExportSheets,
  onExport,
}: DashboardHeaderProps) {
  const handlePdfExport = onExportPdf ?? onExport ?? (() => {})
  const handleSheetsExport = onExportSheets ?? (() => {})

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-[31px] font-bold leading-[1.3] text-foreground flex items-center justify-between">
          <span>Dashboard</span>
          <span className="sm:hidden">
            <ExportDropdown
              variant="dashboard"
              onExportPdf={handlePdfExport}
              onExportSheets={handleSheetsExport}
            />
          </span>
        </h1>

        <div className="flex items-center gap-3">
          <div className="flex flex-1 sm:flex-none h-9.25 items-center gap-2 rounded-[14px] border border-border bg-page px-4 text-xs font-bold leading-[1.4] text-foreground select-none">
            <MapPin className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
            <span className="truncate">{barangay}</span>
          </div>

          <CustomDropdown
            id="dashboard-date-select"
            value={dateRange}
            onChange={(val) => onDateRangeChange?.(val)}
            options={DATE_RANGE_OPTIONS}
            leftIcon={<CalendarDays className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />}
            ariaLabel="Filter dashboard by date range"
            enableCustomDateRange
            align="right"
            className="flex-1 sm:flex-none sm:w-auto sm:min-w-36"
            triggerClassName="h-9.25 rounded-[14px] bg-page px-4 text-xs font-bold leading-[1.4] hover:bg-[#FAF9F5]"
          />

          <div className="hidden sm:block">
            <ExportDropdown
              variant="dashboard"
              onExportPdf={handlePdfExport}
              onExportSheets={handleSheetsExport}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
