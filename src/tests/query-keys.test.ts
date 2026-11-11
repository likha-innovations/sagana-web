jest.mock('@/api/client', () => ({
  api: {
    get: jest.fn(),
  },
}))

jest.mock('@/context/socket-context', () => ({
  useSocketContext: () => ({ isConnected: true }),
}))

import { machineKeys } from '@/hooks/use-machines'
import { batchKeys } from '@/hooks/use-batches'
import { operatorKeys } from '@/hooks/use-operators'
import { dashboardKeys } from '@/hooks/use-dashboard-data'

describe('Query Key Factories', () => {
  it('generates consistent machine query keys', () => {
    expect(machineKeys.all).toEqual(['machines'])
    expect(machineKeys.stats).toEqual(['machines', 'stats'])
    expect(machineKeys.list({ search: 'alpha' })).toEqual([
      'machines',
      'list',
      { search: 'alpha' },
    ])
  })

  it('generates consistent batch query keys', () => {
    expect(batchKeys.all).toEqual(['batches'])
    expect(batchKeys.stats).toEqual(['batches', 'stats'])
    expect(batchKeys.list({ page: 2 })).toEqual([
      'batches',
      'list',
      { page: 2 },
    ])
  })

  it('generates consistent operator query keys', () => {
    expect(operatorKeys.all).toEqual(['operators'])
    expect(operatorKeys.stats).toEqual(['operators', 'stats'])
    expect(operatorKeys.archive).toEqual(['operators', 'archive'])
    expect(operatorKeys.list({ status: 'active' })).toEqual([
      'operators',
      'list',
      { status: 'active' },
    ])
  })

  it('generates consistent dashboard query keys', () => {
    expect(dashboardKeys.all).toEqual(['dashboard'])
    expect(dashboardKeys.data).toEqual(['dashboard', 'data'])
  })
})
