export interface ApiResponse<T> {
  success: boolean
  data: T
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  statusCode: number
  message: string | string[]
  error?: string
  timestamp?: string
}

export class ApiError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}
