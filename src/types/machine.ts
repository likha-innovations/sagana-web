export interface Machine {
  id: string
  name: string
  type: string
  status: 'online' | 'offline' | 'maintenance'
  lastPing: string
}
