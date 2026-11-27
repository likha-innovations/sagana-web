import {
  Recycle,
  Sprout,
  Wind,
  Cpu,
  Clock,
} from 'lucide-react'
import type { DashboardData } from '@/types/dashboard'
import type { KpiCardProps } from '@/components/dashboard/kpi-card'
import type { ActiveBatchPhase } from '@/components/dashboard/active-batches-chart'
import type { UserStatusSegment } from '@/components/dashboard/user-status-chart'
import type { BatchRow } from '@/components/dashboard/recent-batches-table'
import {
  type CompostBatch,
  getBatchPhase,
  getDaysComposting,
  formatBatchDate,
} from '@/types/batch'
import { batchApi } from './batch.api'
import { fetchMachineStatsAsOf } from './machine.api'
import type { MachineStatsData } from '@/types/machine'
import { createLogger } from '@/lib/logger'
import { isDateInRange, resolveDateRange } from '@/lib/date-range'

const logger = createLogger('Dashboard')
import { fetchOperatorStatsAsOf } from './operator.api'
import type { OperatorStatsData } from '@/types/operator'

export function computeDashboardData(
  machineStats: MachineStatsData,
  operatorStats: OperatorStatsData,
  batches: CompostBatch[],
  dateRange = 'all'
): DashboardData {
  const scopedBatches =
    dateRange && dateRange !== 'all'
      ? batches.filter((b) => isDateInRange(b.startDate, dateRange))
      : batches

  const completedBatches = scopedBatches.filter(
    (b) => b.completionDate != null || b.status?.toLowerCase() === 'completed'
  )
  const activeBatches = scopedBatches.filter(
    (b) => !b.completionDate && b.status?.toLowerCase() !== 'completed'
  )

  const totalWaste = scopedBatches.reduce((sum, b) => sum + (b.totalWeight ?? 0), 0)
  const compostProducedNum = completedBatches.reduce(
    (sum, b) => sum + (b.finalWeight ?? b.totalWeight ?? 0),
    0
  )
  const avoidedMethane = totalWaste * 0.5

  const avgDays =
    completedBatches.length > 0
      ? Math.round(
          completedBatches.reduce((s, b) => s + getDaysComposting(b), 0) /
            completedBatches.length
        )
      : 0

  const kpis: KpiCardProps[] = [
    {
      label: 'Total waste processed',
      value:
        totalWaste % 1 === 0 ? totalWaste.toFixed(0) : totalWaste.toFixed(1),
      unit: 'kg',
      delta: `${scopedBatches.length} batches`,
      deltaTone: 'good',
      icon: Recycle,
    },
    {
      label: 'Curing-ready compost produced',
      value:
        compostProducedNum % 1 === 0
          ? compostProducedNum.toFixed(0)
          : compostProducedNum.toFixed(1),
      unit: 'kg',
      delta: `${completedBatches.length} completed`,
      deltaTone: 'good',
      icon: Sprout,
    },
    {
      label: 'Estimated avoided methane',
      value:
        avoidedMethane % 1 === 0
          ? avoidedMethane.toFixed(0)
          : avoidedMethane.toFixed(1),
      unit: 'CO₂',
      delta: `${(avoidedMethane * 0.1).toFixed(1)}t est.`,
      deltaTone: 'good',
      icon: Wind,
    },
    {
      label: 'Machines online',
      value: String(machineStats.online),
      unit: `/ ${machineStats.registered}`,
      delta:
        machineStats.registered > 0
          ? `${machineStats.online}/${machineStats.registered}`
          : '0',
      deltaTone: 'good',
      icon: Cpu,
    },
    {
      label: 'Avg. days to stabilization',
      value: String(avgDays),
      unit: 'days',
      delta: completedBatches.length > 0 ? `${avgDays} days` : 'N/A',
      deltaTone: 'good',
      icon: Clock,
    },
  ]


  let coolingCount = 0
  let thermophilicCount = 0
  let mesophilicCount = 0

  for (const b of activeBatches) {
    const phase = getBatchPhase(b)
    if (phase === 'Cooling') coolingCount++
    else if (phase === 'Thermophilic') thermophilicCount++
    else if (phase === 'Mesophilic') mesophilicCount++
  }

  const phaseData: ActiveBatchPhase[] = [
    { name: 'Cooling', value: coolingCount, color: '#C9E752' },
    { name: 'Thermophilic', value: thermophilicCount, color: '#97BC39' },
    { name: 'Mesophilic', value: mesophilicCount, color: '#566811' },
  ]


  const userStatusData: UserStatusSegment[] = [
    { name: 'Active', value: operatorStats.active, color: '#97BC39' },
    { name: 'Suspended', value: operatorStats.inactive, color: '#DCDBD5' },
  ]


  const recentBatches: BatchRow[] = completedBatches.slice(0, 5).map((b) => ({
    id: b.batchCode,
    account: 'Operator',
    barangay: operatorStats.barangayName || 'Assigned Barangay',
    machine: b.machineName || 'Machine',
    weight: `${b.totalWeight} kg`,
    days: `${getDaysComposting(b)} days`,
    completed: formatBatchDate(b.startDate),
  }))

  return {
    kpis,
    phaseData,
    userStatusData,
    recentBatches,
    totalThisMonth: completedBatches.length,
    barangayName:
      operatorStats.barangayName && operatorStats.barangayName !== 'Unknown'
        ? operatorStats.barangayName
        : undefined,
  }
}

export async function fetchDashboardData(dateRange = 'this-month'): Promise<DashboardData> {
  const resolved = resolveDateRange(dateRange)
  const asOf = resolved?.end

  const [machineStats, operatorStats, batches] = await Promise.all([
    fetchMachineStatsAsOf(asOf).catch((err) => {
      logger.warn('Failed to fetch machine stats:', err)
      return { registered: 0, online: 0, offline: 0 }
    }),
    fetchOperatorStatsAsOf(asOf).catch((err) => {
      logger.warn('Failed to fetch operator stats:', err)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        barangayCode: '',
        barangayName: '',
      }
    }),
    batchApi.list().catch((err) => {
      logger.warn('Failed to fetch batches:', err)
      return []
    }),
  ])

  return computeDashboardData(machineStats, operatorStats, batches, dateRange)
}
