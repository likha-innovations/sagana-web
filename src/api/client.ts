import { ApiError, type ApiResponse, type ApiErrorResponse } from '@/types/api'
import { getAuthToken } from '@/lib/auth-token'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ApiClient')

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export interface FetchOptions extends RequestInit {
  token?: string | null
  withAuth?: boolean
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, withAuth = true, headers = {}, ...rest } = options
  const method = (rest.method || 'GET').toUpperCase()

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  }

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`
  } else if (withAuth) {
    const activeToken = await getAuthToken()
    if (activeToken) {
      requestHeaders['Authorization'] = `Bearer ${activeToken}`
    }
  }

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${API_BASE_URL.replace(/\/$/, '')}${normalizedEndpoint}`
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
      const errorData = json as ApiErrorResponse | null
      const message =
        errorData?.message ||
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

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
}
