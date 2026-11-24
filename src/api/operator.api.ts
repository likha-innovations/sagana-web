import { api } from './client'
import { isDateInRange } from '@/lib/date-range'
import { barangayApi } from './barangay.api'

export interface OperatorAccount {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  status: 'active' | 'suspended'
  barangay: string
  dateJoined: string
  birthday?: string
  accountCreationMethod?: string
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


interface BackendOperator {
  id: string
  fullName: string | null
  email: string
  role: string
  status: string
  createdAt: string
  birthday: string | null
  authProvider?: string | null
  barangayId: string | null
  barangay: {
    id: string
    name: string
    status: string
    createdAt: string
  } | null
}

export function formatBirthday(dateStr?: string | null): string {
  if (!dateStr) return ''
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || '',
  }
}

function mapBackendOperator(op: BackendOperator): OperatorAccount {
  const full = op.fullName || op.email.split('@')[0]
  const { firstName, lastName } = splitName(full)
  return {
    id: op.id,
    name: full,
    firstName,
    lastName,
    email: op.email,
    status: (op.status === 'active' ? 'active' : 'suspended') as 'active' | 'suspended',
    barangay: op.barangay?.name || 'Unassigned',
    dateJoined: new Date(op.createdAt).toISOString().split('T')[0],
    birthday: formatBirthday(op.birthday),
    accountCreationMethod: op.authProvider ?? 'Email',
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


  const raw = await fetchRawOperators()
  const allOperators = raw.map(mapBackendOperator)


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

export async function updateOperator(
  id: string,
  data: { firstName: string; lastName: string; birthday?: string }
): Promise<void> {
  let formattedBirthday: string | null = null
  if (data.birthday && data.birthday.trim()) {
    const trimmed = data.birthday.trim()
    const d = new Date(trimmed)
    if (!isNaN(d.getTime())) {
      formattedBirthday = d.toISOString()
    } else {
      formattedBirthday = trimmed
    }
  }

  await api.patch(`/operators/${id}`, {
    fullName: `${data.firstName} ${data.lastName}`.trim(),
    birthday: formattedBirthday,
  })
}

export async function deleteOperator(id: string): Promise<void> {
  await api.delete(`/operators/${id}`)
}
