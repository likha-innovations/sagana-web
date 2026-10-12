import { CalendarDays, Download } from 'lucide-react'

type DashboardHeaderProps = {
    dateRange: string
    onExport?: () => void
}

export function DashboardHeader({ dateRange, onExport }: DashboardHeaderProps) {
    return (
        <header className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-[30px] font-bold leading-[1.3] text-foreground">
                Dashboard
            </h1>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    className="flex h-9.25 items-center gap-2 rounded-[14px] border border-border bg-page px-4 text-xs font-bold leading-[1.4] text-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                    <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {dateRange}
                </button>

                {/* Export report */}
                <button
                    type="button"
                    onClick={onExport}
                    className="flex h-9.25 items-center gap-2 rounded-full bg-primary px-4 text-xs font-bold leading-[1.4] text-white transition-colors hover:bg-[#627920] active:bg-[#566d1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                    <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Export report
                </button>
            </div>
        </header>
    )
}