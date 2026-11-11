import { mapBackendMachine, fetchMachines, fetchMachineStats, type BackendMachine } from '@/api/machine.api'
import { api } from '@/api/client'

jest.mock('@/api/client', () => ({
  api: {
    get: jest.fn(),
  },
}))

describe('machine.api', () => {
  const mockBackendMachine: BackendMachine = {
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

  describe('mapBackendMachine', () => {
    it('maps backend machine to frontend machine model with status and current batch', () => {
      const machine = mapBackendMachine(mockBackendMachine)
      expect(machine.id).toBe('m-1')
      expect(machine.name).toBe('Composter Alpha')
      expect(machine.status).toBe('online')
      expect(machine.registeredBy.name).toBe('Juan Dela Cruz')
      expect(machine.registeredBy.initials).toBe('JD')
      expect(machine.currentBatch?.code).toBe('QC-1001')
    })

    it('maps offline status when status is inactive', () => {
      const offlineMachine = { ...mockBackendMachine, status: 'inactive' }
      const machine = mapBackendMachine(offlineMachine)
      expect(machine.status).toBe('offline')
    })
  })

  describe('fetchMachines', () => {
    it('calls GET /machines and filters by search', async () => {
      jest.mocked(api.get).mockResolvedValueOnce([mockBackendMachine])

      const result = await fetchMachines({ search: 'Alpha' })
      expect(api.get).toHaveBeenCalledWith('/machines')
      expect(result.total).toBe(1)
      expect(result.data[0].name).toBe('Composter Alpha')
    })
  })

  describe('fetchMachineStats', () => {
    it('computes online and offline stats accurately', async () => {
      const offlineMachine: BackendMachine = {
        ...mockBackendMachine,
        id: 'm-2',
        status: 'offline',
      }
      jest.mocked(api.get).mockResolvedValueOnce([mockBackendMachine, offlineMachine])

      const stats = await fetchMachineStats()
      expect(stats.registered).toBe(2)
      expect(stats.online).toBe(1)
      expect(stats.offline).toBe(1)
    })
  })
})

