import { isDateInRange } from '@/lib/date-range'

export type BatchPhase = 'Cooling' | 'Thermophilic' | 'Mesophilic' | 'Completed'

export interface Batch {
  id: string
  code: string
  startedBy: string
  machine: string
  status: BatchPhase
  feedstockWeight: string
  startedOn: string
  daysComposting: number
}

export interface BatchStatsData {
  allTimeTotalProduced: string
  totalCompostBatches: number
  finishedBatches: number
  ongoingBatches: number
}

export interface BatchQueryParams {
  search?: string
  status?: 'all' | BatchPhase
  dateRange?: string
  page?: number
  pageSize?: number
}

export interface BatchListResponse {
  data: Batch[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const mockBatches: Batch[] = [
  {
    id: 'b-1',
    code: 'QC-0930',
    startedBy: 'Nina Reyes',
    machine: 'AIVSP-001',
    status: 'Cooling',
    feedstockWeight: '320 kg',
    startedOn: 'Sep 29, 2026',
    daysComposting: 14,
  },
  {
    id: 'b-2',
    code: 'QC-1004',
    startedBy: 'Marco Santos',
    machine: 'AIVSP-002',
    status: 'Thermophilic',
    feedstockWeight: '290 kg',
    startedOn: 'Oct 04, 2026',
    daysComposting: 9,
  },
  {
    id: 'b-3',
    code: 'PG-1012',
    startedBy: 'Leah Cruz',
    machine: 'AIVSP-007',
    status: 'Mesophilic',
    feedstockWeight: '315 kg',
    startedOn: 'Oct 12, 2026',
    daysComposting: 1,
  },
  {
    id: 'b-4',
    code: 'QC-0926',
    startedBy: 'Nina Reyes',
    machine: 'AIVSP-001',
    status: 'Completed',
    feedstockWeight: '300 kg',
    startedOn: 'Sep 04, 2026',
    daysComposting: 24,
  },
  {
    id: 'b-5',
    code: 'QC-0925',
    startedBy: 'Marco Santos',
    machine: 'AIVSP-002',
    status: 'Completed',
    feedstockWeight: '280 kg',
    startedOn: 'Sep 01, 2026',
    daysComposting: 26,
  },
  {
    id: 'b-6',
    code: 'PG-0924',
    startedBy: 'Leah Cruz',
    machine: 'AIVSP-007',
    status: 'Completed',
    feedstockWeight: '310 kg',
    startedOn: 'Sep 02, 2026',
    daysComposting: 23,
  },
  {
    id: 'b-7',
    code: 'MK-0923',
    startedBy: 'Omar Tan',
    machine: 'AIVSP-004',
    status: 'Completed',
    feedstockWeight: '295 kg',
    startedOn: 'Aug 28, 2026',
    daysComposting: 27,
  },
  {
    id: 'b-8',
    code: 'SM-0922',
    startedBy: 'Maya Gomez',
    machine: 'AIVSP-012',
    status: 'Completed',
    feedstockWeight: '305 kg',
    startedOn: 'Aug 28, 2026',
    daysComposting: 25,
  },
]

export const mockBatchStats: BatchStatsData = {
  allTimeTotalProduced: '741 kg',
  totalCompostBatches: 8,
  finishedBatches: 5,
  ongoingBatches: 3,
}

// TODO: Replace with real API call to /api/admin/compost-batches
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

  const filtered = mockBatches.filter((batch) => {
    const matchesSearch =
      !search ||
      batch.code.toLowerCase().includes(search.toLowerCase()) ||
      batch.startedBy.toLowerCase().includes(search.toLowerCase()) ||
      batch.machine.toLowerCase().includes(search.toLowerCase()) ||
      batch.status.toLowerCase().includes(search.toLowerCase()) ||
      batch.feedstockWeight.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      status === 'all' || batch.status.toLowerCase() === status.toLowerCase()

    const matchesDate = isDateInRange(batch.startedOn, dateRange)

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

// TODO: Replace with real API call to /api/admin/compost-batches/stats
export async function fetchBatchStats(): Promise<BatchStatsData> {
  return mockBatchStats
}
