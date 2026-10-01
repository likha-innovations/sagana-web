# Authentication & Roles

Sagana Web uses Clerk Core combined with custom database profile synchronization.

## Architecture & Data Flow

1. **Clerk Core Authentication**:
   - Manages user sessions, credentials, and JWT tokens.
   - Initialized via `ClerkProvider` in `src/providers.tsx`.

2. **Backend Profile Resolution (`/me`)**:
   - Once Clerk indicates an authenticated user, `AuthProvider` queries the backend API `/me` endpoint.
   - Fetches the canonical role and database record from PostgreSQL.
   - Caches the profile in React Query (`useProfile` hook).

3. **Normalized User Object**:
   - Merges Clerk metadata with database profile fields into a single validated `User` type.

## Supported Roles

| Role | Target Client | Capabilities |
|---|---|---|
| `admin` | Sagana Web | Full access to system monitoring, telemetry streams, and operations |
| `operator` | Sagana Mobile | Mobile telemetry logging, field sensor checks, and daily tasks |

## Token Injection

The native API client automatically queries active Clerk JWT tokens before dispatching HTTP requests:

```typescript
// src/lib/auth-token.ts
setAuthTokenGetter(getToken)

// src/api/client.ts
const token = await getAuthToken()
if (token) {
  headers['Authorization'] = `Bearer ${token}`
}
```

## Loading State Management

To avoid UI flickering on page reload, `isLoaded` in `AuthContext` only resolves to `true` once both Clerk and the backend database profile have finished loading.
