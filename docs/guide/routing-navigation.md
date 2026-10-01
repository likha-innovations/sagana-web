# Routing & Navigation

Routing in Sagana Web is powered by React Router v8 with role-based protection.

## Route Map

| Path | Component | Access Level | Description |
|---|---|---|---|
| `/sign-in/*` | `SignInPage` | Public | Custom Clerk authentication form |
| `/admin` | `AdminDashboard` | Protected (`admin`) | Main system status and telemetry scaffold |
| `/` | `IndexRedirect` | Public/Redirect | Automatically resolves landing destination |
| `*` | `IndexRedirect` | Public/Redirect | Catch-all redirect to active dashboard |

## Consolidated Admin Model

The former superadmin tier has been consolidated into the unified `admin` role:
- All administrative tools, telemetry monitoring, and system metrics live directly under `/admin`.
- Operators use the dedicated Sagana Mobile application.

## Static Sidebar Layout

The primary shell component (`src/components/layout/app-shell.tsx`) provides:

1. **Desktop Viewports (>= 768px)**:
   - A static, fixed side navigation (`fixed inset-y-0 left-0 w-64`) that remains pinned in place regardless of page scroll.
   - Main content is offset by `md:pl-64` to prevent clipping.

2. **Mobile Viewports (< 768px)**:
   - A compact 56px sticky top bar with hamburger menu toggle.
   - Off-canvas drawer sliding from the left with minimum 44px tap targets and backdrop overlay.

## Role Guard Behavior

The `RoleGuard` component (`src/components/layout/role-guard.tsx`) secures administrative routes:
- Unauthenticated users are redirected to `/sign-in`.
- During initial session verification and database profile queries, the guard presents a clean loading spinner rather than abrupt error cards.
