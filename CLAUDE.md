# {Project Name} — Claude Master Index

> **Every new Claude session reads THIS FILE FIRST.** Keep it under 100
> lines. Link out to details — don't inline.

---

## 🔥 Rules — READ BEFORE ANY CODE

**⭐ MANDATORY FIRST READ**: [`.claude/rules/00-session-start.md`](.claude/rules/00-session-start.md)
— character, expectations, iron-clad rules A-H, past violations V1-Vn,
tool/skill decision tree, pre-commit checklist.

| File | When to load |
|---|---|
| [`00-session-start.md`](.claude/rules/00-session-start.md) | Every session start (single-source summary) |
| [`01-iron-clad.md`](.claude/rules/01-iron-clad.md) | Every turn (iron-clad rules A-H) |
| [`02-workflow.md`](.claude/rules/02-workflow.md) | Before any commit / deploy / test |
| [`03-stack.md`](.claude/rules/03-stack.md) | When editing {stack-specific paths} |
| [`04-culture.md`](.claude/rules/04-culture.md) | When writing UI / copy / color / dates |

**Iron-clad summary (short form — full detail in rule files):**
- **A. Bug-Blast Revert** — break = revert, never patch forward
- **B. [YOUR-DEPLOY-SAFETY-RULE]** — e.g. "probe before + after rule deploys"
- **C. Anti-Vibe-Code** — Rule of 3, crypto tokens, security by default, lean schema
- **D. Continuous Improvement** — bug → test + rule + audit invariant
- **E. [YOUR-DATA-BOUNDARY-RULE]** — e.g. "backend reads our DB only"
- **F. Triangle Rule** — 3 sources before replicating external features
- **G. Dynamic Capability Expansion** — load tools/skills as needed, rules still apply
- **G.2. Promotion Trigger** — same manual pattern ≥ 3 times → promote to skill (see `/capability-scout`)
- **H. [YOUR-DATA-OWNERSHIP-RULE]** — e.g. "our data canonical, external = seed only"

---

## 🗂️ Docs Index — read on demand

| Need | File |
|---|---|
| System overview, data model, flows | `docs/ARCH.md` |
| How to write rules that don't drift | `docs/methodology.md` |
| Cross-session continuity protocol | `docs/cross-session.md` |
| Violation log format + examples | `docs/violation-log.md` |
| Triangle Rule usage | `docs/triangle-rule.md` |
| Continuous Improvement cycle | `docs/continuous-improvement.md` |
| Capability expansion (Rule G + G.2) | `docs/capability-expansion.md` |
| Feedback loop (project → guardrails) | `docs/feedback-loop.md` |
| {Your project-specific docs} | `docs/{...}` |

---

## 📁 Code Layout (high-level)

```
{project-name}/
├── CLAUDE.md                 — (this file) — quick index
├── SESSION_HANDOFF.md        — cross-session state
├── .claude/
│   ├── rules/                — 5 rule files (00-04)
│   ├── skills/               — audit skills (/audit-*)
│   └── hooks/                — PreCommit / PostToolUse hooks
├── .agents/
│   ├── AGENTS.md             — trust priority + handoff protocol
│   ├── active.md             — hot state
│   └── sessions/             — session checkpoints
├── docs/                     — methodology + project docs
├── src/                      — {your source}
├── api/                      — {your serverless / backend}
└── tests/                    — {your tests}
```

---

## 🔑 Env / Config

- **Project name**: `{name}`
- **Stack**: `{e.g. React + Vite + Firebase}`
- **Primary deploy target**: `{e.g. Vercel, Fly.io, own infra}`
- **Production URL**: `{if applicable}`
- **Test runner**: `{e.g. Vitest, Jest, pytest}`
- **Build command**: `{npm run build}`
- **Test command**: `{npm test -- --run}`
- **Deploy command**: `{e.g. vercel --prod}` (requires explicit user auth)

---

## 🧪 Testing Baseline

- Unit test count: `{N passing}`
- Integration: `{N passing}` — note known limitations if any
- E2E: `{N passing}`
- Run: `{test command}`

---

## 📋 Onboarding — New Claude Session Checklist

**READ IN ORDER** (blocks any tool calls until done):

1. **This file (CLAUDE.md)** — stack + env + rule index
2. **[`SESSION_HANDOFF.md`](SESSION_HANDOFF.md)** — cross-session state of truth
3. **[`.agents/active.md`](.agents/active.md)** — hot state
4. **[`.claude/rules/00-session-start.md`](.claude/rules/00-session-start.md)** — iron-clad summary
5. (Conditional) most recent `.agents/sessions/*.md` — if resuming from yesterday
6. (Conditional) specific rule files `01-04` — if the task touches their area

After reading, the session should have:
- Clear understanding of iron-clad rules
- Awareness of current focus + blockers
- Concrete next action from SESSION_HANDOFF.md
- Context to write code that doesn't violate any past V-entry

**If any mandatory file is missing**: STOP, ask the user, DO NOT invent context.

---

## 🚨 Common Pitfalls (one-line reminders)

- Don't deploy without explicit "deploy" authorization THIS turn (rule 02)
- Grep-pair every router Edit (case ↔ handler count must match)
- Use `crypto.getRandomValues` for tokens, never `Math.random`
- `new Date().toISOString().slice(0,10)` is UTC — use project timezone helper
- Every bug → test + rule + audit invariant (Rule D — don't just-fix)
