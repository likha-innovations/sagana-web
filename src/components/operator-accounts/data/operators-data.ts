export type OperatorsData = {
  summary: {
    totalOperators: number
    activeToday: number
    averageShiftHours: number
    pendingApprovals: number
  }
  operators: Array<{
    id: string
    name: string
    role: string
    status: 'active' | 'inactive' | 'pending'
    lastActive: string
    assignedMachines: number
    region: string
  }>
}

export const mockOperatorsData: OperatorsData = {
  summary: {
    totalOperators: 0,
    activeToday: 0,
    averageShiftHours: 0,
    pendingApprovals: 0,
  },
  operators: [],
}
