# Package Compatibility & React 19 Guard (package-compatibility-guard)

## Core Mission
Prevent dependency conflicts and runtime errors by verifying packages against React 19, Vite 8, and Tailwind v4 before adding to package.json.

---

## Strictly Banned Packages
1. Axios: Banned. Use typed apiFetch client.
2. Lodash / Moment / Ramda: Banned. Use standard JavaScript methods.
3. Heavy state management libraries (Redux, MobX): Banned. Use TanStack Query v5 and React Context.
