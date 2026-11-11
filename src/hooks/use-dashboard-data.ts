import { useQuery } from '@tanstack/react-query'
import { initialDashboardData, type DashboardData } from '@/types/dashboard'
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
}

export function useDashboardData(): UseDashboardDataResult {
  const { isConnected } = useSocketContext()

  const query = useQuery<DashboardData>({
    queryKey: dashboardKeys.data,
    queryFn: fetchDashboardData,
    staleTime: 1000 * 30,
  })

  const data = query.data ?? initialDashboardData

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
