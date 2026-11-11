import { useQuery } from '@tanstack/react-query'
import {
  fetchMachines,
  fetchMachineStats,
  type MachineQueryParams,
  type MachineListResponse,
  type MachineStatsData,
} from '@/api/machine.api'

export const machineKeys = {
  all: ['machines'] as const,
  list: (params: MachineQueryParams = {}) => ['machines', 'list', params] as const,
  stats: ['machines', 'stats'] as const,
}

export function useMachines(params: MachineQueryParams = {}) {
  return useQuery<MachineListResponse>({
    queryKey: machineKeys.list(params),
    queryFn: () => fetchMachines(params),
    staleTime: 1000 * 30,
  })
}

export function useMachineStats() {
  return useQuery<MachineStatsData>({
    queryKey: machineKeys.stats,
    queryFn: fetchMachineStats,
    staleTime: 1000 * 30,
  })
}

