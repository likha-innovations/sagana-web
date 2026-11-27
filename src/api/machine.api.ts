import { api } from './client'
import { isDateInRange, isOnOrBeforeDate } from '@/lib/date-range'
import { createLogger } from '@/lib/logger'
import { paginateList } from '@/lib/utils'
import {
  getMachineCode,
  getMachineRegisteredBy,
  isMachineOnline,
  type Machine,
  type MachineListResponse,
  type MachineQueryParams,
  type MachineStatsData,
} from '@/types/machine'

const logger = createLogger('MachineApi')

export const machineApi = {
  list: (): Promise<Machine[]> => api.get<Machine[]>('/machines'),
}

export async function fetchMachines(
  params: MachineQueryParams = {}
): Promise<MachineListResponse> {
  const {
    search = '',
    status = 'all',
    dateRange = 'all',
    page = 1,
    pageSize = 10,
  } = params

  const allMachines = await machineApi.list()
  logger.debug('Fetched machines', { count: allMachines.length, status, dateRange })
  const q = search.toLowerCase()

  const filtered = allMachines.filter((machine) => {
    const matchesSearch =
      !q ||
      getMachineCode(machine).toLowerCase().includes(q) ||
      machine.name.toLowerCase().includes(q) ||
      getMachineRegisteredBy(machine).toLowerCase().includes(q)

    const machineStatus = isMachineOnline(machine) ? 'online' : 'offline'
    const matchesStatus =
      status === 'all' || machineStatus === status.toLowerCase()

    return matchesSearch && matchesStatus && isDateInRange(machine.createdAt, dateRange)
  })

  return paginateList(filtered, page, pageSize)
}

export async function fetchMachineStatsAsOf(asOf?: Date): Promise<MachineStatsData> {
  const allMachines = await machineApi.list()
  const scoped = asOf
    ? allMachines.filter((m) => isOnOrBeforeDate(m.createdAt, asOf))
    : allMachines
  const online = scoped.filter((m) => isMachineOnline(m)).length

  return {
    registered: scoped.length,
    online,
    offline: scoped.length - online,
  }
}

export function fetchMachineStats(): Promise<MachineStatsData> {
  return fetchMachineStatsAsOf()
}
