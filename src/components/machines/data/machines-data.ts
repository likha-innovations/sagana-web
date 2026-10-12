export type MachinesData = {
  summary: {
    totalMachines: number
    online: number
    maintenance: number
    efficiency: number
  }
  machines: Array<{
    id: string
    name: string
    status: 'online' | 'maintenance' | 'offline'
    zone: string
    utilization: number
    uptime: string
  }>
}

export const mockMachinesData: MachinesData = {
  summary: {
    totalMachines: 0,
    online: 0,
    maintenance: 0,
    efficiency: 0,
  },
  machines: [],
}
