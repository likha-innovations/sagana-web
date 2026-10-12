export type CompostBatchesData = {
  summary: {
    activeBatches: number
    completedThisMonth: number
    avgDaysToStabilization: number
    okRate: number
  }
  batches: Array<{
    id: string
    account: string
    barangay: string
    machine: string
    phase: 'Mesophilic' | 'Thermophilic' | 'Cooling'
    status: 'On track' | 'Delayed' | 'Needs review'
    progress: number
    days: number
  }>
}

export const mockCompostBatchesData: CompostBatchesData = {
  summary: {
    activeBatches: 0,
    completedThisMonth: 0,
    avgDaysToStabilization: 0,
    okRate: 0,
  },
  batches: [],
}
