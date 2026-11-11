import { computeDashboardData } from '@/api/dashboard.api'
import type { CompostBatch } from '@/types/batch'
import type { MachineStatsData } from '@/api/machine.api'
import type { OperatorStatsData } from '@/api/operator.api'

jest.mock('@/api/client', () => ({
  api: {
    get: jest.fn(),
  },
}))

describe('dashboard.api', () => {
  const machineStats: MachineStatsData = {
    registered: 5,
    online: 4,
    offline: 1,
  }

  const operatorStats: OperatorStatsData = {
    total: 3,
    active: 2,
    inactive: 1,
    barangayCode: 'QC-176',
    barangayName: 'Barangay 176-E',
  }

  const mockBatches: CompostBatch[] = [
    {
      id: 'b-1',
      machineId: 'm-1',
      userId: 'u-1',
      batchCode: 'QC-001',
      status: 'active',
      startDate: '2026-10-01T00:00:00Z',
      completionDate: null,
      totalWeight: 200,
      finalWeight: null,
      machineName: 'Machine 1',
      compostingPhases: [{ phaseName: 'Thermophilic' }],
      feedstocks: [],
    },
    {
      id: 'b-2',
      machineId: 'm-2',
      userId: 'u-2',
      batchCode: 'QC-002',
      status: 'completed',
      startDate: '2026-09-01T00:00:00Z',
      completionDate: '2026-09-20T00:00:00Z',
      totalWeight: 300,
      finalWeight: 180,
      machineName: 'Machine 2',
      compostingPhases: [],
      feedstocks: [],
    },
  ]

  it('computes live KPIs and metrics directly from CompostBatch domain model', () => {
    const data = computeDashboardData(machineStats, operatorStats, mockBatches)

    expect(data.kpis).toBeDefined()
    // Total waste: 200 + 300 = 500
    const wasteKpi = data.kpis.find((k) => k.label === 'Total waste processed')
    expect(wasteKpi?.value).toBe('500')

    // Compost produced: 180
    const compostKpi = data.kpis.find((k) => k.label === 'Curing-ready compost produced')
    expect(compostKpi?.value).toBe('180')

    // Machines online: 4 / 5
    const machineKpi = data.kpis.find((k) => k.label === 'Machines online')
    expect(machineKpi?.value).toBe('4')
    expect(machineKpi?.unit).toBe('/ 5')

    // Operator accounts chart: 2 active, 1 suspended
    expect(data.userStatusData).toEqual([
      { name: 'Active', value: 2, color: '#97BC39' },
      { name: 'Suspended', value: 1, color: '#DCDBD5' },
    ])

    // Recent batches: 1 completed batch
    expect(data.recentBatches).toHaveLength(1)
    expect(data.recentBatches[0].id).toBe('QC-002')
  })

  it('handles empty datasets gracefully without crashing', () => {
    const data = computeDashboardData(
      { registered: 0, online: 0, offline: 0 },
      { total: 0, active: 0, inactive: 0, barangayCode: '', barangayName: '' },
      []
    )

    expect(data.kpis).toHaveLength(5)
    expect(data.recentBatches).toEqual([])
    expect(data.totalThisMonth).toBe(0)
  })
})
