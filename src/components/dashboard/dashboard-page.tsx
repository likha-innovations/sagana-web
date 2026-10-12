import { DashboardHeader } from './dashboard-header'
import { KpiCard } from './kpi-card'
import { ActiveBatchesChart } from './active-batches-chart'
import { NeedsAttention } from './needs-attention'
import { RecentBatchesTable } from './recent-batches-table'
import { useDashboardData } from '@/hooks/use-dashboard-data'

export function DashboardPage() {
    const { kpis, phaseData, alerts, recentBatches, totalThisMonth } = useDashboardData()

    return (
        <div className="flex flex-col gap-6">
            <DashboardHeader dateRange="Sep 1–30, 2026" />

            <section
                aria-label="Key metrics"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5"
            >
                {kpis.map((kpi: (typeof kpis)[number]) => (
                    <KpiCard key={kpi.label} {...kpi} />
                ))}
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,446px)_1fr]">
                <ActiveBatchesChart data={phaseData} />
                <NeedsAttention alerts={alerts} />
            </section>

            <RecentBatchesTable rows={recentBatches} totalThisMonth={totalThisMonth} />
        </div>
    )
}
