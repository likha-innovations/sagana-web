export interface Operator {
  id: string
  fullName: string
  email: string
  role: string
  status: 'active' | 'inactive'
  createdAt: string
}
