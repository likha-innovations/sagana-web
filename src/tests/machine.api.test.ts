import { fetchMachines, fetchMachineStats } from '@/api/machine.api'
import {
  getMachineCode,
  getMachineCurrentBatch,
  getMachineRegisteredBy,
  isMachineOnline,
  type Machine,
} from '@/types/machine'
import { api } from '@/api/client'

jest.mock('@/api/client', () => ({
  api: {
    get: jest.fn(),
  },
}))

describe('machine.api', () => {
  const mockMachine: Machine = {
    id: 'm-1',
    barangayId: 'b-1',
    macAddress: 'AA:BB:CC:DD:EE:FF',
    name: 'Composter Alpha',
    status: 'online',
    wifiSsid: 'SaganaNet',
    lastSeen: '2026-11-01T10:00:00Z',
    createdAt: '2026-10-01T00:00:00Z',
    removedAt: null,
    barangay: { id: 'b-1', name: 'Barangay 176-E' },
    batches: [
      {
        batchCode: 'QC-1001',
        user: { fullName: 'Juan Dela Cruz' },
        compostingPhases: [{ phaseName: 'Mesophilic' }],
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Machine helpers', () => {
    it('derives display helpers directly from backend Machine properties', () => {
      expect(getMachineCode(mockMachine)).toBe('DDEEFF')
      expect(isMachineOnline(mockMachine)).toBe(true)
      expect(getMachineRegisteredBy(mockMachine)).toBe('Juan Dela Cruz')
      expect(getMachineCurrentBatch(mockMachine)?.code).toBe('QC-1001')
    })

    it('treats inactive status as offline', () => {
      expect(isMachineOnline({ status: 'inactive' })).toBe(false)
    })
  })

  describe('fetchMachines', () => {
    it('calls GET /machines and filters by search', async () => {
      jest.mocked(api.get).mockResolvedValueOnce([mockMachine])

      const result = await fetchMachines({ search: 'Alpha' })
      expect(api.get).toHaveBeenCalledWith('/machines')
      expect(result.total).toBe(1)
      expect(result.data[0].name).toBe('Composter Alpha')
    })
  })

  describe('fetchMachineStats', () => {
    it('computes online and offline stats accurately', async () => {
      const offlineMachine: Machine = {
        ...mockMachine,
        id: 'm-2',
        status: 'offline',
      }
      jest.mocked(api.get).mockResolvedValueOnce([mockMachine, offlineMachine])

      const stats = await fetchMachineStats()
      expect(stats.registered).toBe(2)
      expect(stats.online).toBe(1)
      expect(stats.offline).toBe(1)
    })
  })
})
