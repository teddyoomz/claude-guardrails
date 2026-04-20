# Triangle Rule — 3-Source Verification

Before and DURING every feature, verify against 3 independent sources.
**Gap in any one = drift = bug.**

This rule applies to ANY project — not just ones that replicate external
systems. The three sources adapt to your context. See "Universal form"
below.

---

## Universal form (applies to all projects)

| Source | What it is | Examples |
|---|---|---|
| **1. Evidence** | The ground truth for what you're building | User's words in this chat, profiler output, error log, product spec, API response, screenshot of real system |
| **2. Intention** | The plan for THIS specific feature | Phase plan docs, design doc / ADR, wireframe, ticket description, team decision |
| **3. Existing code** | What your codebase already has | Existing helpers (grep), existing API patterns, existing validators, existing UI components |

**Any gap = drift = bug:**
- Evidence ≠ intention → "building the wrong thing" — the plan diverged from requirements
- Intention ≠ code → "drifted from plan" — implementation took shortcuts not in spec
- Code ≠ evidence → "wrong implementation" — code doesn't match what was asked

**Why this works for ANY project:**

- **Greenfield app** → evidence = user requirement, intention = your design, code = existing shared utils
- **Replication feature** → evidence = scraped external system, intention = your plan, code = existing patterns
- **Bug fix** → evidence = error + repro steps, intention = correct behavior spec, code = existing unit tests
- **Performance optimization** → evidence = profiler data, intention = the optimization plan, code = current implementation
- **API design** → evidence = what callers need (client code), intention = the endpoint spec, code = existing REST patterns

---

## The three sources (replication variant — the original)

For projects that replicate external behavior:

1. **External reference** — the real system you're replicating
   - API docs + live API inspection
   - Third-party SDK source code
   - Scraped HTML + network tab for web-based targets
   - Captured example requests/responses
   - Screenshot + DOM inspection of the UI you're mimicking

2. **Plan** — your project's intent
   - Phase plan documents
   - Design doc / spec
   - Previous decision log / ADRs
   - Conversation history with stakeholders

3. **Existing code** — your own codebase
   - Grep for existing helpers (Rule of 3)
   - Check for existing validators, API clients, UI patterns
   - Read any previously-implemented similar feature

## Why 3 and not 2

Two sources can agree while both being wrong.

Examples:
- External docs say field is `user_id`, but live API returns `userId`. Just
  reading docs → wrong.
- Plan says "copy the login flow from feature A", but feature A was
  refactored last week and plan wasn't updated. Just reading plan → wrong.
- Existing code has a `parseUser` helper, but it was written for a
  different API version. Just reading code → wrong.

Triangulating all three: you see the disagreement + ask.

## How to apply the rule

### Step 1: Before writing any code for a replication feature

- [ ] Capture the external behavior (whatever tooling applies to your target)
- [ ] Read the plan / spec for THIS specific feature
- [ ] Grep your codebase for any existing helper you should reuse

If all three agree: proceed.

If two agree and one disagrees: investigate the one that's out-of-band
before writing code.

If none agree: stop, ask user / team for clarification.

### Step 2: During implementation

When you find yourself guessing a field name, API path, or response shape,
**stop**. You're in an unverified zone. Go back to the external source and
capture the actual behavior.

AI will happily generate plausible-looking but wrong code. The guess
feels fine — it passes type check, your test happens to pass because your
mock matches the guess. It fails in production.

### Step 3: Commit the artifacts

Save the external-source artifacts in your repo:

```
docs/external-scan/
├── feature-X-list-phase11_9.json
├── feature-X-create-form-phase11_9.json
├── feature-X-api-response-phase11_9.json
```

Now the artifact is permanent. Next developer (or next Claude session)
sees exactly what you verified against. No re-capture needed.

### Step 4: Reference artifacts in commits

Commit message: `feat(feature-X): add CRUD — Triangle verified via
docs/external-scan/feature-X-*.json`

This ties the code back to the evidence. If later the external system
changes and something breaks, you can compare current behavior against
the captured artifact.

## Tooling for each side of the triangle

### External reference

The tool depends on your target:

- **Web UI replication**: custom scraper / Puppeteer scripts that capture
  page structure + form fields + API calls
- **API replication**: curl / httpie / Postman collections saved to repo
- **SDK replication**: read the source in node_modules/ + note version pinned
- **Database schema replication**: `pg_dump --schema-only` / equivalent

Save output as JSON/MD in `docs/external-scan/` or similar.

### Plan

Depends on your team's process:

- Simple project: `docs/phase{N}-plan.md` written before implementation
- Complex project: ADRs in `docs/decisions/`
- Remote team: Linear/Jira tickets — link from commit

### Existing code

- `Grep` tool (built into Claude Code)
- Or command-line `grep -rn`
- Before writing ANY new helper: grep for name + synonyms

## Anti-patterns (Triangle Rule violations)

### V-example 1: "URL edit with guessed PATCH pattern"

> Session wrote `handleUpdate` using `/admin/promotion/{id}/edit` +
> `_method=PUT`. Never tested against real external → production 404 because
> the real edit URL was different.
>
> Root cause: skipped Step 1 — didn't capture the actual edit URL before
> implementing.
>
> Fix: retroactive capture via scraper, found correct URL, rewrote handler.
> Rule: every new POST/PATCH URL requires an external-scan artifact
> committed BEFORE the handler code.

### V-example 2: "Assumed field name from English translation"

> External API returned product.`productName`, but our validator expected
> `product_name`. Caused silent nulls in production — field was there in
> ProClinic response as `product_name`, scraper converted to `productName`,
> mapper looked for `product_name` → null.
>
> Root cause: didn't verify the scraper's output shape against live data.
>
> Fix: added shape-assertion in scraper tests; rule: scrapers commit a
> sample response to docs/ so mappers can reference canonical shape.

### V-example 3: "Invented API endpoint that doesn't exist"

> Replicating a feature, assumed the PATCH endpoint was
> `/admin/api/product-group/{id}`. Real API: no such endpoint, use POST with
> `_method=PUT` and form data.
>
> Root cause: didn't probe the endpoint with curl before coding.
>
> Fix: every new endpoint reference must be curl-verified + saved to
> docs/external-scan/.

## When to re-scan (the Triangle Rule is not one-time)

The Triangle Rule applies on FIRST build. It also applies on EXTENSION.
Re-scan triggers:

| Trigger | Why re-scan |
|---|---|
| Adding a field / option to a previously-built feature | The external system may have changed; your original scan may have been partial |
| User reports "it doesn't match the real thing" | Drift has already happened — stop, re-capture, compare |
| External system version bump (API v3 → v4, etc.) | Schema changes are likely; old artifacts are stale |
| ≥ 6 months since last scan on a live feature | Slow drift — quarterly rescan on any feature still under active development |

**Anti-example (V10 in one project):** Phase 11.2 shipped a product-group
schema with 4 type options. ProClinic has exactly 2. The original Triangle
scan was incomplete (the create-form artifact was captured, but the type
options were not inspected). When Phase 11.9 extended the feature, a full
re-scan caught the mismatch. Fix: always capture option lists + enums
explicitly, not just field names.

**Rule:** when extending a previously-built feature, treat it like a new
feature for the Triangle Rule. The original scan may be months old.

---

## Field-completeness during external-source capture

When capturing external source data (API response, form fields, scraper
output), **preserve every field** the downstream mapper will read.
Truncating at capture = silent null in UI without error.

**Pattern (wrong):**
```js
// Normalizer captures only the fields you think you need
function normalizeProduct(raw) {
  return {
    id: raw.id,
    name: raw.product_name,
    price: raw.price,
  };
}
// Later: mapper needs raw.product_label — it's null, no error thrown
```

**Pattern (right):**
```js
// Normalizer spreads all fields, then selectively renames/normalizes
function normalizeProduct(raw) {
  return {
    ...raw,                          // preserve everything
    name: raw.product_name,          // rename canonical fields
    label: raw.product_label ?? '',  // explicit fallback only when safe
    price: Number(raw.price) || 0,
  };
}
```

**Audit checklist for sync normalizers:**
```bash
# For each normalizer, what fields does the downstream mapper use?
grep -rn "\.productLabel\|\.product_label\|\.label" src/lib/mappers.js
# Cross-check: does the normalizer output those keys?
grep -n "productLabel\|product_label\|label" src/lib/normalizers.js
```

If mapper reads a key that normalizer doesn't write → silent null.
Add it to the normalizer AND add it to the external-scan capture step
so the artifact proves the field exists in source.

**Why this is a Triangle Rule issue:** if your capture tool only shows
field names (not values), you can't verify shape. Always capture a
sample response with real data, not just schema.

---

## How to grow this rule

Every time a bug traces back to "we didn't verify against X", add:

1. What wasn't verified (the specific source)
2. What went wrong (the bug)
3. How to prevent (the new checklist item)

The Triangle Rule is simple in principle but easy to skip when you're in
a hurry. The V-entries make it harder to skip — because "I'll just guess"
has documented consequences.
