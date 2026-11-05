import { api } from './client'
import { isDateInRange } from '@/lib/date-range'

export interface OperatorAccount {
  id: string
  name: string
  email: string
  status: 'active' | 'suspended'
  barangay: string
  dateJoined: string
  phone?: string
}

export interface OperatorStatsData {
  total: number
  active: number
  inactive: number
  barangayCode: string
  barangayName: string
}

export interface OperatorQueryParams {
  search?: string
  status?: 'all' | 'active' | 'suspended'
  barangay?: string
  dateRange?: string
  page?: number
  pageSize?: number
}

export interface OperatorListResponse {
  data: OperatorAccount[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Backend User shape from GET /api/admin/operators
interface BackendOperator {
  id: string
  fullName: string | null
  email: string
  role: string
  status: string
  createdAt: string
  birthday: string | null
  barangayId: string | null
  barangay: {
    id: string
    name: string
    status: string
    createdAt: string
  } | null
}

function mapBackendOperator(op: BackendOperator): OperatorAccount {
  return {
    id: op.id,
    name: op.fullName || op.email.split('@')[0],
    email: op.email,
    status: (op.status === 'active' ? 'active' : 'suspended') as 'active' | 'suspended',
    barangay: op.barangay?.name || 'Unassigned',
    dateJoined: new Date(op.createdAt).toISOString().split('T')[0],
  }
}

export async function fetchOperatorAccounts(
  params: OperatorQueryParams = {}
): Promise<OperatorListResponse> {
  const {
    search = '',
    status = 'all',
    barangay = 'all',
    dateRange = 'all',
    page = 1,
    pageSize = 10,
  } = params

  // Fetch all operators from backend
  const raw = await api.get<BackendOperator[]>('/admin/operators')
  const allOperators = raw.map(mapBackendOperator)

  // Client-side filtering (backend returns all operators, we filter here)
  const filtered = allOperators.filter((op) => {
    const matchesSearch =
      !search ||
      op.name.toLowerCase().includes(search.toLowerCase()) ||
      op.email.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      status === 'all'
        ? op.status !== 'suspended'
        : op.status.toLowerCase() === status.toLowerCase()

    const matchesBarangay =
      barangay === 'all' || op.barangay.toLowerCase() === barangay.toLowerCase()

    const matchesDate = isDateInRange(op.dateJoined, dateRange)

    return matchesSearch && matchesStatus && matchesBarangay && matchesDate
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

export async function fetchArchivedOperators(): Promise<OperatorAccount[]> {
  const raw = await api.get<BackendOperator[]>('/admin/operators')
  return raw.map(mapBackendOperator).filter((op) => op.status === 'suspended')
}

export async function fetchOperatorStats(): Promise<OperatorStatsData> {
  const raw = await api.get<BackendOperator[]>('/admin/operators')
  const allOperators = raw.map(mapBackendOperator)

  const active = allOperators.filter((op) => op.status === 'active').length
  const inactive = allOperators.filter((op) => op.status === 'suspended').length

  // Get barangay info from the first operator that has one
  const withBarangay = raw.find((op) => op.barangay)
  const barangayName = withBarangay?.barangay?.name || 'Unknown'
  const barangayCode = withBarangay?.barangay?.id?.slice(0, 6).toUpperCase() || ''

  return {
    total: allOperators.length,
    active,
    inactive,
    barangayCode,
    barangayName,
  }
}

export async function updateOperatorStatus(
  id: string,
  status: 'active' | 'suspended'
): Promise<void> {
  await api.patch(`/admin/operators/${id}/status`, { status })
}

export async function deleteOperator(id: string): Promise<void> {
  await api.delete(`/admin/operators/${id}`)
}

