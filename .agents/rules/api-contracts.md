# API Contract & Cross-Stack Rules

1. Single Source of Truth:
   - Backend Zod schemas (in sagana-backend/src/modules/*/dto/) define all payload shapes.
   - Web TypeScript interfaces in src/types/api.ts and src/types/auth.ts must mirror backend schemas 1:1.

2. Automatic Envelope Unwrapping:
   - Backend returns { success: true, data: T, timestamp: string }.
   - Web apiFetch<T>() in src/api/client.ts must unwrap json.data and return T directly to hooks and components.

3. Structured Error Handling:
   - If backend returns { success: false, statusCode: number, message: string }, apiFetch must throw an ApiError(statusCode, message).
   - Never show generic error popups when the backend provides a descriptive error message; use sonner toast.error(err.message).
