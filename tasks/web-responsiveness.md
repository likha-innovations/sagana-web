# [Task] Comprehensive Web Client Responsiveness & Mobile Adaptability

## Task description
The `sagana-web` administrative dashboard is currently optimized for a fixed 1440px desktop viewport. Screens below 1024px experience layout clipping, table overflow breakage, rigid sidebar obstruction, and stacked toolbars. This task establishes full responsive adaptability across Mobile (375px+), Tablet (768px - 1023px), and Desktop (1024px - 1440px+) viewports using Tailwind CSS v4, without visual degradation on desktop.

---

## Scope / Area
- [x] Frontend & Dashboard

---

## Action items / Work to do

### Phase 1: Navigation Shell & Layout Primitives (`src/layout/`)
- [ ] **AppShell Responsive Layout**:
  - Convert fixed sidebar (`w-[280px]`) into a collapsible off-canvas drawer on `< 1024px` (`lg:hidden`).
  - Add mobile header bar with hamburger menu toggle, logo, and active user profile trigger.
  - Implement backdrop overlay with tap-to-dismiss and escape key listener for mobile drawer.
  - Apply dynamic viewport padding: `px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8`.

### Phase 2: Toolbars, Filters & Controls Reflow (`src/components/*/`)
- [ ] **Operator Accounts Toolbar** (`accounts-toolbar.tsx`):
  - Make search input expand to full width (`w-full lg:max-w-[676px]`).
  - Wrap filter controls (`status-select`, `date-range-select`, `export`, `archive`) into a flex-wrap container on small screens.
- [ ] **Compost Batches Toolbar** (`compost-batches-toolbar.tsx`):
  - Stack search input above filter controls on `< 768px`.
  - Maintain 44px+ minimum tap targets on mobile dropdowns and action buttons.
- [ ] **Machines Toolbar** (`machines-toolbar.tsx`):
  - Allow connection status and date filters to wrap smoothly without overflow.
- [ ] **Dashboard Header** (`dashboard-header.tsx`):
  - Stack title row and location/date badges (`flex-col sm:flex-row sm:items-center sm:justify-between`).

### Phase 3: Tables & Horizontal Scroll Containment
- [ ] **Recent Batches Table** (`recent-batches-table.tsx`):
  - Wrap table in `overflow-x-auto` with momentum touch scrolling (`-webkit-overflow-scrolling: touch`).
  - Set explicit column widths with `min-w-[850px]` so cells do not truncate awkwardly.
- [ ] **Compost Batches Table** (`compost-batches-table.tsx`):
  - Add scroll shadow indicators or visible scroll affordances for horizontal overflow.
  - Keep phase status badges and action menus aligned.
- [ ] **Machines Table** (`machines-table.tsx`):
  - Prevent telemetry columns from collapsing; preserve minimum readable column spacing.
- [ ] **Operator Accounts Table** (`accounts-table.tsx`):
  - Maintain clean horizontal scroll on mobile with sticky or pinned action column if appropriate.
- [ ] **Unified Pagination Controls** (`*-pagination.tsx`):
  - On `< 640px`, collapse intermediate page numbers to `Page X of Y` with prominent Prev / Next buttons.

### Phase 4: KPI Summary Cards & Charts (`src/components/dashboard/`, `operator-accounts/`)
- [ ] **Dashboard KPI Grid**:
  - Refactor 4-card grid from fixed flex layout to `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`.
- [ ] **Operator Stats & Barangay Code Card**:
  - Change `OperatorStats` container from `xl:flex-row` to flex-col stack on mobile/tablet.
  - Make `BarangayCodeCard` scale to full width on `< 1280px`.
- [ ] **Recharts Visualizations**:
  - `active-batches-chart.tsx`: Ensure `ResponsiveContainer` scales smoothly without fixed pixel overflow.
  - `user-status-chart.tsx`: Wrap donut chart and legend vertically on mobile viewports.

### Phase 5: Modals, Slide-Over Drawers & Auth Screens
- [ ] **Archive Side Panel** (`archive-side-panel.tsx`):
  - On `< 640px`, transform side sheet into a full-width drawer (`w-full sm:max-w-[480px]`).
- [ ] **Suspend Operator Modal** (`suspend-operator-modal.tsx`):
  - Constrain modal width to `w-[calc(100%-32px)] max-w-[420px]` with safe viewport padding.
- [ ] **Authentication Routes** (`src/routes/auth/`):
  - Verify `sign-in.tsx` and `forgot-password.tsx` cards center with comfortable margins on 375px screens.

---

## Definition of Done / Completion criteria
- [ ] No horizontal viewport blowout or unwanted body scroll on viewports from 375px to 1440px+.
- [ ] Desktop layout (1440px) visual fidelity is 100% preserved with zero regressions.
- [ ] All table data accessible via smooth touch scrolling on mobile and tablet.
- [ ] Interactive touch targets meet WCAG AA minimum size requirements (>= 44x44px).
- [ ] Drawer and modal keyboard accessibility (Tab focus trap, Esc to close) verified.
- [ ] `pnpm test` (5/5 suites) and `pnpm run build` pass with zero TypeScript or bundling errors.

---

## Dependencies or blockers
- Prerequisite: `fix/web-tanstack-query-migration` branch merged or checked out.
- Reference: `figma-design-to-code` skill (`.agents/skills/figma-design-to-code/SKILL.md`).

---

## Additional context & resources
- **Target Breakpoints**:
  - Mobile: `375px` - `639px` (`< sm`)
  - Tablet Portrait: `640px` - `767px` (`sm`)
  - Tablet Landscape: `768px` - `1023px` (`md`)
  - Laptop / Small Desktop: `1024px` - `1279px` (`lg`)
  - Standard Desktop: `1280px` - `1440px+` (`xl`, `2xl`)
- **Key Files**:
  - Layout: `src/layout/app-shell.tsx`
  - Dashboard: `src/components/dashboard/dashboard-page.tsx`, `recent-batches-table.tsx`, `kpi-card.tsx`
  - Batches: `src/components/compost-batches/compost-batches-page.tsx`, `compost-batches-table.tsx`
  - Machines: `src/components/machines/machines-page.tsx`, `machines-table.tsx`
  - Operators: `src/components/operator-accounts/operators-page.tsx`, `archive-side-panel.tsx`
