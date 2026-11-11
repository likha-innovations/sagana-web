import { api } from './client'

export interface BarangayCodeResponse {
  code: string | null
}

export const barangayApi = {
  getCode: () => api.get<BarangayCodeResponse>('/barangays/code'),
}

