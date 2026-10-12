export interface Batch {
  id: string
  batchCode: string
  stage: 'preparation' | 'active' | 'curing' | 'complete'
  startDate: string
  endDate?: string
}
