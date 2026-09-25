# UI Design & Styling Rules (ui-craftsman)

## 1. Component Standards (Radix UI + CVA)
- Use Radix UI primitives with class-variance-authority (cva) in src/components/ui/ for all core primitives: Button, Input, Card, Badge, Label.
- Components must expose standard variant and size props via cva.
- No React.FC. Annotate props directly on function component signatures.

## 2. Styling & Theme Tokens
- Style using Tailwind CSS v4 utility classes and CSS theme variables defined in src/index.css.
- Standard scale over arbitrary values (p-4, rounded-xl, gap-4).
- Use semantic theme tokens: bg-background, bg-card, bg-muted, bg-primary, bg-destructive, text-foreground, text-muted-foreground.

## 3. Icons & Feedback
- Icons must strictly come from lucide-react.
- Notifications and toasts must strictly use sonner (toast.success, toast.error).
