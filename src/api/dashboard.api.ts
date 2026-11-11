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
import { fetchMachineStats, type MachineStatsData } from './machine.api'
import { fetchOperatorStats, type OperatorStatsData } from './operator.api'

export function computeDashboardData(
  machineStats: MachineStatsData,
  operatorStats: OperatorStatsData,
  batches: CompostBatch[]
): DashboardData {
  const completedBatches = batches.filter(
    (b) => b.completionDate != null || b.status?.toLowerCase() === 'completed'
  )
  const activeBatches = batches.filter(
    (b) => !b.completionDate && b.status?.toLowerCase() !== 'completed'
  )

  // 1. Derive KPIs
  const totalWaste = batches.reduce((sum, b) => sum + (b.totalWeight ?? 0), 0)
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
      delta: `${batches.length} batches`,
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

  // 2. Active batches by phase
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

  // 3. Operator accounts distribution
  const userStatusData: UserStatusSegment[] = [
    { name: 'Active', value: operatorStats.active, color: '#97BC39' },
    { name: 'Suspended', value: operatorStats.inactive, color: '#DCDBD5' },
  ]

  // 4. Recent completed batches
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
    totalThisMonth: recentBatches.length,
  }
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [machineStats, operatorStats, batches] = await Promise.all([
    fetchMachineStats().catch((err) => {
      console.warn('[Dashboard] Failed to fetch machine stats:', err)
      return { registered: 0, online: 0, offline: 0 }
    }),
    fetchOperatorStats().catch((err) => {
      console.warn('[Dashboard] Failed to fetch operator stats:', err)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        barangayCode: '',
        barangayName: '',
      }
    }),
    batchApi.list().catch((err) => {
      console.warn('[Dashboard] Failed to fetch batches:', err)
      return []
    }),
  ])

  return computeDashboardData(machineStats, operatorStats, batches)
}
