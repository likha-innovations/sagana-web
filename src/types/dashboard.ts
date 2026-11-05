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
}

export const defaultDashboardData: DashboardData = {
  kpis: [
    {
      label: 'Total waste processed',
      value: '20',
      unit: 'kg',
      delta: '+12%',
      deltaTone: 'good',
      icon: Recycle,
    },
    {
      label: 'Curing-ready compost produced',
      value: '20',
      unit: 'kg',
      delta: '+8%',
      deltaTone: 'good',
      icon: Sprout,
    },
    {
      label: 'Estimated avoided methane',
      value: '50',
      unit: 'CO₂',
      delta: '+15%',
      deltaTone: 'good',
      icon: Wind,
    },
    {
      label: 'Machines online',
      value: '6',
      unit: '/ 7',
      delta: '+1',
      deltaTone: 'good',
      icon: Cpu,
    },
    {
      label: 'Avg. days to stabilization',
      value: '8',
      unit: 'days',
      delta: '-2 days',
      deltaTone: 'good',
      icon: Clock,
    },
  ],
  phaseData: [
    { name: 'Cooling', value: 1, color: '#C9E752' },
    { name: 'Thermophilic', value: 0, color: '#97BC39' },
    { name: 'Mesophilic', value: 0, color: '#566811' },
  ],
  userStatusData: [
    { name: 'Active', value: 5, color: '#97BC39' },
    { name: 'Suspended', value: 1, color: '#DCDBD5' },
  ],
  recentBatches: [],
  totalThisMonth: 1,
}

export const initialDashboardData: DashboardData = defaultDashboardData
