import { useState, useEffect } from 'react'
import { CalendarDays, MapPin } from 'lucide-react'
import { getCurrentMonthDateRange } from '@/lib/date-range'
import { DateRangeCalendar } from '@/components/ui/date-range-calendar'
import { ExportDropdown } from '@/components/ui/export-dropdown'

type DashboardHeaderProps = {
    barangay?: string
    dateRange?: string
    onDateRangeChange?: (start: Date, end: Date) => void
    onDateRangeReset?: () => void
    onExportPdf?: () => void | Promise<void>
    onExportSheets?: () => void | Promise<void>
    onExport?: () => void | Promise<void>
}

export function DashboardHeader({
    barangay = 'Barangay 176-E',
    dateRange,
    onDateRangeChange,
    onDateRangeReset: _onDateRangeReset,
    onExportPdf,
    onExportSheets,
    onExport,
}: DashboardHeaderProps) {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [liveDateRange, setLiveDateRange] = useState(() => getCurrentMonthDateRange())

    useEffect(() => {
        const updateRange = () => {
            const next = getCurrentMonthDateRange()
            setLiveDateRange((prev) => (prev !== next ? next : prev))
        }

        const interval = setInterval(updateRange, 60_000)

        window.addEventListener('focus', updateRange)
        document.addEventListener('visibilitychange', updateRange)

        return () => {
            clearInterval(interval)
            window.removeEventListener('focus', updateRange)
            document.removeEventListener('visibilitychange', updateRange)
        }
    }, [])


    useEffect(() => {
        if (!isCalendarOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsCalendarOpen(false)
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isCalendarOpen])

    const displayDateRange = dateRange || liveDateRange


    const existingRange = dateRange ? parseDisplayedRange(dateRange) : null

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
                <div
                    className="flex flex-1 sm:flex-none h-9.25 items-center gap-2 rounded-[14px] border border-border bg-page px-4 text-xs font-bold leading-[1.4] text-foreground select-none"
                >
                    <MapPin className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
                    <span>{barangay}</span>
                </div>

                <button
                    type="button"
                    onClick={() => setIsCalendarOpen((prev) => !prev)}
                    className={`flex flex-1 sm:flex-none h-9.25 items-center gap-2 rounded-[14px] border bg-page px-4 text-xs font-bold leading-[1.4] text-foreground cursor-pointer transition-colors ${isCalendarOpen
                        ? 'border-primary ring-1 ring-primary/25'
                        : 'border-border hover:border-[#CAC9C2]'
                        }`}
                >
                    <CalendarDays className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
                    <span>{displayDateRange}</span>
                </button>

                <div className="hidden sm:block">
                    <ExportDropdown
                        variant="dashboard"
                        onExportPdf={handlePdfExport}
                        onExportSheets={handleSheetsExport}
                    />
                </div>

                {isCalendarOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                            className="absolute inset-0 bg-black/40"
                            onClick={() => setIsCalendarOpen(false)}
                        />
                        <div className="relative rounded-2xl bg-[#FDFCF7] p-1.5 shadow-[0_12px_32px_rgba(65,65,65,0.14)] animate-in fade-in zoom-in-95 duration-150 w-72.5">
                            <DateRangeCalendar
                                startDate={existingRange?.start ?? null}
                                endDate={existingRange?.end ?? null}
                                onRangeSelect={(start, end) => {
                                    onDateRangeChange?.(start, end)
                                    setIsCalendarOpen(false)
                                }}
                                onCancel={() => setIsCalendarOpen(false)}
                            />
                        </div>
                    </div>
                )}
            </div>
            </div>
        </header>
    )
}


function parseDisplayedRange(display: string): { start: Date; end: Date } | null {

    const dashNorm = display.replace(/[–—]/g, '-')
    const parts = dashNorm.split('-').map((s) => s.trim())
    if (parts.length !== 2) return null

    const year = parts[1].match(/\d{4}/)
    if (!year) return null

    const startDate = new Date(`${parts[0]}, ${year[0]}`)
    const endDate = new Date(parts[1])

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null
    return { start: startDate, end: endDate }
}
