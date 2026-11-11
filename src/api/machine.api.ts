import { api } from './client'
import { isDateInRange } from '@/lib/date-range'

export interface Machine {
  id: string
  code: string
  name: string
  registeredBy: {
    name: string
    initials: string
  }
  status: 'online' | 'offline'
  currentBatch?: {
    code: string
    stage: string
  } | null
  dateRegistered: string
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

export interface MachineListResponse {
  data: Machine[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Backend Machine shape from GET /machines
export interface BackendMachine {
  id: string
  barangayId: string
  macAddress: string
  name: string
  status: string
  wifiSsid: string | null
  lastSeen: string | null
  createdAt: string
  removedAt: string | null
  barangay?: {
    id: string
    name: string
  } | null
  batches?: Array<{
    batchCode: string
    user?: { fullName: string | null }
    compostingPhases?: Array<{ phaseName: string }>
  }>
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'OP'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export function mapBackendMachine(m: BackendMachine): Machine {
  // Map backend status to frontend status
  const status: 'online' | 'offline' =
    m.status === 'active' || m.status === 'online' ? 'online' : 'offline'

  const activeBatch = m.batches?.[0]
  const currentBatch = activeBatch
    ? {
        code: activeBatch.batchCode,
        stage: activeBatch.compostingPhases?.[0]?.phaseName || 'Mesophilic',
      }
    : null

  const registeredName =
    activeBatch?.user?.fullName ||
    (m.barangay?.name ? `${m.barangay.name} Operator` : 'Operator')

  return {
    id: m.id,
    code: m.macAddress.replace(/:/g, '').slice(-6).toUpperCase(),
    name: m.name,
    registeredBy: {
      name: registeredName,
      initials: getInitials(registeredName),
    },
    status,
    currentBatch,
    dateRegistered: formatDate(m.createdAt),
  }
}

export async function fetchRawMachines(): Promise<BackendMachine[]> {
  return api.get<BackendMachine[]>('/machines')
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

  // Fetch all machines from backend
  const raw = await fetchRawMachines()
  const allMachines = raw.map(mapBackendMachine)

  // Client-side filtering
  const filtered = allMachines.filter((machine) => {
    const matchesSearch =
      !search ||
      machine.code.toLowerCase().includes(search.toLowerCase()) ||
      machine.name.toLowerCase().includes(search.toLowerCase()) ||
      machine.registeredBy.name.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      status === 'all' || machine.status.toLowerCase() === status.toLowerCase()

    const matchesDate = isDateInRange(machine.dateRegistered, dateRange)

    return matchesSearch && matchesStatus && matchesDate
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const data = filtered.slice(start, start + pageSize)

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function fetchMachineStats(): Promise<MachineStatsData> {
  const raw = await api.get<BackendMachine[]>('/machines')
  const allMachines = raw.map(mapBackendMachine)

  const online = allMachines.filter((m) => m.status === 'online').length
  const offline = allMachines.filter((m) => m.status === 'offline').length

  return {
    registered: allMachines.length,
    online,
    offline,
  }
}
