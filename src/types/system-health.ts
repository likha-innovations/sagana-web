export interface SensorReading {
  id: string
  sensorId: string
  type: string
  value: number
  unit: string
  timestamp: string
  status: 'normal' | 'warning' | 'critical'
}
