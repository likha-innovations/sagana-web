import {
  operatorApi,
  fetchOperatorAccounts,
  fetchOperatorStats,
  fetchArchivedOperators,
} from '@/api/operator.api'
import { getOperatorName } from '@/types/operator'
import { formatBirthday } from '@/lib/utils'
import { api } from '@/api/client'
import { barangayApi } from '@/api/barangay.api'

jest.mock('@/api/client', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}))

jest.mock('@/api/barangay.api', () => ({
  barangayApi: {
    getCode: jest.fn(),
  },
}))

describe('operator.api', () => {
  const mockOperators = [
    {
      id: 'op-1',
      fullName: 'Maria Santos',
      email: 'maria@example.com',
      role: 'operator',
      status: 'active',
      createdAt: '2026-10-01T00:00:00Z',
      birthday: null,
      barangayId: 'b-1',
      barangay: { id: 'b-1', name: 'Barangay 176-E', status: 'active', createdAt: '2026-01-01' },
    },
    {
      id: 'op-2',
      fullName: 'Pedro Penduko',
      email: 'pedro@example.com',
      role: 'operator',
      status: 'suspended',
      createdAt: '2026-10-05T00:00:00Z',
      birthday: null,
      barangayId: 'b-1',
      barangay: { id: 'b-1', name: 'Barangay 176-E', status: 'active', createdAt: '2026-01-01' },
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches operators from /operators (never /admin/operators)', async () => {
    jest.mocked(api.get).mockResolvedValueOnce(mockOperators)

    const res = await fetchOperatorAccounts({ search: 'Maria' })
    expect(api.get).toHaveBeenCalledWith('/operators')
    expect(res.total).toBe(1)
    expect(getOperatorName(res.data[0])).toBe('Maria Santos')
    expect(res.data[0].fullName).toBe('Maria Santos')
  })

  it('filters suspended operators for archive view', async () => {
    jest.mocked(api.get).mockResolvedValueOnce(mockOperators)

    const archived = await fetchArchivedOperators()
    expect(api.get).toHaveBeenCalledWith('/operators')
    expect(archived).toHaveLength(1)
    expect(getOperatorName(archived[0])).toBe('Pedro Penduko')
  })

  it('uses the real barangay code from barangayApi.getCode() rather than slicing ID', async () => {
    jest.mocked(api.get).mockResolvedValueOnce(mockOperators)
    jest.mocked(barangayApi.getCode).mockResolvedValueOnce({ code: '67SHVY' })

    const stats = await fetchOperatorStats()
    expect(stats.total).toBe(2)
    expect(stats.active).toBe(1)
    expect(stats.inactive).toBe(1)
    expect(stats.barangayCode).toBe('67SHVY')
    expect(stats.barangayName).toBe('Barangay 176-E')
  })

  it('patches status to /operators/:id/status', async () => {
    jest.mocked(api.patch).mockResolvedValueOnce({})

    await operatorApi.updateStatus('op-1', 'suspended')
    expect(api.patch).toHaveBeenCalledWith('/operators/op-1/status', { status: 'suspended' })
  })

  it('deletes operator via DELETE /operators/:id', async () => {
    jest.mocked(api.delete).mockResolvedValueOnce({})

    await operatorApi.delete('op-1')
    expect(api.delete).toHaveBeenCalledWith('/operators/op-1')
  })

  it('preserves UTC calendar day in formatBirthday and operatorApi.update across timezones', async () => {
    expect(formatBirthday('1995-05-05T00:00:00.000Z')).toBe('05/05/1995')
    expect(formatBirthday('1995-05-05')).toBe('05/05/1995')

    jest.mocked(api.patch).mockResolvedValueOnce({})
    await operatorApi.update('op-1', {
      fullName: 'Maria Santos',
      birthday: '05/05/1995',
    })

    expect(api.patch).toHaveBeenCalledWith('/operators/op-1', {
      fullName: 'Maria Santos',
      birthday: '1995-05-05',
    })
  })

  it('paginates filtered operators and includes suspended when requested', async () => {
    jest.mocked(api.get).mockResolvedValueOnce(mockOperators)

    const res = await fetchOperatorAccounts({ status: 'suspended', page: 1, pageSize: 10 })
    expect(res.total).toBe(1)
    expect(getOperatorName(res.data[0])).toBe('Pedro Penduko')
  })
})
