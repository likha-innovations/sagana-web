import { ApiError, type ApiResponse } from '@/types/api'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ApiClient')

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

interface FetchOptions extends RequestInit {
  token?: string | null
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, headers = {}, ...rest } = options
  const method = (rest.method || 'GET').toUpperCase()

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`
  const startTime = performance.now()

  logger.debug(`[HTTP OUT] ${method} ${endpoint}`)

  try {
    const response = await fetch(url, {
      headers: requestHeaders,
      ...rest,
    })

    const duration = Math.round(performance.now() - startTime)
    const json = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        (json && (json.message || json.error)) ||
        `Request failed with status ${response.status}`
      const normalizedMessage = Array.isArray(message)
        ? message.join(', ')
        : String(message)

      logger.warn(
        `[HTTP ${response.status}] ${method} ${endpoint} (${duration}ms) - ${normalizedMessage}`
      )
      throw new ApiError(response.status, normalizedMessage)
    }

    logger.info(`[HTTP ${response.status}] ${method} ${endpoint} (${duration}ms)`)

    // Auto-unwrap backend TransformResponseInterceptor envelope
    if (json && typeof json === 'object' && 'data' in json) {
      return (json as ApiResponse<T>).data
    }

    return json as T
  } catch (error) {
    if (error instanceof ApiError) throw error

    const duration = Math.round(performance.now() - startTime)
    logger.error(`[HTTP NETWORK FAILURE] ${method} ${endpoint} (${duration}ms)`, error)
    throw error
  }
}
