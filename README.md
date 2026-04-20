# claude-guardrails

> **Universal rule enforcement for any Claude-assisted project.**
> Grep-auditable. No AI compression. Strict cross-session continuity.
> Violation catalog grows from real bugs — not hypothetical best practices.

**Designed to be `git clone`'d into every new project you start with Claude.**
Rules, audits, session-handoff protocol — all stack-agnostic, all template-based.
You fill in the `[FILL-IN]` placeholders once per project, and the methodology
enforces itself across every session afterwards.

## Why

AI coding assistants drift. Rules you told them last week get quietly
re-interpreted this week. Memory tools that "summarize your project" make
this worse — they compress your iron-clad rules into fuzzy summaries that
grep can't find and audits can't verify.

**claude-guardrails is the opposite approach:**

- Rules live in **plain markdown files**, numbered, greppable.
- Every rule carries an **anti-example** — a real bug that motivated it.
- Every bug adds a **new audit invariant** to a skill file you can grep.
- No summarization, no vector DB, no background worker.
- Checked into your repo → team-enforced, not per-user.

## What you get

```
your-project/
├── .claude/
│   ├── rules/         ← 5 rule files (iron-clad, workflow, stack, culture)
│   ├── skills/        ← Audit skills with numbered invariants
│   └── hooks/         ← Pre-commit grep-pair verification
├── .agents/
│   ├── AGENTS.md      ← Trust priority (rules always win on conflict)
│   ├── active.md      ← Hot-state for next session
│   └── sessions/      ← Session checkpoints with resume prompts
└── docs/
    ├── methodology.md        ← How to write rules that don't drift
    ├── violation-log.md      ← Catalog of past bugs + lessons
    ├── triangle-rule.md      ← 3-source verification pattern
    └── continuous-improvement.md  ← Bug → test + rule + skill cycle
```

## Install

```bash
# Clone + run installer (takes 10 seconds, zero runtime deps)
git clone https://github.com/YOUR/claude-guardrails
cd claude-guardrails
./install.sh /path/to/your-project
```

The installer copies **templates only** into your target project — no
runtime, no background worker, no SaaS. Already-present files are never
overwritten (safe to re-run).

First time in a project:

1. `./install.sh .` in your project root
2. Fill in `[FILL-IN]` placeholders in:
   - `CLAUDE.md` — stack + env + deploy command (5 min)
   - `.claude/rules/00-session-start.md` — character + expectations (5 min)
   - `.claude/rules/01-iron-clad.md` — rules B, E, H per your stack (10 min)
   - `.claude/rules/02-workflow.md` — test/build/deploy commands (2 min)
   - `.claude/rules/03-stack.md` — stack gotchas (grows over time)
   - `.claude/rules/04-culture.md` — domain rules (grows over time)
3. Read `docs/methodology.md` — the core philosophy (15 min)
4. Read `docs/cross-session.md` — the protocol for new chats (10 min)

Total first-time setup: **~45 min**. After that, every new session reads
the same files automatically — zero setup per session.

## Cross-session continuity (strict mode)

The killer feature: **every new Claude chat resumes exactly where the last
left off, with zero drift on iron-clad rules.**

Protocol:
1. Every session ends with an updated `SESSION_HANDOFF.md` + a
   paste-ready Resume Prompt
2. User pastes the Resume Prompt into the new chat
3. New Claude reads `CLAUDE.md` → `SESSION_HANDOFF.md` → `.agents/active.md`
   → `.claude/rules/00-session-start.md` (mandatory, before any tool call)
4. Context resumes deterministically — iron-clad rules loaded verbatim,
   no summarization

Full detail: `docs/cross-session.md`.

## How it works

### 1. Rules as code

Instead of `CLAUDE.md` with vague guidance, use numbered invariants:

```markdown
### C2. Security by default
- Never use `Math.random()` for URL tokens → use `crypto.getRandomValues`
- Never commit secrets under `src/` or `api/` → env vars only
- Never put `user.uid` in world-readable Firestore docs
```

Claude grep-reads these before every turn. You grep them in audit skills.
Violations are catchable in CI.

### 2. Audit skills

A skill is a greppable list of invariants. Example:

```markdown
# /audit-anti-vibe-code
AV1: grep `Math.random\(\)\.toString\(36\)` in src/ → token collision risk
AV2: grep `allow.*if true` in *.rules → missing gate
AV3: grep duplicate helper definitions (Rule of 3) → extract shared
...
```

Run `/audit-anti-vibe-code` before every release. Each invariant stays
greppable forever — never AI-compressed.

### 3. Violation log

When a bug ships, catalog it:

```markdown
### V7 — 2026-04-19 — Second `vercel --prod` without re-asking
- Bug: deployed `eb0ea01` after user only authorized `79f4ccc`
- Root cause: treated "session has deploy authorization" as rolling
- Rule added: every `vercel --prod` needs explicit THIS-TURN authorization
- Audit invariant: grep history for multi-deploy patterns
```

V1, V2, ..., V10 catalog grows with you. New sessions read the catalog
and don't repeat old mistakes.

### 4. Continuous improvement

**Every bug → adversarial test + rule file + audit skill invariant.**

Not just a fix. A fix + test + rule + audit. So the same class of bug
can't come back silently.

## vs alternatives

| Tool | Mechanism | Rule drift risk |
|---|---|---|
| [claude-mem](https://github.com/thedotmack/claude-mem) | SQLite + vector DB, AI-summarized | HIGH — summarization loses rule text |
| [GenericAgent](https://github.com/lsdefine/GenericAgent) | 5-layer hierarchy, L1-L4 AI-crystallized | HIGH — lower layers drift |
| [evolver](https://github.com/EvoMap/evolver) | Genes/Capsules, "self-evolution" | HIGH — AI refactors memory |
| **claude-guardrails** | Plain markdown + grep + human review | **ZERO** — no AI compression anywhere |

## Scope: what this IS and ISN'T

**IS:**
- A template repo with examples
- A methodology for writing durable rules
- A violation-catalog format
- Checked-in-repo team enforcement

**ISN'T:**
- A runtime / background worker
- A plugin that auto-executes
- AI-summarized memory
- Framework-specific (works with any stack)

## Success metric

Not stars. Not installs.

**Violations catalogued by users.** If 5+ teams publish their V1..Vn logs
within 6 months, the methodology has value. If 0, it was one team's artifact.

## Status

**v0.1 MVP (2026-04-21)** — templates + docs + 2 audit skill examples.

Roadmap:
- v0.2: `npx claude-guardrails init` one-shot installer
- v0.3: 4+ audit skill examples (security, react-patterns, forms, a11y)
- v1.0: stack-specific example packs (react-firebase, next-supabase, python-django)

## License

MIT. Use, fork, adapt. Publish your own violation catalog — the methodology
is worth more when many teams contribute patterns.

## Origin

Extracted from the rule/audit setup of a production clinic app
(`.claude/rules/` + audit skills + `.agents/` layer + violation catalog V1-V10)
that has caught 10 real regressions across 12 phases of development.
The methodology was worth more than the clinic-specific content — hence
this package.
