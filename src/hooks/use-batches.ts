import { useQuery } from '@tanstack/react-query'
import {
  fetchBatches,
  fetchBatchStats,
  fetchBatchTemperature,
  type BatchQueryParams,
  type BatchListResponse,
  type BatchStatsData,
  type BatchTemperatureReading,
} from '@/api/batch.api'

export const batchKeys = {
  all: ['batches'] as const,
  list: (params: BatchQueryParams = {}) => ['batches', 'list', params] as const,
  stats: ['batches', 'stats'] as const,
  temperature: (batchId: string) => ['batches', 'temperature', batchId] as const,
}

export function useBatches(params: BatchQueryParams = {}) {
  return useQuery<BatchListResponse>({
    queryKey: batchKeys.list(params),
    queryFn: () => fetchBatches(params),
    staleTime: 1000 * 30,
  })
}

export function useBatchStats() {
  return useQuery<BatchStatsData>({
    queryKey: batchKeys.stats,
    queryFn: fetchBatchStats,
    staleTime: 1000 * 30,
  })
}

export function useBatchTemperature(batchId?: string) {
  return useQuery<BatchTemperatureReading[]>({
    queryKey: batchKeys.temperature(batchId || ''),
    queryFn: () => (batchId ? fetchBatchTemperature(batchId) : Promise.resolve([])),
    enabled: Boolean(batchId),
    staleTime: 1000 * 60,
    retry: false,
  })
}
