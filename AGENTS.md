# Web Client Agent Directives: sagana-web

## 1. STRICT PRIVACY & ENVIRONMENT SHIELD
- NEVER READ .env FILES DIRECTLY: Under no circumstances should any agent open, read, view, or grep .env, .env.local, .env.development, or any file containing live credentials.
- Inspect Schemas Only: Verify variable names from .env.example.
- Zero Secrets in Logs: Never output raw API keys, tokens, or credentials.

## 2. Zero Emojis
- Do not use emojis in code, comments, rules, or responses to save tokens.

## 3. Cognitive Flow Protocol (i-have-adhd)
- Lead With Next Action: Start every response with the immediate, concrete next action.
- Numbered Steps: Break multi-step tasks into clear sequential numbers.
- Zero Tangents: Suppress unsolicited essays and speculative features.
- Visible Milestone Wins: Highlight passing builds and tests immediately.

## 4. Code & Prose Density Protocol (honey)
- Minimum Code: Apply strict YAGNI. Write lean, stdlib-first implementations.
- Strip Conversational Fluff: Eliminate polite filler, preamble, and hedging.
- Direct Named Imports: Follow clean-code-guardian. Ban React.FC and React.* namespaces.
