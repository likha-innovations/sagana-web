---
name: ui-craftsman
description: Build, fix, or refactor Sagana Web screens and shared UI components using React 19, Tailwind CSS v4, and TanStack Query v5 conventions. Covers component boundaries, query key factories, forms, accessibility, and verification. Use for web application UI work.
---

# Sagana Web UI Craftsman

## 1. Establish the Target

1. Inspect the affected route screen, layout, imported UI components, and data hooks before editing. For a shared component change, locate its callers across `src/components/` before modifying props.
2. Follow existing component conventions: Radix UI primitives with `cva` for core inputs/buttons, typed interfaces directly on function signatures, and named imports.
3. Inspect current styles and theme tokens directly from `src/index.css` rather than copying stale values from project notes.

## 2. Maintainable Implementation

- **Lean Route Screens**: Keep route and page components responsible only for layout composition, URL search parameter synchronization, and wiring hooks.
- **Layered Architecture**:
  - Server state & data operations: `src/hooks/use-*.ts` and `src/api/*.api.ts`.
  - Feature & domain presentation: `src/components/<feature>/`.
  - Base reusable primitives: `src/components/ui/`.
  - Domain models & Zod schemas: `src/types/`.
- **Clean Code & React 19 Standards**:
  - Ban `React.FC` and inline namespaces (`React.useState`, `React.useEffect`, `React.ReactNode`). Always import identifiers directly from `'react'`.
  - Max 2 levels of indentation. Handle errors and loading with guard clauses at the top.
  - Single-line comments only (`//`), zero multiline (`/* ... */`) or JSDoc (`/** ... */`). Comment *why* a constraint exists, never *what* the code does.

## 3. TanStack Query v5 Architecture

- **Structured Query Key Factories**: Every resource module must expose a typed query key factory (e.g. `batchKeys`, `machineKeys`, `operatorKeys`, `dashboardKeys`):
  ```ts
  export const batchKeys = {
    all: ['batches'] as const,
    list: (params?: BatchQueryParams) => ['batches', 'list', params] as const,
    stats: ['batches', 'stats'] as const,
  }
  ```
- **Automatic WebSocket Invalidation**: Do not use manual polling loops (`setInterval` in UI components is banned for server data). Real-time telemetry arriving via `socket-context.tsx` must trigger selective cache invalidation:
  ```ts
  void queryClient.invalidateQueries({ queryKey: machineKeys.all })
  ```
- **Complete State Coverage**:
  - **Loading**: Render `<Skeleton />` blocks or dedicated table loaders on initial fetch.
  - **Error**: Render actionable error banners with retry callbacks (`onRetry={() => void refetch()}`).
  - **Empty**: Render friendly empty states when datasets are empty, never blank cards.

## 4. Design System & Tailwind CSS v4

- **Semantic Tokens & Exact Hex Codes**:
  - Primary Brand Green: `#718619` (Hover: `#5a6c14`, Focus ring: `focus:ring-[#718619]/30`).
  - Text: `text-[#414141]` (headings/body), `text-[#7C7D74]` (subtitles/muted), `text-[#AFAEA7]` (placeholders).
  - Borders: `border-[#DCDBD5]`.
  - Radius: `rounded-[14px]` (inputs/cards/dropdowns), `rounded-[20px]` (outer containers).
- **Icons**: Strictly use `lucide-react`. Never mix icon libraries or introduce emoji icons.
- **Feedback & Notifications**: Exclusively use `sonner` (`toast.success()`, `toast.error()`).

## 5. Accessibility & Clean States

- **Keyboard Navigation & Focus**: All interactive controls (buttons, dropdowns, inputs) must have visible focus rings (`focus:ring-1 focus:ring-[#718619]/30 focus:border-[#718619]`).
- **Icon-Only Buttons**: Must always have an `aria-label` and `title` attribute (e.g., `<button aria-label="Export report" title="Export report">`).
- **Color Contrast**: Ensure text meets WCAG AA contrast standards against container backgrounds. Never communicate status through color alone; always pair with a text label or icon.

## 6. Verification & Guardrails

Always execute the verification pipeline before considering a task complete:

1. `pnpm test`: Confirm all Jest unit tests in `src/tests/` pass with zero failures.
2. `pnpm run build`: Verify TypeScript compilation and Vite production build (`tsc -b && vite build`).
3. `pnpm run lint`: Ensure ESLint standards are respected across changed files.

