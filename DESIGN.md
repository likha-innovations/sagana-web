# Design Direction: sagana-web

## 1. Identity & Character
Sagana is an agricultural IoT telemetry and composting control platform. The design is utilitarian, earthy, and warm, avoiding generic sterile SaaS coldness or flashy AI tech tropes.

## 2. Color Palette
Derived directly from the core mobile application (`sagana-mobile/global.css`):

- **Primary**: `#718619` (Sagana Olive Harvest Green)
- **Primary Foreground**: `#FAF9EE` (Warm Cream)
- **Background**: `#FAF9EE` (Warm Cream canvas)
- **Foreground**: `#414141` (Soft Charcoal)
- **Card / Surface**: `#FAF9EE` with `#D3D2CB` borders
- **Secondary / Accent / Muted**: `#E2E1DC` (Warm Stone)
- **Muted Foreground**: `#96958F` (Subdued gray text)
- **Border**: `#D3D2CB`
- **Input Border**: `#C8C7BE`
- **Destructive**: `#E84C4C` (Coral Alert)
- **Ring**: `#718619`

## 3. Typography & Hierarchy
- System sans stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Readable tabular figures for telemetry numbers
- No oversized fake terminal monospace headers

## 4. Antislop Dials
- **ENERGY**: 2 (Clear functional contrast, purposeful accents)
- **RHYTHM**: 2 (Consistent card rhythm, clean hierarchy)
- **MOTION**: 1 (Micro-transitions on interactive states only; zero decorative float/bounce)

## 5. Mobile-First Standard (R-03 & R-32)
- All interactive buttons and inputs have a minimum tap target of 44px
- Responsive layouts start as single-column stacks for mobile viewports (<640px)
- Fully accessible keyboard focus indicators on all inputs and controls
