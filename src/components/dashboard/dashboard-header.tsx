import { useState, useEffect } from 'react'
import { CalendarDays, Download, Loader2, MapPin } from 'lucide-react'
import { getCurrentMonthDateRange } from '@/lib/date-range'

type DashboardHeaderProps = {
    barangay?: string
    dateRange?: string
    onExport?: () => void | Promise<void>
}

export function DashboardHeader({
    barangay = 'Barangay 176-E',
    dateRange,
    onExport,
}: DashboardHeaderProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [liveDateRange, setLiveDateRange] = useState(() => getCurrentMonthDateRange())

    useEffect(() => {
        const updateRange = () => {
            const next = getCurrentMonthDateRange()
            setLiveDateRange((prev) => (prev !== next ? next : prev))
        }

        // Periodic check to update automatically if month rolls over
        const interval = setInterval(updateRange, 60_000)

        window.addEventListener('focus', updateRange)
        document.addEventListener('visibilitychange', updateRange)

        return () => {
            clearInterval(interval)
            window.removeEventListener('focus', updateRange)
            document.removeEventListener('visibilitychange', updateRange)
        }
    }, [])

    const displayDateRange = dateRange || liveDateRange

    const handleExportClick = async () => {
        if (!onExport) return
        try {
            setIsExporting(true)
            await onExport()
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <h1 className="text-[31px] font-bold leading-[1.3] text-foreground">
                    Dashboard
                </h1>
            </div>

            <div className="flex items-center gap-3">
                <div
                    className="flex h-9.25 items-center gap-2 rounded-[14px] border border-border bg-page px-4 text-xs font-bold leading-[1.4] text-foreground select-none"
                >
                    <MapPin className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
                    <span>{barangay}</span>
                </div>

                <div
                    className="flex h-9.25 items-center gap-2 rounded-[14px] border border-border bg-page px-4 text-xs font-bold leading-[1.4] text-foreground select-none"
                >
                    <CalendarDays className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
                    <span>{displayDateRange}</span>
                </div>

                {/* Export report button */}
                <button
                    type="button"
                    onClick={handleExportClick}
                    disabled={isExporting}
                    className="flex h-9.25 items-center gap-2 rounded-full bg-primary px-4 text-xs font-bold leading-[1.4] text-white shadow-xs transition-colors hover:bg-[#627920] active:bg-[#566d1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-60 cursor-pointer"
                >
                    {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <span>Export report</span>
                </button>
            </div>
        </header>
    )
}