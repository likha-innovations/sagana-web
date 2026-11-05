import { toast } from 'sonner'
import { DashboardHeader } from './dashboard-header'
import { KpiCard } from './kpi-card'
import { ActiveBatchesChart } from './active-batches-chart'
import { UserStatusChart } from './user-status-chart'
import { RecentBatchesTable } from './recent-batches-table'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { exportDashboardReport } from '@/lib/export-dashboard-report'

export function DashboardPage() {
    const dashboardData = useDashboardData()
    const { kpis, phaseData, userStatusData, recentBatches, totalThisMonth } = dashboardData

    const handleExport = async () => {
        try {
            exportDashboardReport({ data: dashboardData })
            toast.success('Dashboard report opened in new tab')
        } catch (err) {
            console.error('Failed to export dashboard report:', err)
            toast.error('Failed to export dashboard report')
        }
    }

    return (
        <div className="flex-1 flex flex-col gap-6">
            <DashboardHeader
                onExport={handleExport}
            />

            <section
                aria-label="Key metrics"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5"
            >
                {kpis.map((kpi: (typeof kpis)[number]) => (
                    <KpiCard key={kpi.label} {...kpi} />
                ))}
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <ActiveBatchesChart data={phaseData} />
                <UserStatusChart data={userStatusData} />
            </section>

            <RecentBatchesTable rows={recentBatches} totalThisMonth={totalThisMonth} />
        </div>
    )
}
