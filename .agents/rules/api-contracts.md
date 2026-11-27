---
trigger: always_on
description: API Contract rules connecting sagana-web with sagana-backend without DTO translation layers
---

# API Contract & Cross-Stack Rules

1. **Single Source of Truth (Zero Mapper Layers)**:
   - Backend Prisma models and DTOs (`sagana-backend`) already use camelCase properties.
   - All `sagana-web/src/types/*.ts` models (`operator.ts`, `machine.ts`, `batch.ts`, `barangay.ts`, `auth.ts`, `dashboard.ts`, `api.ts`) must mirror backend shapes 1:1.
   - Never add `Backend*` or `*Dto` interfaces or `mapBackend*` / `map*Dto` translation functions in `src/api/*.api.ts`. Derive display strings cleanly via small pure helpers in `src/types/{domain}.ts` or `src/lib/utils.ts`.

2. **Types Live Strictly in `src/types/`**:
   - Domain models, query params (`*QueryParams`), stats (`*StatsData`), and paginated list types (`*ListResponse`) belong in `src/types/{domain}.ts`.
   - `src/api/*.api.ts` must only export HTTP endpoint wrappers (`*Api`) and pure query/aggregation helpers (plus `FetchOptions` in `client.ts`).

3. **Automatic Envelope Unwrapping**:
   - Backend returns `{ success: true, data: T, timestamp: string }`.
   - `apiFetch<T>()` (`api.get`, `api.post`, `api.patch`, `api.delete`) in `src/api/client.ts` unwraps `json.data` and returns `T` directly.

4. **Structured Error Handling**:
   - On HTTP error (`{ success: false, statusCode, message }`), `apiFetch` throws `ApiError(statusCode, message)`.
   - Propagate failures cleanly; never swallow fetch errors to serve stale or partial data on exports/mutations. Use `sonner` (`toast.error`) for user feedback.
