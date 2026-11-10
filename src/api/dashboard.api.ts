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
import { mockBatches, fetchBatchStats } from './batch.api'
import { fetchMachineStats } from './machine.api'
import { fetchOperatorStats } from './operator.api'

export async function fetchDashboardData(): Promise<DashboardData> {
  // Fetch real machine and operator stats from the backend in parallel
  const [machineStats, operatorStats, batchStats] = await Promise.all([
    fetchMachineStats().catch((err) => {
      console.warn('[Dashboard] Failed to fetch machine stats:', err)
      return { registered: 0, online: 0, offline: 0 }
    }),
    fetchOperatorStats().catch((err) => {
      console.warn('[Dashboard] Failed to fetch operator stats:', err)
      return { total: 0, active: 0, inactive: 0, barangayCode: '', barangayName: 'Barangay 176-E' }
    }),
    fetchBatchStats().catch(() => ({
      allTimeTotalProduced: '741 kg',
      totalCompostBatches: mockBatches.length,
      finishedBatches: mockBatches.filter((b) => b.status === 'Completed').length,
      ongoingBatches: mockBatches.filter((b) => b.status !== 'Completed').length,
    })),
  ])

  // 1. Derive KPIs
  const totalWaste = mockBatches.reduce((sum, b) => {
    const num = parseFloat(b.feedstockWeight.replace(/[^\d.]/g, '')) || 0
    return sum + num
  }, 0)

  const compostProducedNum = parseFloat(batchStats.allTimeTotalProduced.replace(/[^\d.]/g, '')) || 741
  const avoidedMethane = totalWaste * 0.5

  const completedBatches = mockBatches.filter((b) => b.status === 'Completed')
  const avgDays = completedBatches.length > 0
    ? Math.round(completedBatches.reduce((s, b) => s + b.daysComposting, 0) / completedBatches.length)
    : 8

  const kpis: KpiCardProps[] = [
    {
      label: 'Total waste processed',
      value: totalWaste % 1 === 0 ? totalWaste.toFixed(0) : totalWaste.toFixed(1),
      unit: 'kg',
      delta: '+12%',
      deltaTone: 'good',
      icon: Recycle,
    },
    {
      label: 'Curing-ready compost produced',
      value: compostProducedNum % 1 === 0 ? compostProducedNum.toFixed(0) : compostProducedNum.toFixed(1),
      unit: 'kg',
      delta: '+8%',
      deltaTone: 'good',
      icon: Sprout,
    },
    {
      label: 'Estimated avoided methane',
      value: avoidedMethane % 1 === 0 ? avoidedMethane.toFixed(0) : avoidedMethane.toFixed(1),
      unit: 'CO₂',
      delta: '+15%',
      deltaTone: 'good',
      icon: Wind,
    },
    {
      label: 'Machines online',
      value: String(machineStats.online),
      unit: `/ ${machineStats.registered}`,
      delta: machineStats.registered > 0 ? `${machineStats.online}/${machineStats.registered}` : '0',
      deltaTone: 'good',
      icon: Cpu,
    },
    {
      label: 'Avg. days to stabilization',
      value: String(avgDays),
      unit: 'days',
      delta: '-2 days',
      deltaTone: 'good',
      icon: Clock,
    },
  ]

  // 2. Active batches by phase
  const activeBatches = mockBatches.filter((b) => b.status !== 'Completed')
  let coolingCount = 0
  let thermophilicCount = 0
  let mesophilicCount = 0

  for (const b of activeBatches) {
    if (b.status === 'Cooling') coolingCount++
    else if (b.status === 'Thermophilic') thermophilicCount++
    else if (b.status === 'Mesophilic') mesophilicCount++
  }

  const phaseData: ActiveBatchPhase[] = [
    { name: 'Cooling', value: coolingCount, color: '#C9E752' },
    { name: 'Thermophilic', value: thermophilicCount, color: '#97BC39' },
    { name: 'Mesophilic', value: mesophilicCount, color: '#566811' },
  ]

  // 3. Operator accounts distribution (live from backend GET /admin/operators)
  const userStatusData: UserStatusSegment[] = [
    { name: 'Active', value: operatorStats.active, color: '#97BC39' },
    { name: 'Suspended', value: operatorStats.inactive, color: '#DCDBD5' },
  ]

  // 4. Recent completed batches
  const recentBatches: BatchRow[] = completedBatches.map((b) => ({
    id: b.code,
    account: b.startedBy,
    barangay: operatorStats.barangayName || 'Barangay 176-E',
    machine: b.machine,
    weight: b.feedstockWeight,
    days: `${b.daysComposting} days`,
    completed: b.startedOn,
  }))

  return {
    kpis,
    phaseData,
    userStatusData,
    recentBatches,
    totalThisMonth: recentBatches.length,
  }
}
