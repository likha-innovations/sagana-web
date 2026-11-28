import { useState } from 'react'
import { toast } from 'sonner'
import { DashboardHeader } from './dashboard-header'
import { KpiCard } from './kpi-card'
import { ActiveBatchesChart } from './active-batches-chart'
import { UserStatusChart } from './user-status-chart'
import { RecentBatchesTable } from './recent-batches-table'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { useAuthContext } from '@/context/auth-context'
import { exportDashboardReport } from '@/lib/export-dashboard-report'
import { exportDashboardToSheets } from '@/lib/export-sheets'
import { formatDateRangeLabel } from '@/lib/date-range'
import { createLogger } from '@/lib/logger'

const logger = createLogger('DashboardPage')

export function DashboardPage() {
  const { user } = useAuthContext()
  const [dateRange, setDateRange] = useState<string>('this-month')
  const dashboardData = useDashboardData(dateRange)
  const { kpis, phaseData, userStatusData, recentBatches, totalThisMonth, barangayName } = dashboardData
  const resolvedBarangay = barangayName || user?.location || 'Assigned Barangay'
  const periodLabel = formatDateRangeLabel(dateRange)

  const handleExportPdf = async () => {
    try {
      exportDashboardReport({
        data: dashboardData,
        barangay: resolvedBarangay,
        dateRange: periodLabel,
      })
      toast.success('Dashboard report opened in new tab')
    } catch (err) {
      logger.error('Failed to export dashboard report:', err)
      toast.error('Failed to export dashboard report')
    }
  }

  const handleExportSheets = async () => {
    try {
      exportDashboardToSheets(dashboardData, resolvedBarangay, periodLabel)
      toast.success('Dashboard report exported as Sheets (CSV)')
    } catch (err) {
      logger.error('Failed to export dashboard report to sheets:', err)
      toast.error('Failed to export dashboard report')
    }
  }

  return (
    <div className="flex-1 flex flex-col gap-6">
      <DashboardHeader
        barangay={resolvedBarangay}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExportPdf={handleExportPdf}
        onExportSheets={handleExportSheets}
      />

      <section
        aria-label="Key metrics"
        className="grid grid-cols-2 gap-5 lg:grid-cols-4 xl:grid-cols-5"
      >
        {kpis.map((kpi: (typeof kpis)[number]) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ActiveBatchesChart data={phaseData} />
        <UserStatusChart data={userStatusData} />
      </section>

      <RecentBatchesTable
        rows={recentBatches}
        totalThisMonth={totalThisMonth}
        periodLabel={dateRange === 'this-month' ? undefined : periodLabel}
      />
    </div>
  )
}
