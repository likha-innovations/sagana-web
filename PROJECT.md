# Project Memory: sagana-web

Web client for Sagana platform built with React 19, Vite 8, Tailwind CSS v4, React Router v8, Clerk authentication, and TanStack Query v5.

## Commands
- `pnpm dev` - Start Vite development server
- `pnpm build` - TypeScript compile (`tsc -b`) and Vite production bundle
- `pnpm lint` - ESLint validation

## Architecture & Conventions
- Flat-Layered Architecture (`src/`):
  - `src/api/`: Typed REST endpoints (`apiFetch<T>`) - unwraps `{ success, data }`, handles Clerk JWT token injection.
  - `src/hooks/`: TanStack Query v5 query/mutation hooks.
  - `src/components/`: UI primitives (Radix UI + CVA) and layout wrappers (`app-shell.tsx`, `role-guard.tsx`).
  - `src/context/`: Centralized state (`auth-context.tsx`, `socket-context.tsx`).
  - `src/lib/`: Logger (`createLogger` in Asia/Manila) and `cn()` utility.
  - `src/types/`: Single source of truth schemas (`auth.ts`, `api.ts`).
  - `src/routes/`: Route components organized by role (`auth/`, `admin/`, `superadmin/`).

## Decisions
- React 19 Alignment: Direct named imports only. Banned `React.FC` and `React.*` namespace calls.
- Typed Native Fetch: Zero Axios. Native `apiFetch<T>` handles envelope unwrapping and error throwing.
