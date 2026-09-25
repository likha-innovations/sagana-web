# Clean Code & React 19 Best Practices Guard (clean-code-guardian)

## Core Mission
Ensure all React code in sagana-web follows modern React 19 standards, eliminates namespace clutter (React.*), bans React.FC, and enforces readable named imports.

---

## Banned Patterns

1. React.FC is FORBIDDEN:
   - Bad: export const MyComponent: React.FC<Props> = ({ title }) => { ... }
   - Good: export function MyComponent({ title }: Props) { ... }
   - Good: export const MyComponent = ({ title }: Props) => { ... }

2. Inline Namespace Calls (React.*) are FORBIDDEN:
   - Bad: React.useState, React.useEffect, React.useMemo, React.useCallback, React.useRef
   - Bad: React.ReactNode, React.HTMLAttributes, React.forwardRef, React.ComponentProps
   - Good: import { useState, useEffect, useMemo, useCallback, useRef, forwardRef, type ReactNode, type HTMLAttributes } from 'react'

3. Wildcard Imports are FORBIDDEN:
   - Bad: import * as React from 'react'
   - Good: import { useState, type ReactNode } from 'react'

---

## Modern React 19 Standards Checklist

1. Component Signatures:
   Define an explicit interface for props and annotate function arguments directly:
   interface ButtonProps {
     variant?: 'primary' | 'secondary'
     children: ReactNode
     onClick?: () => void
   }
   export function Button({ variant = 'primary', children, onClick }: ButtonProps) {
     return <button onClick={onClick}>{children}</button>
   }

2. Type-Only Imports:
   Always use the 'type' keyword for type imports to assist bundler tree-shaking:
   import { useState, useCallback, type ReactNode, type ChangeEvent } from 'react'

3. Flat Control Flow:
   Maximum 2 levels of indentation. Handle errors and loading states with guard clauses at the top.
