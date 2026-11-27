---
name: ui-craftsman
description: Build, fix, or refactor Sagana Web screens, hooks, and shared UI using React 19, Tailwind CSS v4, TanStack Query v5, and backend-aligned src/types/{domain}.ts contracts. Covers component boundaries, mutations, accessibility, exports, and verification. Use for web application UI work, not backend-only or documentation-only tasks.
---

# Sagana Web UI Craftsman

## 1. Establish the Target

1. Inspect the affected route screen, layout, imported UI components, types (`src/types/`), and TanStack hooks (`src/hooks/`) before editing. For a shared component change, locate its callers across `src/components/` before modifying props.
2. Follow the user's brief and existing screen conventions. When a Figma reference is supplied, also read [figma-design-to-code](../figma-design-to-code/SKILL.md) and inspect only the relevant flow/states.
3. Inspect current styles and `@theme` tokens directly from `src/index.css` rather than copying stale values from old notes.

## 2. Maintainable Implementation

- **Lean Route Screens & Pages**: Keep route/page components focused on layout composition, URL search param synchronization (`useSearchParams`), and wiring TanStack Query hooks.
- **Mobile-Synced Layered Architecture**:
  - **Domain Contracts (`src/types/{domain}.ts`)**: Keep backend-aligned camelCase models (`operator.ts`, `machine.ts`, `batch.ts`, `barangay.ts`, `auth.ts`, `dashboard.ts`, `api.ts`), query/stats interfaces, and small stateless display helpers (`getOperatorName`, `getMachineCode`, `getBatchPhase`) together. Never duplicate API shapes or add `Backend*` / `*Dto` mapper layers in `src/api/`.
  - **Thin REST APIs (`src/api/*.api.ts`)**: Keep REST calls cleanly wrapped (`*Api` + pure filter/stats helpers) using `apiFetch<T>()`. Zero domain interfaces inside `src/api/`.
  - **Server State (`src/hooks/use-*.ts`)**: Own all `useQuery` reads AND `useMutation` writes (`onSuccess` invalidating `*Keys.all`). Pages must not call mutation endpoints and manually call `queryClient.invalidateQueries()`.
  - **Shared Utilities (`src/lib/utils.ts`)**: Reuse `formatDate`, `formatBirthday`, `toCanonicalBirthday`, `getInitials`, and `paginateList`. Never re-implement local date or initial helpers inside components or APIs.
- **Clean Code & React 19 Standards**:
  - Ban `React.FC` and `React.*` namespaces (`React.useState`, `React.ReactNode`); import named identifiers directly.
  - Max 2 levels of indentation; use early-return guard clauses.
  - Single-line comments (`//`) only — explain *why*, never *what*; zero `/* ... */` or JSDoc.

## 3. TanStack Query v5 & Real-Time Invalidation

- Expose structured `*Keys` factories (`all`, `list`, `stats`, plus domain keys like `archive` or `temperature`).
- Do not add manual `setInterval` polling loops for server data in UI components; rely on `socket-context.tsx` cache invalidation.
- **Exports**: CSV/PDF export handlers must fetch the complete matching dataset with active filters preserved, include valid empty responses (`[]`) without falling back to stale UI rows, and show an actionable error toast on fetch failure without downloading or claiming success.

## 4. Design System, Forms & Accessibility

- Use `@theme` semantic tokens in `src/index.css` (`bg-background`, `bg-white`, `text-foreground`, `text-text-email`, `border-border`, `bg-primary`, `text-destructive`) and `lucide-react` icons. Notifications use `sonner` (`toast.success`, `toast.error`).
- **Keyboard & Focus**:
  - Use native `<button type="button">` for clickable cards/table actions; never rely solely on clickable `<div>` elements.
  - Associate every form input with its `<label htmlFor="...">` and matching `id`.
  - Use [use-dialog-focus.ts](../../hooks/use-dialog-focus.ts) on dialogs/confirmation modals for focus entry, Tab trapping, Escape dismissal, `inert` background isolation, and trigger focus restoration.
  - Give icon-only controls explicit `aria-label` (and `title` where helpful), and use `sr-only` status cues (e.g., checklist items) so screen readers do not depend on visual icons or color alone.
- **Complete State Coverage**: Render loading skeletons/spinners, empty states with Clear Filters recovery, and error states with Retry callbacks (`onRetry={() => void refetch()}`). Disable submit buttons during pending async work and guard stale async responses with cancellation/ownership tokens.

## 5. Verification & Hand Off

Always run focused and full verification after edits:

1. `pnpm test` — Jest unit tests (`src/tests/*.test.ts`).
2. `pnpm run lint` — ESLint checks.
3. `pnpm run build` — `tsc -b && vite build`.

Report changed files, reused helpers/hooks, exact check counts, and any unverified manual browser checks concisely.
