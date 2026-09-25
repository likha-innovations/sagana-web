# Code Discipline & Simplicity Rules (simplicity-guard)

## 1. YAGNI & Lean Implementation
- No Speculative Coding: Build only what is needed for the current requirement. Never create anticipatory abstractions or generic utility modules before 3+ distinct call sites require them.
- Stdlib & Native First: Prefer built-in browser capabilities (fetch, URL, standard React hooks) before introducing custom helpers or external packages.
- Banned Packages: Axios, Lodash, Moment, Ramda, and heavyweight utility libraries.

## 2. DRY with Pragmatism
- Centralize Critical Contracts: Schemas, payload interfaces, and constants must live in their designated layers (src/types/, src/lib/utils.ts, src/api/).
- Avoid Premature DRY: Do not combine superficially similar UI elements into complicated mega-components with dozens of boolean flags. Duplicate small JSX blocks until a stable common abstraction emerges naturally.

## 3. Guard Clauses & Flat Control Flow
- Early Exits First: Exit immediately at the top of functions, hooks, and components when encountering invalid arguments, unauthenticated states, loading conditions, or error scenarios.
- Eliminate Deep Nesting: Avoid nested if/else ladders. Maximum nesting depth for conditional logic is 2 levels.
- Null Safety: Prefer optional chaining (?.) and nullish coalescing (??) over nested ternary checks or manual undefined checks.

## 4. Single-Line Comments Only (Zero Multiline / Zero JSDoc)
- Strictly Banned: Multiline comments (/* ... */) and JSDoc blocks (/** ... */) are forbidden in all application code.
- Single-Line Only: Use strictly single-line comments (// ...).
- Explain Why, Never What: Write comments only to explain non-obvious business constraints or edge-case workarounds.

## 5. Clean Diffs & Zero Dead Code
- No Zombie Code: Never leave commented-out code, dead functions, unused variables, or orphaned imports.
- Strict Typing: Zero any. Define explicit types or infer them from Zod schemas.
- No Console Clutter: Strip temporary debug console.log statements before committing; use logger from src/lib/logger.ts for system events.

## 6. Explicit Named Imports (No Inline Namespace Calls)
- Direct Named Imports: Always explicitly import hooks, types, components, and functions at the top of the file.
- Banned Namespace Access: Never use inline namespace prefixes in code (React.useEffect, React.useState, React.useMemo, React.FC, React.ReactNode). Always import identifiers directly.
