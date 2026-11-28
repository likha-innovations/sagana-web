import { Recycle, Sprout, Wind, Cpu, Clock } from 'lucide-react'
import type { KpiCardProps } from '@/components/dashboard/kpi-card'
import type { ActiveBatchPhase } from '@/components/dashboard/active-batches-chart'
import type { UserStatusSegment } from '@/components/dashboard/user-status-chart'
import type { BatchRow } from '@/components/dashboard/recent-batches-table'

export interface DashboardData {
  kpis: KpiCardProps[]
  phaseData: ActiveBatchPhase[]
  userStatusData: UserStatusSegment[]
  recentBatches: BatchRow[]
  totalThisMonth: number
  barangayName?: string
}

export const emptyDashboardData: DashboardData = {
  kpis: [
    {
      label: 'Total waste processed',
      value: '0',
      unit: 'kg',
      delta: '0 batches',
      deltaTone: 'good',
      icon: Recycle,
    },
    {
      label: 'Curing-ready compost produced',
      value: '0',
      unit: 'kg',
      delta: '0 completed',
      deltaTone: 'good',
      icon: Sprout,
    },
    {
      label: 'Estimated avoided methane',
      value: '0',
      unit: 'CO₂',
      delta: '0.0t est.',
      deltaTone: 'good',
      icon: Wind,
    },
    {
      label: 'Machines online',
      value: '0',
      unit: '/ 0',
      delta: '0',
      deltaTone: 'good',
      icon: Cpu,
    },
    {
      label: 'Avg. days to stabilization',
      value: '0',
      unit: 'days',
      delta: 'N/A',
      deltaTone: 'good',
      icon: Clock,
    },
  ],
  phaseData: [
    { name: 'Cooling', value: 0, color: '#C9E752' },
    { name: 'Thermophilic', value: 0, color: '#97BC39' },
    { name: 'Mesophilic', value: 0, color: '#566811' },
  ],
  userStatusData: [
    { name: 'Active', value: 0, color: '#97BC39' },
    { name: 'Suspended', value: 0, color: '#DCDBD5' },
  ],
  recentBatches: [],
  totalThisMonth: 0,
}

export const defaultDashboardData: DashboardData = emptyDashboardData
export const initialDashboardData: DashboardData = emptyDashboardData
