import { api } from './client'
import { isDateInRange } from '@/lib/date-range'
import { barangayApi } from './barangay.api'

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

// Backend User shape from GET /operators
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

export async function fetchRawOperators(): Promise<BackendOperator[]> {
  return api.get<BackendOperator[]>('/operators')
}

export async function fetchOperatorAccounts(
  params: OperatorQueryParams = {}
): Promise<OperatorListResponse> {
  const {
    search = '',
    status = 'all',
    dateRange = 'all',
    page = 1,
    pageSize = 10,
  } = params

  // Fetch all operators from backend
  const raw = await fetchRawOperators()
  const allOperators = raw.map(mapBackendOperator)

  // Client-side filtering (backend already restricts operators to the admin's assigned barangay)
  const filtered = allOperators.filter((op) => {
    const matchesSearch =
      !search ||
      op.name.toLowerCase().includes(search.toLowerCase()) ||
      op.email.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      status === 'all'
        ? op.status !== 'suspended'
        : op.status.toLowerCase() === status.toLowerCase()

    const matchesDate = isDateInRange(op.dateJoined, dateRange)

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

export async function fetchArchivedOperators(): Promise<OperatorAccount[]> {
  const raw = await fetchRawOperators()
  return raw.map(mapBackendOperator).filter((op) => op.status === 'suspended')
}

export async function fetchOperatorStats(): Promise<OperatorStatsData> {
  const [raw, codeRes] = await Promise.all([
    fetchRawOperators(),
    barangayApi.getCode().catch(() => ({ code: null })),
  ])
  const allOperators = raw.map(mapBackendOperator)

  const active = allOperators.filter((op) => op.status === 'active').length
  const inactive = allOperators.filter((op) => op.status === 'suspended').length

  // Get barangay info from the first operator that has one
  const withBarangay = raw.find((op) => op.barangay)
  const barangayName = withBarangay?.barangay?.name || 'Unknown'
  const barangayCode = codeRes?.code || ''

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
  await api.patch(`/operators/${id}/status`, { status })
}

export async function deleteOperator(id: string): Promise<void> {
  await api.delete(`/operators/${id}`)
}

