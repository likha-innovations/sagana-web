import { api } from './client'
import { isDateInRange } from '@/lib/date-range'
import { createLogger } from '@/lib/logger'
import { paginateList } from '@/lib/utils'
import {
  type CompostBatch,
  type BatchTemperatureReading,
  type BatchStatsData,
  type BatchQueryParams,
  type BatchListResponse,
  compostBatchSchema,
  batchTemperatureReadingSchema,
  getBatchPhase,
  formatBatchDate,
} from '@/types/batch'

const logger = createLogger('BatchApi')

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

  return paginateList(filtered, page, pageSize)
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

export async function fetchBatchTemperature(
  batchId: string
): Promise<BatchTemperatureReading[]> {
  try {
    const raw = await api.get<unknown>(
      `/batches/${encodeURIComponent(batchId)}/temperature`
    )
    if (Array.isArray(raw)) {
      return batchTemperatureReadingSchema.array().catch([]).parse(raw)
    }
    return []
  } catch (err) {
    logger.warn('Failed to fetch batch temperature:', { batchId, err })
    return []
  }
}
