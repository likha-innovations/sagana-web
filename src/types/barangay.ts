export interface Barangay {
  id: string
  name: string
  code?: string | null
  status?: string
  createdAt?: string
}

export interface BarangayCodeResponse {
  code: string | null
}
