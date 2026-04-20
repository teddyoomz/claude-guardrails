---
updated_at: "YYYY-MM-DD"
status: "{fresh | in-progress | blocked | complete}"
current_focus: "One-sentence summary of what we're working on"
branch: "{current git branch}"
project_type: "{e.g. node + React + Firebase | python + django | go + postgres}"
last_commit: "{short SHA}"
tests: "{N passing / M total}"
production_url: "{if applicable}"
---

# Active Context

## Objective

One paragraph: what the user wants us to ship, by when, with which
constraints.

## Current State

- **Last commit**: `{SHA}` — one-line description
- **Tests**: {N passing}
- **Build**: {clean | failing}
- **Deploy status**: {not-deployed | last deployed YYYY-MM-DD to {url}}
- **Outstanding migrations / env vars / rules changes**: {list or "none"}

## Blockers

{List anything that must be resolved before the next task can proceed.
If none, write "None.".}

## Next Action

The one specific thing the next session should start with. Be concrete:
file path + line number + what to do.

Example:
> Continue `Phase 13.1 Quotations`: write `src/lib/quotationValidation.js`
> validator. Triangle artifacts in `docs/external-scan/quotation-*.json`.
> After validator passes tests, add CRUD in backendClient + QuotationTab UI.

## Recent Decisions

Last 5 non-obvious decisions with reasoning. Example:

- **2026-04-21**: Switched sync from HTML scrape → JSON API for products.
  Reason: HTML scrape mis-coded product_type from wrong cell index.
- **2026-04-20**: Moved DF payout from Phase 11 to Phase 13. Reason:
  DF only makes sense with treatment billing, which lives in Phase 13.

## Notes

Anything else the next session needs to know that doesn't fit above.

---

## How to use this file

- Update every turn that changes focus, blocker, or decision
- Keep it short — link to `.agents/sessions/*` or docs for details
- DO NOT accumulate a long history here — use session checkpoints for that
- The header YAML is for tooling / at-a-glance; body is for human reader
