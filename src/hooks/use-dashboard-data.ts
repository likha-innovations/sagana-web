import { useMemo } from 'react'
import { mockDashboardData, type DashboardData } from '@/components/dashboard/data/dashboard-data'

export function useDashboardData(): DashboardData {
    return useMemo(() => mockDashboardData, [])
}
