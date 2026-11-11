import { useQuery } from '@tanstack/react-query'
import {
  fetchOperatorAccounts,
  fetchOperatorStats,
  fetchArchivedOperators,
  type OperatorQueryParams,
  type OperatorListResponse,
  type OperatorStatsData,
  type OperatorAccount,
} from '@/api/operator.api'

export const operatorKeys = {
  all: ['operators'] as const,
  list: (params: OperatorQueryParams = {}) => ['operators', 'list', params] as const,
  stats: ['operators', 'stats'] as const,
  archive: ['operators', 'archive'] as const,
}

export function useOperators(params: OperatorQueryParams = {}) {
  return useQuery<OperatorListResponse>({
    queryKey: operatorKeys.list(params),
    queryFn: () => fetchOperatorAccounts(params),
    staleTime: 1000 * 30,
  })
}

export function useOperatorStats() {
  return useQuery<OperatorStatsData>({
    queryKey: operatorKeys.stats,
    queryFn: fetchOperatorStats,
    staleTime: 1000 * 30,
  })
}

export function useArchivedOperators() {
  return useQuery<OperatorAccount[]>({
    queryKey: operatorKeys.archive,
    queryFn: fetchArchivedOperators,
    staleTime: 1000 * 30,
  })
}

