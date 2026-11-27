---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions.
---

## graphify

When `graphify-out/graph.json` exists:

- Run `graphify query "<question>" --budget 1500` (CLI) or `query_graph` (MCP). Never `read_file`, `grep`, or dump `graphify-out/graph.json` directly.
- Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts.
- If `graphify-out/wiki/index.md` exists, navigate it before scanning raw files.
- When a prompt names a specific file/component directly, read the live source file first instead of querying the graph.
