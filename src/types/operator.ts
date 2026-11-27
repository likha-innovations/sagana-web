import type { PaginatedResult } from '@/lib/utils'
import type { Barangay } from './barangay'

export type OperatorStatus = 'active' | 'suspended'

export interface OperatorAccount {
  id: string
  fullName: string | null
  email: string
  role: string
  status: OperatorStatus | string
  createdAt: string
  birthday: string | null
  authProvider?: string | null
  barangayId: string | null
  barangay?: Barangay | null
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

export type OperatorListResponse = PaginatedResult<OperatorAccount>

export interface UpdateOperatorInput {
  fullName: string
  birthday?: string | null
}

export function getOperatorName(
  op: Pick<OperatorAccount, 'fullName' | 'email'>
): string {
  return op.fullName?.trim() || op.email.split('@')[0]
}

export function splitFullName(fullName?: string | null): {
  firstName: string
  lastName: string
} {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

export function getOperatorBarangayName(
  op: Pick<OperatorAccount, 'barangay'>
): string {
  return op.barangay?.name || 'Unassigned'
}
