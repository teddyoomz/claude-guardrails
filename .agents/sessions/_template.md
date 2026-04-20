# YYYY-MM-DD · {short title of what was done}

## Summary

1-3 sentences. What shipped this session, what it enables, what's next.

## Current State

- **Branch**: {name}
- **Last commit**: `{SHA}` — one-line
- **Test count**: {N pass / M total}
- **Build**: {clean | failing}
- **Deploy status**: {not-deployed | deployed YYYY-MM-DD to {url}}

## Decisions

Non-obvious decisions made this session, with reasoning. Decisions that
might be questioned later deserve a paragraph each.

1. **{Decision}** — {what you decided}. Reason: {why}. Alternatives considered: {...}.
2. **{Decision}** — ...

## Blockers

List anything that blocks next session from proceeding. If none, "None.".

## Files Touched

Brief list, not full git diff. Example:
- `src/lib/quotationValidation.js` (new) — validator + normalizer
- `src/lib/backendClient.js` (modified) — added CRUD for be_quotations
- `src/components/backend/QuotationTab.jsx` (new) — list + filter UI

## Commands Run

Copy-pasteable record of key commands this session:

```bash
npm test -- --run               # 2850 → 2865 tests passing
npm run build                    # clean
git commit -m "..."
git push origin master
```

## Commit List (this session)

```
{sha1} {short message}
{sha2} {short message}
...
```

## Next Todo (ranked by risk vs value)

1. **{Next task}** — {why it's first}
2. **{Followup}** — {dependency}
...

## Resume Prompt

Paste-ready block for the next session:

```
Resume from session YYYY-MM-DD — {one-line summary of this session}.

Read in order:
1. CLAUDE.md
2. SESSION_HANDOFF.md
3. .agents/active.md
4. .agents/sessions/YYYY-MM-DD-{slug}.md (THIS file, for full context)
5. .claude/rules/00-session-start.md

Status: {branch} = {sha}, {N tests passing}, {deploy state}.

Next: {concrete next action — file + line + task}.

Triangle artifacts (if applicable):
- docs/external-scan/xxx.json

Outstanding user-triggered actions (NOT auto-run):
- {list any pending user actions — "deploy", "approve migration", etc.}

No deploy this turn unless user explicitly says "deploy".
```

---

## How to use this template

1. Copy this file → `YYYY-MM-DD-<slug>.md` at end of each significant session
2. `<slug>` = short noun phrase (e.g. `phase-11-product-groups-fix`)
3. Fill in every section — don't leave placeholders
4. Link from `active.md` → this file for detail reference
5. Resume prompt is the KEY output — the user pastes it into next chat
