import type { PaginatedResult } from '@/lib/utils'
import type { Barangay } from './barangay'

export interface Machine {
  id: string
  barangayId: string
  macAddress: string
  name: string
  status: string
  wifiSsid: string | null
  lastSeen: string | null
  createdAt: string
  removedAt: string | null
  barangay?: Pick<Barangay, 'id' | 'name'> | null
  batches?: Array<{
    batchCode: string
    user?: { fullName: string | null }
    compostingPhases?: Array<{ phaseName: string }>
  }>
  latestReadings?: {
    temperature: number | null
    moisture: number | null
    oxygen: number | null
    co2: number | null
    updatedAt: string
  }
}

export interface MachineStatsData {
  registered: number
  online: number
  offline: number
}

export interface MachineQueryParams {
  search?: string
  status?: 'all' | 'online' | 'offline'
  dateRange?: string
  page?: number
  pageSize?: number
}

export type MachineListResponse = PaginatedResult<Machine>

export function getMachineCode(machine: Pick<Machine, 'macAddress'>): string {
  return machine.macAddress.replace(/:/g, '').slice(-6).toUpperCase()
}

export function isMachineOnline(machine: Pick<Machine, 'status'>): boolean {
  return machine.status === 'active' || machine.status === 'online'
}

export function getMachineRegisteredBy(machine: Machine): string {
  return (
    machine.batches?.[0]?.user?.fullName ||
    (machine.barangay?.name ? `${machine.barangay.name} Operator` : 'Operator')
  )
}

export function getMachineCurrentBatch(
  machine: Machine
): { code: string; stage: string } | null {
  const activeBatch = machine.batches?.[0]
  if (!activeBatch) return null
  return {
    code: activeBatch.batchCode,
    stage: activeBatch.compostingPhases?.[0]?.phaseName || 'Mesophilic',
  }
}
