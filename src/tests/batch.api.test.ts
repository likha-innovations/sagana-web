import { fetchBatches, fetchBatchStats, batchApi } from '@/api/batch.api'
import {
  type CompostBatch,
  getBatchPhase,
  getDaysComposting,
  formatBatchDate,
} from '@/types/batch'
import { api } from '@/api/client'

jest.mock('@/api/client', () => ({
  api: {
    get: jest.fn(),
  },
}))

describe('batch.api', () => {
  const mockCompostBatch: CompostBatch = {
    id: 'batch-1',
    machineId: 'm-1',
    userId: 'u-1',
    batchCode: 'QC-1001',
    status: 'active',
    startDate: '2026-10-01T00:00:00.000Z',
    completionDate: null,
    totalWeight: 300,
    finalWeight: null,
    machineName: 'AIVSP-001',
    compostingPhases: [{ phaseName: 'thermophilic', status: 'active', timestamp: '2026-10-02' }],
    feedstocks: [{ id: 'f-1', name: 'Leaves', category: 'brown', weightKg: 300 }],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('CompostBatch helpers', () => {
    it('determines batch phase correctly', () => {
      expect(getBatchPhase(mockCompostBatch)).toBe('Thermophilic')

      const completed: CompostBatch = {
        ...mockCompostBatch,
        completionDate: '2026-10-15T00:00:00.000Z',
        finalWeight: 180,
      }
      expect(getBatchPhase(completed)).toBe('Completed')
    })

    it('calculates days composting and formats start date', () => {
      const days = getDaysComposting(mockCompostBatch)
      expect(days).toBeGreaterThanOrEqual(0)
      expect(formatBatchDate(mockCompostBatch.startDate)).toBe('Oct 01, 2026')
    })
  })

  describe('batchApi.list', () => {
    it('fetches and parses compost batches via Zod', async () => {
      jest.mocked(api.get).mockResolvedValueOnce([mockCompostBatch])

      const result = await batchApi.list()
      expect(api.get).toHaveBeenCalledWith('/batches')
      expect(result).toHaveLength(1)
      expect(result[0].batchCode).toBe('QC-1001')
    })
  })

  describe('fetchBatches', () => {
    it('applies client-side search filtering across batchCode and machineName', async () => {
      jest.mocked(api.get).mockResolvedValueOnce([mockCompostBatch])

      const result = await fetchBatches({ search: 'QC-1001' })
      expect(result.total).toBe(1)
      expect(result.data[0].batchCode).toBe('QC-1001')
    })

    it('returns empty list when search filter does not match', async () => {
      jest.mocked(api.get).mockResolvedValueOnce([mockCompostBatch])

      const result = await fetchBatches({ search: 'NON_EXISTENT' })
      expect(result.total).toBe(0)
      expect(result.data).toHaveLength(0)
    })
  })

  describe('fetchBatchStats', () => {
    it('aggregates finished, ongoing, and total weights correctly', async () => {
      const completedBatch: CompostBatch = {
        ...mockCompostBatch,
        id: 'batch-2',
        batchCode: 'QC-0900',
        status: 'completed',
        completionDate: '2026-09-20T00:00:00.000Z',
        finalWeight: 150,
      }
      jest.mocked(api.get).mockResolvedValueOnce([mockCompostBatch, completedBatch])

      const stats = await fetchBatchStats()
      expect(stats.totalCompostBatches).toBe(2)
      expect(stats.finishedBatches).toBe(1)
      expect(stats.ongoingBatches).toBe(1)
      expect(stats.allTimeTotalProduced).toBe('150 kg')
    })
  })
})
