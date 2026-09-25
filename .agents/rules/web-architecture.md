# Web Architecture Rules (web-architect)

## 1. Project Directory Structure
All client code inside sagana-web/src/ must adhere strictly to the role-based flat-layered architecture:

src/
├── api/                  # REST API & HTTP CALLS
│   ├── client.ts         # Typed apiFetch wrapper around native fetch
│   ├── auth.api.ts       # getProfile(), getHealth(), createUser()
│   └── index.ts          # Barrel export for API endpoints
│
├── hooks/                # TANSTACK QUERY & REACT HOOKS
│   ├── use-auth.ts       # TanStack useQuery / useMutation calling authApi
│   └── index.ts          # Barrel export for hooks
│
├── components/           # VISUAL UI
│   ├── ui/               # Base primitives (Radix UI + cva: button, input, card)
│   └── layout/           # App shell and route guards (app-shell.tsx, role-guard.tsx)
│
├── context/              # GLOBAL APP STATE MACHINES
│   ├── auth-context.tsx  # Centralized AuthProvider & useAuthContext
│   └── socket-context.tsx# WebSocket / Socket.IO provider
│
├── lib/                  # UTILITIES & LOGGERS
│   ├── logger.ts         # Centralized scoped Logger (createLogger) formatted in Asia/Manila
│   └── utils.ts          # cn() class helper (clsx + tailwind-merge)
│
├── routes/               # ROUTE SCREENS (1:1 with URLs)
│   ├── auth/             # Public routes (sign-in.tsx)
│   ├── admin/            # Admin routes (index.tsx)
│   └── superadmin/       # Superadmin routes (dashboard.tsx, create-user.tsx)
│
└── types/                # CENTRALIZED SCHEMAS & CONTRACTS
    ├── auth.ts           # Zod schemas & inferred TypeScript types
    ├── api.ts            # ApiResponse<T>, ApiError
    └── index.ts          # Barrel export

## 2. Routing Hierarchy
- React Router v8 with Route nesting.
- Root layout wraps providers: ClerkProvider -> QueryClientProvider -> AuthProvider -> SocketProvider -> BrowserRouter.
- Role-based routing via RoleGuard component: admin, superadmin.

## 3. Server State Management (TanStack Query v5)
- All server data interactions must use @tanstack/react-query in src/hooks/:
  - useQuery for reads and polling.
  - useMutation for writes and form submissions.
- Organize query keys into structured factory objects.
- Invalidate appropriate query caches on mutation success.

## 4. Zero Axios & Typed Native Fetch Wrapper
- All network calls must use apiFetch<T>() in src/api/client.ts. Axios is strictly banned.
