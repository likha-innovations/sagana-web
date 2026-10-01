# Architecture & Conventions

Overview of the structural patterns, layer boundaries, and coding standards used in Sagana Web.

## Flat-Layered Directory Architecture

The client source code is organized into isolated layers within `src/`:

```
src/
├── api/          # Typed REST endpoints (apiFetch wrapper, user queries)
├── assets/       # Static client assets
├── components/   # UI primitives (Radix UI + CVA) and layout wrappers
│   ├── layout/   # AppShell, RoleGuard
│   └── ui/       # Button, Card, Badge, Input, Label
├── context/      # Centralized React state (AuthContext)
├── hooks/        # TanStack Query and custom React hooks
├── lib/          # Utilities, Logger (Asia/Manila), Auth token bridge
├── routes/       # View components organized by area (auth/, admin/)
└── types/        # Schemas and inferred TypeScript types (auth, api)
```

## Layer Dependency Rules

To prevent coupling and maintain testability, dependencies must flow unidirectionally:

1. `routes` depend on `components`, `context`, `hooks`, and `types`.
2. `components` depend on `types` and `lib`.
3. `context` depends on `api`, `lib`, and `types`.
4. `hooks` depend on `api` and `types`.
5. `api` depends only on `lib` and `types`.

## React 19 Alignment

1. **Direct Named Imports**: Ban namespace imports such as `React.useState` or `React.FC`. Always import directly:
   ```tsx
   import { useState, useMemo, type ReactNode } from 'react'
   ```
2. **Explicit Function Components**: Components are declared with explicit parameter types:
   ```tsx
   export function AppShell({ children }: { children: ReactNode }) { ... }
   ```
3. **No Axios**: All network interactions use native `fetch` via the `apiFetch<T>` utility.

## Antislop Engineering Guidelines

All interface components adhere to the core antislop filter rules:
- **Zero em dashes (`—`)** in copywriting and system messages.
- **Honest placeholders**: Scaffolding areas display clear status markers rather than invented telemetry data or fake graphs.
- **Mobile-first tap targets**: All interactive buttons, inputs, and triggers maintain a minimum 44px tap area.
