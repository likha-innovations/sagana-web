# Typed API Client

Overview of the native HTTP networking layer in Sagana Web.

## Philosophy: Zero Axios

To maintain low bundle overhead and prevent unnecessary abstractions, network requests are performed using native `fetch` wrapped in a typed utility:

```typescript
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T>
```

## Features

1. **Automatic Envelope Unwrapping**:
   Backend responses formatted as `{ success: true, data: T }` are unwrapped directly to `T`.

2. **Standardized Error Handling**:
   Non-2xx HTTP responses throw typed `ApiError` instances containing the server message and status code.

3. **Clerk JWT Injection**:
   The active session token getter is wired via `setAuthTokenGetter` during application startup, automatically attaching `Bearer <token>` to outbound requests.

## Usage Example

```typescript
import { apiFetch } from '@/api/client'
import type { User } from '@/types/auth'

export const userApi = {
  getProfile: () => apiFetch<User>('/me'),
}
```
