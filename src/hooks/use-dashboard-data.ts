import { useQuery } from '@tanstack/react-query'
import { emptyDashboardData, type DashboardData } from '@/types/dashboard'
import { fetchDashboardData } from '@/api/dashboard.api'
import { useSocketContext } from '@/context/socket-context'

export interface UseDashboardDataResult extends DashboardData {
  isLoading: boolean
  error: string | null
  isConnected: boolean
  refetch: () => Promise<void>
}

export const dashboardKeys = {
  all: ['dashboard'] as const,
  data: ['dashboard', 'data'] as const,
  byDateRange: (dateRange: string) => ['dashboard', 'data', dateRange] as const,
}

export function useDashboardData(dateRange = 'this-month'): UseDashboardDataResult {
  const { isConnected } = useSocketContext()

  const query = useQuery<DashboardData>({
    queryKey: dashboardKeys.byDateRange(dateRange),
    queryFn: () => fetchDashboardData(dateRange),
    staleTime: 1000 * 30,
  })

  const data = query.data ?? emptyDashboardData

  return {
    ...data,
    isLoading: query.isLoading && !query.data,
    error: query.error instanceof Error ? query.error.message : null,
    isConnected,
    refetch: async () => {
      await query.refetch()
    },
  }
}
