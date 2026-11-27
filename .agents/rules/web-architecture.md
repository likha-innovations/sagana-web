---
trigger: always_on
description: Core web architecture rules for sagana-web synced with sagana-mobile covering directory structure, backend-aligned types, thin REST APIs, TanStack Query v5 hooks, and Tailwind v4
---

# Web Architecture Rules (web-ui / web-architect)

## 1. Project Directory Structure
All client code inside `sagana-web/src/` must follow the mobile-synced flat-layered architecture:

```text
src/
├── types/                    # CENTRALIZED SCHEMAS, CONTRACTS & PURE READ HELPERS
│   ├── api.ts                # ApiResponse<T>, ApiErrorResponse, ApiError
│   ├── auth.ts               # User & auth/password-reset Zod schemas
│   ├── barangay.ts           # Barangay, BarangayCodeResponse
│   ├── batch.ts              # CompostBatch schemas, stats/query types & getBatchPhase
│   ├── dashboard.ts          # DashboardData
│   ├── machine.ts            # Backend-aligned Machine, stats/query types & helpers
│   └── operator.ts           # Backend-aligned OperatorAccount, stats/query types & helpers
│
├── api/                      # THIN REST API & HTTP WRAPPERS (NO INLINE DTOs / NO MAPPERS)
│   ├── client.ts             # Typed apiFetch<T>() & api.* wrapper around native fetch
│   ├── barangay.api.ts       # barangayApi
│   ├── batch.api.ts          # batchApi, fetchBatches, fetchBatchStats, fetchBatchTemperature
│   ├── dashboard.api.ts      # computeDashboardData, fetchDashboardData
│   ├── machine.api.ts        # machineApi, fetchMachines, fetchMachineStats
│   ├── operator.api.ts       # operatorApi, fetchOperatorAccounts, fetchArchivedOperators, fetchOperatorStats
│   └── user.api.ts           # userApi
│
├── hooks/                    # TANSTACK QUERY v5 READS, MUTATIONS & UI FOCUS HOOKS
│   ├── use-batches.ts        # batchKeys, useBatches, useBatchStats, useBatchTemperature
│   ├── use-dashboard-data.ts # dashboardKeys, useDashboardData
│   ├── use-machines.ts       # machineKeys, useMachines, useMachineStats
│   ├── use-operators.ts      # operatorKeys, useOperators, useOperatorStats, useArchivedOperators, mutations
│   └── use-dialog-focus.ts   # Focus entry, Tab trap, Escape close & trigger restoration
│
├── components/               # FEATURE & UI PRESENTATION
│   ├── ui/                   # Base primitives (Radix UI / Tailwind v4)
│   └── <feature>/            # compost-batches/, machines/, operator-accounts/, dashboard/, settings/, auth/
│
├── context/                  # GLOBAL STATE MACHINES
│   ├── auth-context.tsx      # AuthProvider & useAuthContext
│   └── socket-context.tsx    # Socket.IO provider & real-time queryClient invalidation
│
├── lib/                      # SHARED UTILITIES & EXPORTERS
│   ├── utils.ts              # formatDate, formatBirthday, toCanonicalBirthday, getInitials, paginateList
│   ├── csv-utils.ts          # Formula-injection-safe CSV export
│   ├── pdf-utils.ts          # jsPDF table export
│   └── logger.ts             # Scoped logger (Asia/Manila)
│
├── routes/                   # ROUTE SCREENS (1:1 WITH URLS)
│   ├── auth/                 # sign-in.tsx, forgot-password.tsx
│   └── admin/                # dashboard.tsx, machines.tsx, compost-batches.tsx, operator-accounts.tsx
│
└── tests/                    # DEDICATED JEST UNIT TEST SUITES (*.test.ts)
```

## 2. Routing Hierarchy
- React Router v8 with `RoleGuard` (`admin` role) and `AppShell` in `src/layout/`.
- Providers wrap cleanly from `src/main.tsx` / `src/App.tsx` (`ClerkProvider` -> `QueryClientProvider` -> `AuthProvider` -> `SocketProvider` -> Router).

## 3. Server State Management (TanStack Query v5)
- All server data reads AND writes belong in `src/hooks/use-*.ts`:
  - `useQuery` with structured `*Keys` factories (`*Keys.all`, `*Keys.list()`, `*Keys.stats`) for reads.
  - `useMutation` for writes (status toggles, profile updates, deletions) with `onSuccess` invalidating `*Keys.all`.
  - Pages and modals must call hook mutations (`mutateAsync`), never raw `api.*` write calls paired with manual `queryClient.invalidateQueries()`.
- Real-time updates arrive via `socket-context.tsx` and invalidate affected `*Keys.all`; do not add `setInterval` polling loops in UI components.

## 4. Zero Axios & Shared Utilities First
- All network calls use `apiFetch<T>()` in `src/api/client.ts`. Axios is banned.
- Shared date formatting, initials, and pagination helpers belong in `src/lib/utils.ts`; never duplicate formatting helpers across components or API files.
