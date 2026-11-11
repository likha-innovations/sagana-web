---
name: figma-design-to-code
description: Translate desktop and tablet Figma designs into production React 19 components with Tailwind CSS v4. Covers 1440px desktop layouts, responsive scaling, semantic HTML, and geometry tokens.
---

# Figma Design to Code (Web)

## 1. Desktop & Responsive Breakpoints

- **Baseline Canvas**: Target 1440px wide desktop viewports as the primary design reference frame.
- **Responsive Adaptability**:
  - Tablet & Laptop (`lg:` 1024px, `xl:` 1280px): Flex wrap headers, toolbars, and KPI grids so layouts remain balanced without horizontal overflow.
  - Fluid containers: Use `w-full`, `max-w-[1440px]`, and responsive flex directions (`flex-col lg:flex-row`) for toolbars and stat headers.
- **Scroll Containment**: Tables and wide data grids must use `overflow-x-auto` wrappers with sensible `min-w-[...]` to preserve columnar alignment on narrower screens.

## 2. Semantic HTML & Component Hierarchy

- **Landmark Structures**: Use semantic HTML tags within React JSX instead of nested `<div>` soup:
  - `<header className="...">`: Screen title rows, action buttons, breadcrumbs, and date range badges.
  - `<main className="...">`: Central route content container in `src/layout/app-shell.tsx`.
  - `<section aria-label="...">`: Major content regions (e.g., statistics row, table directory card).
  - `<article className="...">`: Self-contained cards (e.g., individual KPI summary card, chart card).
  - `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`: Tabular batch and operator listings.
- **No Artificial Wrapper Divs**: Do not introduce unnecessary outer `<div>` tags just to apply single Tailwind properties. Attach classes directly to the semantic element or component root.

## 3. Typography & Geometry Token Translation

- **Geometry Tokens**:
  - Outer cards: `rounded-[20px] bg-white p-5 shadow-card border border-[#DCDBD5]`.
  - Form inputs & interactive controls: `h-[52px] rounded-[14px] px-4 text-xs`.
  - Spacing: Translate Figma auto-layout gaps and paddings directly into Tailwind classes (`gap-3.5`, `gap-5`, `pt-4.5 pb-2.5`).
- **Typography Scale**:
  - Page Titles: `text-[29px]` or `text-[31px] font-semibold leading-[140%] text-[#414141]`.
  - Section Headers: `text-base font-bold text-foreground`.
  - Body & Table Data: `text-xs leading-[140%] text-[#414141]`.
  - Subtitles & Muted Labels: `text-[11px]` to `text-[12px] font-medium text-[#7C7D74]`.
- **Palette Integrity**: Use official Sagana palette (`#718619`, `#414141`, `#7C7D74`, `#DCDBD5`, `#FAFAFA`). Never approximate or introduce unapproved gradients.

## 4. Component Reuse First

- **Reuse Existing Primitives**: Before coding a new dropdown, calendar popover, or modal, inspect `src/components/ui/` (`CustomDropdown`, `DateRangeCalendar`, `ErrorBoundary`).
- **Domain Consistency**: Mirror the established layout of sibling pages (e.g., ensure `machines-page.tsx`, `compost-batches-page.tsx`, and `operators-page.tsx` maintain consistent toolbar height, search input width, and button styles).

