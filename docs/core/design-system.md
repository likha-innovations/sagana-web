# Design System & Tokens

Documentation for the visual design language, color tokens, and antislop dial configuration in Sagana Web.

## Brand Color Palette

The color system is synchronized directly with the core mobile application:

| Token | Hex | Role |
|---|---|---|
| `--color-primary` | `#718619` | Sagana Olive Harvest Green (Brand Identity, Active Indicators) |
| `--color-primary-foreground` | `#FAF9EE` | Warm cream text on primary components |
| `--color-background` | `#FAF9EE` | Warm cream canvas base |
| `--color-foreground` | `#414141` | Soft charcoal body text |
| `--color-card` | `#FAF9EE` | Container and panel background |
| `--color-card-foreground` | `#414141` | Container text |
| `--color-secondary` | `#E2E1DC` | Warm stone neutral surface |
| `--color-muted` | `#E2E1DC` | Subtle element background |
| `--color-muted-foreground` | `#96958F` | Secondary labels, captions, metadata |
| `--color-border` | `#D3D2CB` | Dividers, card borders, separators |
| `--color-input` | `#C8C7BE` | Input field borders |
| `--color-destructive` | `#E84C4C` | Coral alert color for error states |
| `--color-ring` | `#718619` | Focus indicator ring |

## Antislop Dials

Configured per `DESIGN.md`:

- **ENERGY (2)**: High readability with natural earth-tone contrast. Avoids neon or harsh AI rainbow accents.
- **RHYTHM (2)**: Standard component pacing with uniform card elevation and grid proportions.
- **MOTION (1)**: Functional micro-interactions only on hover and focus. No decorative floating or bouncing animations.

## Mobile-First Tap Target Standard

- All interactive buttons, form inputs, and navigation toggles enforce a minimum height of 44px (`min-h-[44px]`).
- Focus rings are explicitly preserved on all controls for complete keyboard accessibility (`Tab` and `Shift+Tab`).
