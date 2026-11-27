import { api } from './client'
import { isDateInRange, isOnOrBeforeDate } from '@/lib/date-range'
import { createLogger } from '@/lib/logger'
import { paginateList, toCanonicalBirthday } from '@/lib/utils'
import {
  getOperatorName,
  type OperatorAccount,
  type OperatorListResponse,
  type OperatorQueryParams,
  type OperatorStatsData,
  type OperatorStatus,
  type UpdateOperatorInput,
} from '@/types/operator'
import { barangayApi } from './barangay.api'

const logger = createLogger('OperatorApi')

function matchesOperatorFilter(
  op: OperatorAccount,
  { search, status, dateRange }: Required<Pick<OperatorQueryParams, 'search' | 'status' | 'dateRange'>>
): boolean {
  const query = search.toLowerCase()
  const matchesSearch =
    !query ||
    getOperatorName(op).toLowerCase().includes(query) ||
    op.email.toLowerCase().includes(query)

  const matchesStatus =
    status === 'all'
      ? op.status !== 'suspended'
      : op.status.toLowerCase() === status.toLowerCase()

  return matchesSearch && matchesStatus && isDateInRange(op.createdAt, dateRange)
}

export const operatorApi = {
  list: (): Promise<OperatorAccount[]> => api.get<OperatorAccount[]>('/operators'),
  updateStatus: (id: string, status: OperatorStatus): Promise<void> => {
    logger.info('Updating operator status', { id, status })
    return api.patch<void>(`/operators/${id}/status`, { status })
  },
  update: (id: string, data: UpdateOperatorInput): Promise<void> => {
    logger.info('Updating operator profile', { id })
    return api.patch<void>(`/operators/${id}`, {
      fullName: data.fullName.trim(),
      birthday: toCanonicalBirthday(data.birthday ?? undefined),
    })
  },
  delete: (id: string): Promise<void> => {
    logger.info('Deleting operator', { id })
    return api.delete<void>(`/operators/${id}`)
  },
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

  const raw = await operatorApi.list()
  const filtered = raw.filter((op) =>
    matchesOperatorFilter(op, { search, status, dateRange })
  )

  return paginateList(filtered, page, pageSize)
}

export async function fetchArchivedOperators(): Promise<OperatorAccount[]> {
  const raw = await operatorApi.list()
  return raw.filter((op) => op.status === 'suspended')
}

export async function fetchOperatorStatsAsOf(asOf?: Date): Promise<OperatorStatsData> {
  const [raw, codeRes] = await Promise.all([
    operatorApi.list(),
    barangayApi.getCode().catch((err) => {
      logger.warn('Failed to fetch barangay code:', err)
      return { code: null }
    }),
  ])

  const scoped = asOf ? raw.filter((op) => isOnOrBeforeDate(op.createdAt, asOf)) : raw
  const active = scoped.filter((op) => op.status === 'active').length
  const inactive = scoped.filter((op) => op.status !== 'active').length
  const barangayName = raw.find((op) => op.barangay)?.barangay?.name || 'Unknown'

  return {
    total: scoped.length,
    active,
    inactive,
    barangayCode: codeRes?.code || '',
    barangayName,
  }
}

export function fetchOperatorStats(): Promise<OperatorStatsData> {
  return fetchOperatorStatsAsOf()
}
