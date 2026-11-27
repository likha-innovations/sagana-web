# Project Memory: sagana-web

Web client for Sagana platform built with React 19, Vite 8, Tailwind CSS v4, React Router v8, Clerk authentication, and TanStack Query v5.

## Commands
- `pnpm dev` — Start Vite development server
- `pnpm test` — Run Jest test suites (`src/tests/*.test.ts`)
- `pnpm run build` — TypeScript compile (`tsc -b`) and Vite production bundle
- `pnpm run lint` — ESLint validation
- `pnpm run docs:dev` — Start VitePress documentation server
- `pnpm run docs:build` — Build static VitePress documentation
- `pnpm run docs:preview` — Preview production documentation build

## Architecture & Conventions (Synced with `sagana-mobile`)
- **Flat-Layered Architecture (`src/`)**:
  - `src/types/`: Single source of truth backend-aligned contracts, Zod schemas, query/stats types, and stateless display helpers (`api.ts`, `auth.ts`, `barangay.ts`, `batch.ts`, `dashboard.ts`, `machine.ts`, `operator.ts`).
  - `src/api/`: Thin typed REST endpoints (`apiFetch<T>` in `client.ts`) — unwraps `{ success, data }`, handles Clerk JWT token injection (`barangay.api.ts`, `batch.api.ts`, `dashboard.api.ts`, `machine.api.ts`, `operator.api.ts`, `user.api.ts`). No DTO mapper layers.
  - `src/hooks/`: TanStack Query v5 query & mutation hooks (`use-batches.ts`, `use-dashboard-data.ts`, `use-machines.ts`, `use-operators.ts`) owning cache invalidation, plus `use-dialog-focus.ts` for accessible modal focus trapping and restoration.
  - `src/components/`: UI primitives (`ui/`), auth (`auth/`), dashboard (`dashboard/`), machines (`machines/`), compost batches (`compost-batches/`), operator accounts (`operator-accounts/`), settings (`settings/`).
  - `src/context/`: Centralized auth/password-reset/persistence state (`auth-context.tsx`) and Socket.IO query invalidation (`socket-context.tsx`).
  - `src/lib/`: Shared date/pagination/initials helpers (`utils.ts`), CSV/PDF exporters (`csv-utils.ts`, `pdf-utils.ts`, `export-*.ts`), `date-range.ts`, `session-persistence.ts`, `password-reset.ts`, and logger (`createLogger` in `Asia/Manila`).
  - `src/routes/`: Route components organized by section (`auth/`, `admin/`).
  - `src/tests/`: Dedicated Jest unit tests (`*.test.ts`).

## Decisions & Standards
- **React 19 Alignment**: Direct named imports only. `React.FC` and `React.*` namespace calls are banned.
- **Typed Native Fetch**: Zero Axios. Native `apiFetch<T>` handles envelope unwrapping and `ApiError` throwing.
- **Backend Parity (No Mapper Layer)**: Consumes camelCase `sagana-backend` Prisma properties (`fullName`, `createdAt`, `macAddress`, `barangay`) directly across types, APIs, hooks, components, and exports.
- **Role Structure & Brand Alignment**: Admin portal with `RoleGuard` (`admin` role) and synced Sagana olive-green/cream palette (`#718619`, `#FAF9EE`).
