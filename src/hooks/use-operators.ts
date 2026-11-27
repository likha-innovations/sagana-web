import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  operatorApi,
  fetchOperatorAccounts,
  fetchOperatorStats,
  fetchArchivedOperators,
} from '@/api/operator.api'
import type {
  OperatorAccount,
  OperatorListResponse,
  OperatorQueryParams,
  OperatorStatsData,
  OperatorStatus,
  UpdateOperatorInput,
} from '@/types/operator'

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

export function useUpdateOperator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOperatorInput }) =>
      operatorApi.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.all })
    },
  })
}

export function useUpdateOperatorStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OperatorStatus }) =>
      operatorApi.updateStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.all })
    },
  })
}

export function useDeleteOperator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => operatorApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: operatorKeys.all })
    },
  })
}
