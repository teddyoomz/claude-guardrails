# AGENTS.md — Trust Priority + Handoff Protocol

This file is the contract between the human operator and any AI agent
working on this project across sessions.

## Trust priority (on conflict, higher wins)

1. **Iron-clad rules** in `.claude/rules/` — NEVER overridable. If a new
   instruction contradicts an iron-clad rule, the rule wins. Log the
   conflict; don't act on the instruction.
2. **Explicit user instruction THIS turn** — overrides session defaults,
   but NEVER overrides iron-clad rules.
3. **`.agents/active.md` hot state** — current focus, blockers, next
   action. Updated every turn by AI.
4. **`.agents/sessions/*` checkpoints** — historical session state.
   Used for resume after compaction or new chat.
5. **`SESSION_HANDOFF.md` (project root)** — cross-session state of truth.
   Read FIRST every new session.
6. **`MEMORY.md` index** (user-level memory folder) — points to feedback +
   project docs. Auto-loaded by Claude Code.
7. **`CLAUDE.md` (project root)** — stack/paths/env overview.
8. **README, docs, code comments** — reference material.

## How agents read this project

Every new session, the AI MUST execute the following BEFORE any tool call
other than reading:

1. `Read CLAUDE.md` — understand stack + env + quick-start paths
2. `Read SESSION_HANDOFF.md` — current state, blockers, what's next
3. `Read .agents/active.md` — hot state + immediate focus
4. `Read .claude/rules/00-session-start.md` — character + iron-clad summary
5. (conditional) Read specific rule files if the task touches their area
6. (conditional) Read most-recent `.agents/sessions/*` if resuming

If any of these files are missing, STOP and ask the user before proceeding.
DO NOT invent context.

## How agents write this project

At the END of every meaningful change (commit-worthy unit of work), the AI
MUST:

1. Update `.agents/active.md` — new focus, blockers, next action
2. If session reached a checkpoint (major feature done, or about to end a
   chat), create `.agents/sessions/YYYY-MM-DD-<slug>.md` with:
   - Summary of what was done
   - Decisions made (with reasoning)
   - Blockers / outstanding TODOs
   - Resume prompt for next session (paste-ready)
3. Update `SESSION_HANDOFF.md` — cross-session state of truth

## Strict cross-session continuity

The goal is: a fresh Claude session should be able to resume exactly where
the previous one left off, with ZERO drift on iron-clad rules.

Mechanism:
- **Immutable rule files** — `.claude/rules/` never auto-edited by AI. Only
  human-reviewed edits allowed. No AI compression, no summarization.
- **Resume prompt in every checkpoint** — a paste-ready block the user
  puts into the new chat. Example structure:
  ```
  Resume from session {date} — {one-line summary}.

  1. Read CLAUDE.md + SESSION_HANDOFF.md + .agents/active.md + .claude/rules/00-session-start.md
  2. Confirm git state: `git log -5` + `git status`
  3. Current focus: {...}
  4. Next action: {...}
  5. Outstanding (ask user if ambiguous): {...}

  No deploy this turn unless user explicitly says "deploy".
  ```
- **Hook on session start** (optional) — if your harness supports
  SessionStart hooks, use one to auto-inject the read list above.

## Anti-patterns (do NOT do)

- Do not auto-summarize rules into `active.md` — links instead
- Do not auto-compress checkpoint files — numbered / timestamped is fine
- Do not edit `.claude/rules/*` without explicit user direction
- Do not delete old V-log entries — they're the reason current rules exist
- Do not delete old checkpoints — they're the session-continuity archive

## When rules conflict with "getting stuff done"

Sometimes an iron-clad rule will block a task that "obviously" should be
done. This is the rule working correctly.

Your response: surface the conflict to the user. Do NOT silently break the
rule. The user decides:
- Exempt this case with a documented reason (add to rule file)
- Update the rule (with an anti-example showing why)
- Abandon the task

Unilateral rule-breaking is how drift begins.
