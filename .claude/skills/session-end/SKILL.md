---
name: session-end
description: Wrap up the current Claude session in ≤ 5k tokens. Use when user says "end session", "wrap up", or before /clear/compact. Updates .agents/active.md (small Write OK), edits ONE section of SESSION_HANDOFF.md (Edit, NOT Write), creates a checkpoint in .agents/sessions/ ONLY if milestone, emits paste-ready Resume Prompt. Hard cap: 50 lines for active.md, 200 for checkpoint, NEVER rewrite old session blocks.
---

# /session-end — minimal-token version

Wrap session into 3 files in ≤ 5k tokens.

## Hard caps (BLOCKING — exceed = redo)
- `.agents/active.md` ≤ 50 lines (frontmatter + 5-bullet body + next-action)
- `SESSION_HANDOFF.md`: edit ONLY `## Current State` + insert ONE new entry (≤ 30 lines) + replace Resume Prompt block. NEVER edit older session blocks in place. **HARD CAP = keep ≤ 10 `### Session` blocks + ≤ 10 Current State bullets; archive the overflow EVERY turn (COUNT cap, not byte cap).**
- Checkpoint `.agents/sessions/YYYY-MM-DD-<slug>.md` ≤ 200 lines. Long lessons → link to `docs/violation-log.md`.

## Steps

1. **Gather** (1 bash call) — git ONLY, **NEVER run tests**:
   ```
   git log --oneline -5; git status --short
   ```
   - **DO NOT run tests / the full suite here.** Reuse the test count from the
     session's OWN last run (you already ran what was needed this session). If
     nothing ran, write the field as "not re-run this session" — never trigger a
     run just to fill it. Re-running wastes minutes for a field whose answer is
     already known from earlier in the session.

1.5. **📊 Graphify update (AST-only — NOT a test)** — if the project has a
   `graphify-out/`, run `graphify update .` (Windows: `python -m graphify update .`).
   AST-only → no API cost, no LLM call, fast → keeps the graph synced to this
   session's code edits so the NEXT boot reads a fresh graph (🔁 compounding
   loop). This is **NOT a test** — the no-tests directive above does NOT apply.
   Skip if no `graphify-out/`. (Master Flow session-end step — see
   `.claude/rules/00-session-start.md` § 🧭 MASTER FLOW.)

2. **Edit `.agents/active.md`** (Write OK — small file):
   - Frontmatter: updated_at, status, branch, last_commit, tests, deploy_state
   - Body — 4 sections only: `## State` (3 bullets), `## What this session shipped` (≤ 8 bullets, link to checkpoint), `## Next action`, `## Outstanding user-triggered actions`
   - Decisions: 3-6 ONE-LINE items max. Full reasoning → checkpoint.

3. **Update `SESSION_HANDOFF.md`** (Edit, NOT Write):
   - Edit `## Current State` block (deploy state, last commit, tests)
   - Insert new `### Session YYYY-MM-DD ...` block above prior entry (≤ 30 lines, link to checkpoint)
   - Edit `## Resume Prompt` code block in place
   - DO NOT edit older session blocks in place, archive blocks, or footer.
   - **TRIM (every turn, count-based):** after inserting today's block + bullet, run `node .claude/scripts/trim-session-handoff.mjs` (idempotent — keeps the newest 10 `### Session` blocks + 10 Current State bullets, moves the overflow to `.agents/sessions/session-handoff-archive.md`, no-op when already ≤10+10). No script in the repo yet? Copy it from the template (`.claude/scripts/trim-session-handoff.mjs`) or trim by hand: count blocks + bullets, move the oldest overflow to the archive (newest batch on top), keep the footer pointer. Detail lives in checkpoints + `docs/violation-log.md` → trimming loses nothing.

4. **Checkpoint** (only if milestone: feature shipped, phase closed, V-entry logged):
   - `.agents/sessions/YYYY-MM-DD-<short-slug>.md` ≤ 200 lines
   - Sections: Summary (1-3 sentences), Current State (5 bullets), Commits (code block), Files Touched (names only, no diffs), Decisions (1-line each — full reasoning to `docs/violation-log.md`), Next Todo, Resume Prompt
   - NO code blocks > 10 lines. Patterns belong in `docs/violation-log.md`.

5. **Commit + push** (1 bash call):
   ```
   git add .agents/active.md SESSION_HANDOFF.md .agents/sessions/*.md && \
   git commit -m "docs(agents): EOD YYYY-MM-DD <one-line>" && \
   git push origin {branch}
   ```

6. **Emit Resume Prompt** in ONE message ≤ 30 lines. The Resume Prompt MUST be emitted INSIDE a fenced code block (triple-backtick fence with language `text`) so the chat UI renders a one-click **copy button**. Emit the fence verbatim as a top-level code block — do NOT flatten it to plain prose, quotes, or `---` separators (those kill the copy button):
   ```text
   Resume {project} — continue from {date} EOD.

   Read in order BEFORE any tool call:
   1. CLAUDE.md
   2. SESSION_HANDOFF.md (master={sha}, prod={sha})
   3. .agents/active.md ({N} tests)
   4. .claude/rules/00-session-start.md (iron-clad A-H + V-summary)
   5. (if milestone) .agents/sessions/<slug>.md

   Status: master={sha}, {N} tests pass, {deploy state}
   Next: {one specific action OR "idle"}
   Outstanding (user-triggered): {1-3 bullets}
   Rules: no deploy without explicit "deploy" THIS turn; every bug → test + rule + audit invariant (Rule D)
   /session-start
   ```

## Anti-patterns (BLOCKING)

- **NEVER run tests during session-end** — no test run, ESPECIALLY not the full suite. The session already ran what it needed; re-running wastes minutes. The `tests:` field REUSES the last known result — it is NOT a reason to run anything.
- NEVER `Write` a full handoff/active when `Edit` of one section suffices.
- NEVER duplicate V-entry detail in active.md AND checkpoint AND handoff — pick ONE (checkpoint), link from others.
- NEVER EDIT older session blocks in place — they're frozen. (Frozen ≠ never-archived: overflow beyond the newest 10 IS moved to the archive every turn — that's trimming, not rewriting.)
- NEVER let `SESSION_HANDOFF.md` exceed 10 session blocks / 10 Current State bullets — trim the overflow to the archive EVERY turn (COUNT cap, not byte cap). A byte cap lets the file bloat to tens of thousands of boot tokens while still "under" the size trigger.
- NEVER dump full V-entry body into commit message — link to `docs/violation-log.md`.
- NEVER include code blocks > 10 lines in active.md / handoff. Code lives in src/ + tests.

## Success

Total tokens ≤ 5k. Tomorrow's chat reading `.agents/active.md` knows: branch + commit + tests + deploy state + next action in ≤ 50 lines. Resume Prompt fits one message AND is emitted inside a fenced ```text code block (one-click copy button).
