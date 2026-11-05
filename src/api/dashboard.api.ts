import { api } from './client'
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

export interface BackendDashboardResponse {
  kpis: {
    totalWasteProcessed: {
      value: string
      unit: string
      delta: string
      deltaTone?: 'good' | 'bad'
    }
    compostProduced: {
      value: string
      unit: string
      delta: string
      deltaTone?: 'good' | 'bad'
    }
    avoidedMethane: {
      value: string
      unit: string
      delta: string
      deltaTone?: 'good' | 'bad'
    }
    machinesOnline: {
      value: string
      unit: string
      delta: string
      deltaTone?: 'good' | 'bad'
    }
    avgDaysToStabilization: {
      value: string
      unit: string
      delta: string
      deltaTone?: 'good' | 'bad'
    }
  }
  phaseData: ActiveBatchPhase[]
  userStatusData: UserStatusSegment[]
  recentBatches: BatchRow[]
  totalThisMonth: number
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const res = await api.get<BackendDashboardResponse>('/admin/dashboard')

  const kpis: KpiCardProps[] = [
    {
      label: 'Total waste processed',
      value: res.kpis?.totalWasteProcessed?.value ?? '0',
      unit: res.kpis?.totalWasteProcessed?.unit ?? 'kg',
      delta: res.kpis?.totalWasteProcessed?.delta ?? '0%',
      deltaTone: res.kpis?.totalWasteProcessed?.deltaTone || 'good',
      icon: Recycle,
    },
    {
      label: 'Curing-ready compost produced',
      value: res.kpis?.compostProduced?.value ?? '0',
      unit: res.kpis?.compostProduced?.unit ?? 'kg',
      delta: res.kpis?.compostProduced?.delta ?? '0%',
      deltaTone: res.kpis?.compostProduced?.deltaTone || 'good',
      icon: Sprout,
    },
    {
      label: 'Estimated avoided methane',
      value: res.kpis?.avoidedMethane?.value ?? '0',
      unit: res.kpis?.avoidedMethane?.unit ?? 'CO₂',
      delta: res.kpis?.avoidedMethane?.delta ?? '0%',
      deltaTone: res.kpis?.avoidedMethane?.deltaTone || 'good',
      icon: Wind,
    },
    {
      label: 'Machines online',
      value: res.kpis?.machinesOnline?.value ?? '0',
      unit: res.kpis?.machinesOnline?.unit ?? '/ 0',
      delta: res.kpis?.machinesOnline?.delta ?? '0%',
      deltaTone: res.kpis?.machinesOnline?.deltaTone || 'good',
      icon: Cpu,
    },
    {
      label: 'Avg. days to stabilization',
      value: res.kpis?.avgDaysToStabilization?.value ?? '0',
      unit: res.kpis?.avgDaysToStabilization?.unit ?? 'days',
      delta: res.kpis?.avgDaysToStabilization?.delta ?? '0 days',
      deltaTone: res.kpis?.avgDaysToStabilization?.deltaTone || 'good',
      icon: Clock,
    },
  ]

  return {
    kpis,
    phaseData: res.phaseData || [],
    userStatusData: res.userStatusData || [],
    recentBatches: res.recentBatches || [],
    totalThisMonth: res.totalThisMonth ?? 0,
  }
}
