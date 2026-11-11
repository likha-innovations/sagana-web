import { api } from './client'
import { isDateInRange } from '@/lib/date-range'
import {
  type CompostBatch,
  compostBatchSchema,
  getBatchPhase,
  formatBatchDate,
} from '@/types/batch'

export type { CompostBatch, Batch } from '@/types/batch'

export interface BatchStatsData {
  allTimeTotalProduced: string
  totalCompostBatches: number
  finishedBatches: number
  ongoingBatches: number
}

export interface BatchQueryParams {
  search?: string
  status?: 'all' | string
  dateRange?: string
  page?: number
  pageSize?: number
}

export interface BatchListResponse {
  data: CompostBatch[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const batchApi = {
  list: async (): Promise<CompostBatch[]> => {
    const raw = await api.get<unknown[]>('/batches')
    return compostBatchSchema.array().parse(raw)
  },
  get: async (id: string): Promise<CompostBatch> => {
    const raw = await api.get<unknown>(`/batches/${encodeURIComponent(id)}`)
    return compostBatchSchema.parse(raw)
  },
}

export async function fetchBatches(
  params: BatchQueryParams = {}
): Promise<BatchListResponse> {
  const {
    search = '',
    status = 'all',
    dateRange = 'all',
    page = 1,
    pageSize = 10,
  } = params

  const allBatches = await batchApi.list()

  const filtered = allBatches.filter((batch) => {
    const phase = getBatchPhase(batch)
    const startedOn = formatBatchDate(batch.startDate)
    const matchesSearch =
      !search ||
      batch.batchCode.toLowerCase().includes(search.toLowerCase()) ||
      (batch.machineName && batch.machineName.toLowerCase().includes(search.toLowerCase())) ||
      batch.status.toLowerCase().includes(search.toLowerCase()) ||
      phase.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      status === 'all' ||
      batch.status.toLowerCase() === status.toLowerCase() ||
      phase.toLowerCase() === status.toLowerCase()

    const matchesDate = isDateInRange(startedOn, dateRange)

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

export async function fetchBatchStats(): Promise<BatchStatsData> {
  const allBatches = await batchApi.list()

  const finishedBatches = allBatches.filter(
    (b) => b.completionDate != null || b.status?.toLowerCase() === 'completed'
  ).length
  const ongoingBatches = allBatches.length - finishedBatches

  const totalProducedKg = allBatches
    .filter((b) => b.completionDate != null || b.status?.toLowerCase() === 'completed')
    .reduce((sum, b) => sum + (b.finalWeight ?? b.totalWeight ?? 0), 0)

  return {
    allTimeTotalProduced: `${Math.round(totalProducedKg)} kg`,
    totalCompostBatches: allBatches.length,
    finishedBatches,
    ongoingBatches,
  }
}
