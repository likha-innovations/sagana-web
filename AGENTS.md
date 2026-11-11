# Web Client Agent Directives: sagana-web

## Property naming

- Use camelCase for properties in application-owned models, schemas, fixtures, and REST contracts.
- Preserve required external contract keys and existing MQTT/WebSocket telemetry payloads.

## 1. 🛡️ STRICT PRIVACY & ENVIRONMENT SHIELD (CRITICAL)

- **NEVER READ .env FILES DIRECTLY**: Under no circumstances should any agent open, read, view, or grep `.env`, `.env.local`, `.env.development`, or any file containing live credentials.
- **Inspect Schemas Only**: Verify variable names strictly from `.env.example`.
- **Zero Secrets in Logs**: Never output raw API keys, tokens, credentials, or connection strings.

## 2. ⚡ Cognitive Flow Protocol (i-have-adhd)

- **Lead With Next Action**: Start every response with the immediate, concrete next action.
- **Numbered Steps**: Break all multi-step tasks into clear, sequential numbers (1, 2, 3).
- **Zero Tangents & No Cognitive Overwhelm**: Suppress unsolicited essays, tangential rabbit holes, and speculative future features. Stick strictly to the active task.
- **Visible Milestone Wins**: Highlight concrete wins and passing tests as soon as they are completed.
- **Realistic Time & Scope Scoping**: Provide quick, realistic estimates for multi-step tasks.

## 3. 🍯 Code & Prose Density Protocol (honey)

- **Minimum Code That Needs to Exist**: Apply strict YAGNI. Write lean, stdlib/native-first implementations.
- **Strip All Conversational Fluff**: Eliminate polite filler, preamble, self-evident narration, and hedging.
- **Dense, Exact Prose**: Keep technical terms exact, file links clickable, and explanations compact.
- **Direct Named Imports**: Follow `clean-code-guardian`. Ban `React.FC` and inline `React.*` namespaces (`React.useState`, `React.useEffect`, `React.ReactNode`). Always import named identifiers directly.

## 4. 🎨 Web UI Agent & Skills

The web UI craftsmanship skills live in `.agents/skills/`:

- For UI implementation, component refactoring, and TanStack Query integration, read `.agents/skills/ui-craftsman/SKILL.md`.
- When translating a Figma reference or layout specification, also read `.agents/skills/figma-design-to-code/SKILL.md`.
- Use these skills when working directly on any web screen, component, hook, or layout.

## 5. 🗺️ Source Map

- `src/api/`: Typed REST wrappers (`api.get`, `api.patch`, `api.delete`). No raw `axios`; uses typed `fetch` wrapper.
- `src/hooks/`: TanStack Query v5 hooks with structured query key factories (`*Keys.all`, `*Keys.list()`, `*Keys.stats`).
- `src/components/`: Feature modules and domain presentation (`compost-batches/`, `machines/`, `operator-accounts/`, `dashboard/`, `settings/`).
- `src/components/ui/`: Base primitives (Radix UI + CVA).
- `src/context/`: Auth state (`auth-context.tsx`) and WebSocket real-time cache invalidation (`socket-context.tsx`).
- `src/types/`: Centralized Prisma-aligned Zod schemas and TypeScript models (`batch.ts`, `auth.ts`, `api.ts`, `dashboard.ts`).
- `src/tests/`: Dedicated Jest unit test suites (`*.test.ts`). Never place tests directly in component folders or name them `*.spec.ts`.
- `src/lib/`: Utilities (`utils.ts` for `cn()`, `logger.ts` for scoped client logging, `date-range.ts`, `pdf-utils.ts`).

## 6. 🧪 Verification Standard

Always run meaningful checks before declaring work complete:

- `pnpm test`: Run Jest unit test suite (`src/tests/*.test.ts`).
- `pnpm run build`: Production bundle and TypeScript type-check (`tsc -b && vite build`).
- `pnpm run lint`: ESLint verification without modifying unrelated files.

## 7. 🔍 Two-Tier Codebase Scanning (Graphify & Ground-Truth Protocol)

### Macro Navigation (When to use Graphify)
- **Use Graphify for Architecture & Tracing (When Present)**: Use only when `graphify-out/graph.json` is present to find where capabilities live across unfamiliar modules, assess blast radius (*"What calls X?"*), or trace paths (*`graphify path "A" "B"`*). If the graph is missing, inspect source files directly instead.
- **Hard Ban on Direct `graph.json` Reads**: NEVER use `read_file`, `grep`, or shell dumps directly on `graphify-out/graph.json` (~300,000+ tokens). Always execute scoped, off-context queries via the CLI with a token budget:
  ```powershell
  graphify query "<question>" --budget 1500
  ```
- **Toggle**: Can be bypassed when the user explicitly requests `--no-graph` or raw file scanning.

### Micro Execution (When to use Direct Files)
- **Direct File First (Skip Graphify)**: When a prompt explicitly names a source file or component (e.g. *"Fix lockout in src/routes/auth/sign-in.tsx"*), open the file directly via `read_file`. Do not query the graph first; reserve graph queries strictly for checking unknown downstream dependencies or blast radius.
- **Micro Precision & Edits**: Always inspect live source files directly for exact syntax, type definitions, error signatures, and preparing atomic code changes.
- **Silent Source Fallback (Stale Graph)**: If recent git commits or file modifications occurred after the graph was built, or if graph output is ambiguous/misaligned, silently fall back to inspecting live source files directly without triggering an auto-rebuild.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:
- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: download `antislop.md` again, or run `npx antislop-ai --update` if it was installed as skill folders.
<!-- antislop:end -->
