# Examples

This directory will hold stack-specific example packs: fully-filled-in
rule files + example audit skills + example violation catalog entries
for common stacks.

## Planned examples (v0.3+)

- `react-firebase/` — React + Vite + Firebase + Firestore (web app)
- `next-supabase/` — Next.js + Supabase + Postgres (full-stack)
- `python-django/` — Django + Postgres + Celery (backend)
- `go-postgres/` — Go + Postgres + REST (service)
- `node-api/` — Express + MongoDB (API-only)

Each example shows:
- Filled-in `CLAUDE.md` + 5 rule files (B, E, H customized)
- 2-3 stack-specific audit skills
- Sample `docs/external-scan/` artifacts
- Sample V-log entries from plausible (fictional) bugs
- Pre-commit hook config for the stack's build system

## Contributing an example

1. Fork claude-guardrails
2. Create `examples/YOUR-STACK/` following the structure above
3. Fill in all placeholders with real values for that stack
4. Submit PR with 1-paragraph description of when this example applies

The goal is to give new users a concrete reference for how an
actual-project rule set looks — not just abstract templates.

## Using an example

```bash
# After installing claude-guardrails
cp -R claude-guardrails/examples/react-firebase/.claude/rules/* \
      /path/to/your-project/.claude/rules/
```

Then customize to your project specifics.
