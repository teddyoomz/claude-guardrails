# Session Handoff — Cross-Session State of Truth

> **This file is read FIRST every new session.** Update it every turn that
> changes state. Keep it short — link to `.agents/sessions/*` for detail.

---

## 📏 HARD CAP: 10 sessions (COUNT cap, not byte cap)

This file carries **at most the last 10 `### Session ...` blocks + the last 10
`## Current State` one-line bullets** — ALWAYS. `/session-end` MUST trim EVERY
turn (not "when it gets big"):

1. After inserting today's block + bullet, count the `### Session` blocks and the
   Current State one-line bullets.
2. If either is > 10, move the OLDEST overflow into
   `.agents/sessions/session-handoff-archive.md` (prepend a `## Archived <date>`
   batch at the TOP — newest archived first), delete it here, keep a footer pointer.
3. Canonical trimmer: `node .claude/scripts/trim-session-handoff.mjs` (idempotent).

**Why a COUNT cap, not a byte cap:** a size trigger (e.g. "archive when > 180 KB")
lets the file silently accumulate dozens of session blocks — tens of thousands of
boot tokens — while still sitting *under* the trigger. Every session then pays that
token cost at boot for nothing. A count cap (10+10) keeps the file small forever.
Per-session detail lives in `.agents/sessions/*.md` checkpoints + `docs/violation-log.md`,
so trimming loses nothing. (See V-starter-16 in `docs/starter-violations.md`.)

---

## Current State

- **Date last updated**: YYYY-MM-DD
- **Branch**: `main` (or your active branch)
- **Last commit**: `{SHA}` — one-line summary
- **Test count**: {N passing / M total}
- **Build**: {clean | failing — with reason}
- **Deploy state**: {url + last-deploy-date, or "not-deployed"}
- **Production URL**: {if applicable}

---

## What's Done (this phase)

Short bullet list of completed milestones. Link to checkpoints for detail.

- ✅ **{Feature / milestone}** — shipped {date}, commit `{SHA}`
  (→ `.agents/sessions/YYYY-MM-DD-slug.md`)
- ✅ ...

---

## What's Next

One concrete next action the new session should take. Include:

- **File / area to touch**: `path/to/file.ext`
- **What to do**: "Add X", "Fix Y", "Refactor Z"
- **Why**: business reason / bug being fixed
- **Success criteria**: tests pass + specific assertion

Example:

> **Next: Phase 13.1 Quotations.** Start with validator at
> `src/lib/quotationValidation.js`. Triangle artifacts already captured
> in `docs/external-scan/quotation-*.json`. After validator + tests pass,
> add CRUD in `backendClient.js` + `QuotationTab.jsx` UI. Estimated 4h,
> +40 tests, Medium risk.

---

## Outstanding User Actions (NOT auto-run)

Things only the user can do — do NOT attempt in a session without
explicit authorization:

- [ ] Deploy to production (`{deploy command}` — requires explicit "deploy"
      authorization each time per rule 02)
- [ ] Set new env vars: `{KEY_1}`, `{KEY_2}`
- [ ] Run database migration: `{migration-id}` on production
- [ ] Rotate compromised secrets: `{which}` (last rotation: YYYY-MM-DD)

---

## Blockers

Anything that prevents the next session from proceeding:

- 🔴 **{Blocker}** — {what's broken}. Resolution: {what needs to happen}.
- 🟠 **{Soft blocker}** — {workaround exists}. Details: {...}

If none: write "None. Ready to proceed."

---

## Known Limitations / Technical Debt

Short list of known imperfect code that's intentional-for-now:

- **{Component}** — {what's imperfect}. Planned fix in {phase X}.
- ...

---

## Violations This Session (if any)

If we broke an iron-clad rule this session, log it here briefly + reference
the full V-entry in `.claude/rules/00-session-start.md`.

Format: `### V{N} — YYYY-MM-DD — {short title}`

If none: "No violations this session."

---

## Resume Prompt (paste-ready for next Claude session)

```
Resume {project-name} — continue from commit {SHA}.

Read in order:
1. CLAUDE.md (stack + env)
2. SESSION_HANDOFF.md (this file)
3. .agents/active.md (hot state)
4. .claude/rules/00-session-start.md (character + iron-clad summary)
5. .agents/sessions/YYYY-MM-DD-{slug}.md (last checkpoint detail)

Status: {branch} = {sha}, {N tests passing}, {deploy state}.

Next: {concrete next action — file + line + task}.

Outstanding user-triggered actions (NOT auto-run):
- {list from Outstanding User Actions above}

No deploy this turn unless user explicitly says "deploy".
```

---

## How to use this file

1. The AI auto-updates it at the end of every commit-worthy unit of work
2. Sections that don't apply → delete or write "N/A"
3. Keep this file to the newest **10 sessions + 10 Current State bullets** —
   `/session-end` trims the overflow to `.agents/sessions/session-handoff-archive.md`
   EVERY turn (count cap; see the HARD CAP banner at top). This is a COUNT cap,
   not a byte cap — don't wait for the file to "get big".
4. The Resume Prompt block at the bottom is the KEY output — the user
   pastes it into new Claude sessions to boot context deterministically
