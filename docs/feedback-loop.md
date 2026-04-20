# Feedback Loop — Bidirectional Learning Between Projects and claude-guardrails

**The problem:** every project that uses claude-guardrails learns things.
Better rule formulations. New anti-patterns. Bugs that motivated new
invariants. Without a mechanism to capture these, each project is a
closed loop and the template never improves.

**The solution:** a per-project **bridge file** that accumulates
generalizable insights and periodically batch-ports them back to
claude-guardrails.

---

## Setup (once per project)

Create a bridge file in your project's persistent memory:

```
~/.claude/projects/{project-slug}/memory/project_claude_guardrails_feedback.md
```

Or check it into your repo if you want it team-visible:

```
docs/guardrails-feedback.md
```

Copy the template at the bottom of this file. Fill in the header.

---

## When to add an entry

Add to the bridge file when:

| Trigger | Example |
|---|---|
| New iron-clad rule added to your `.claude/rules/01-iron-clad.md` | "Rule H: all master data in OUR DB" |
| New audit skill created that could help any project | "audit-react-patterns RP1-RP10" |
| New V-entry that reveals a GENERALIZABLE bug class | "V9: probe list missed a new unauth-write endpoint" |
| New workflow pattern that would help any Claude-assisted project | "scope-expansion mid-turn: capture immediately" |
| Triangle Rule refinement that applies to any external-replication | "re-scan on feature extension, not just initial build" |
| Improvement to cross-session continuity protocol | "SessionStart hook prevents cold-start drift" |

**Do NOT add** project-specific entries:
- Stack-specific gotchas (Firebase / Next.js / Python-specific) — stay
  in `03-stack.md`, project-local
- Domain rules (clinic culture, PDPA, Thai dates) — stay in
  `04-culture.md`, project-local
- Stack-specific commands (your specific test + build + deploy commands)
  — stay in `02-workflow.md`, project-local

---

## Entry format

```markdown
## {YYYY-MM-DD} — {Short title}

**Source**: {commit SHA} / {V-entry Vn} / {file:line}
**Pattern**: {generic description — what applies to other projects}
**Current project form**: {quote or link}
**Port target in claude-guardrails**: {which file + what change}
**Priority**: {high | medium | low}
**Status**: pending
```

Mark status `ported YYYY-MM-DD to commit X` when done.

---

## When to batch-port

**Trigger**: ≥ 5 pending entries, OR starting a new project with
claude-guardrails and wanting the latest learnings pre-loaded.

**Process:**
1. Review pending entries — deduplicate, cluster by target file
2. For each target file in claude-guardrails, draft the edit
3. Commit to claude-guardrails: `feat(docs|rules|skills): incorporate
   {project-name} insights {N}-{M} — {short summary}`
4. Move entries from "Pending" to "Ported" with commit SHA
5. (Optional) share the commit upstream if the repo is public

---

## The "God Brain" principle

The long-term value: **claude-guardrails compounds every generalizable
learning across every project that uses it.** Project 1 contributes 10
learnings. Project 2 adds 8 more. By project 5, the template contains
40+ distilled, real-bug-motivated insights — each greppable, each with
an anti-example, each human-reviewed.

This is the opposite of AI-compressed memory. It is slow, manual, and
high-fidelity. It takes multiple projects to see compounding value.
Each subsequent project starts with all prior learnings pre-loaded.

**The key discipline**: every session, ask "did I learn something
generalizable today?" If yes, add it to the bridge file before `/session-end`.
5 minutes now = 30 minutes saved in every future project.

---

## Does claude-guardrails have the feedback system? Answering the question.

claude-guardrails itself does NOT maintain a feedback file — it is a
static template repo. The feedback system lives in **your project**
(via the bridge file above). claude-guardrails only receives the
already-distilled output when you batch-port.

The flow is:
```
Your project session
   ↓ (learn something generalizable)
Bridge file (per-project, persists across sessions)
   ↓ (≥5 entries OR new project starting)
Batch-port to claude-guardrails
   ↓ (commit to main/your fork)
claude-guardrails template updated
   ↓ (next project installs fresh template)
Next project inherits all learnings
```

**Guardrails does not auto-pull.** You push. This is intentional —
AI-automated feedback loops drift because they summarize. Human-curated
batch-ports don't.

---

## Bridge file template

Copy this to start your bridge file:

```markdown
---
title: claude-guardrails feedback — {your project name}
status: active — update after every session that yields a generalizable insight
target_repo: {path to your claude-guardrails clone}
---
# claude-guardrails Feedback Loop

## How to use
See docs/feedback-loop.md in the claude-guardrails repo.
Short form: add entries below when you learn something that would help
any Claude-assisted project. Batch-port when ≥ 5 pending.

## Pending entries (awaiting batch-port)

_(add here)_

## Ported entries

_(empty at start)_

## Batch-port checklist

1. Review pending — deduplicate, cluster by target file
2. Edit files in {path to claude-guardrails}
3. Commit: feat(scope): incorporate {project} insights N to M
4. Move pending → ported with commit SHA
5. (Optional) push to GitHub if repo is shared
```

---

## How this doc should grow

Add new triggers or anti-patterns here when experience shows they're
missing. For example:
- "Add entry when a new hook type prevents a class of drift" — if hooks
  turn out to be a major learning source
- "Skip entries about UI library specifics — too shallow to generalize"
  — if certain entries keep being low-value

This doc is itself subject to the same Rule D principle: when the
feedback loop fails (e.g. entries sit pending for 6 months), add an
invariant here explaining why and how to prevent the stall.
