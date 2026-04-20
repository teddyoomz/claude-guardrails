---
name: audit-rule-of-3
description: Grep the codebase for duplicated helpers, constants, or patterns that violate the Rule of 3 — "pattern in 3+ places → extract shared". AI-assisted development commonly re-invents helpers because the agent forgets the shared lib exists. This skill catches that.
---

# /audit-rule-of-3

Check every project for unnecessary duplication. The Rule of 3: **if a
pattern appears 3+ times, extract to a shared module**. Two copies are OK
(may be intentional). Three is a bug waiting to diverge.

## R1 — Duplicate function definitions

Find functions defined in multiple files that should be shared:

```bash
# Extract all function names + their file locations
grep -rnE "^export (async )?function [a-z][a-zA-Z]+\(" src/ \
  | awk -F: '{split($3,a," "); print a[3]" "$1":"$2}' \
  | sort | uniq -c | sort -rn | awk '$1 >= 2'
```

Report each function appearing 2+ times. Manual decision: extract or keep
distinct.

## R2 — Duplicate constants (magic values that drift)

Constants defined inline in multiple files instead of in `constants.{ts,js}`:

```bash
# Session timeouts, rate limits, percentages, etc.
grep -rnE "const SESSION_TIMEOUT|const MAX_\w+|const DEFAULT_\w+" src/ \
  | awk -F: '{print $3}' | sort | uniq -c | awk '$1 >= 2'
```

**Fix:** move to `src/constants.js` with named exports. Import from there.

## R3 — Duplicate regex patterns

Regex is error-prone and divergent copies accumulate bugs:

```bash
grep -rnE "/\\[\\^]?[a-zA-Z0-9]+\\+/|new RegExp" src/ \
  | grep -v "tests/" \
  | awk -F: '{print $3}' | sort | uniq -c | awk '$1 >= 2'
```

**Fix:** centralize in `src/lib/regexPatterns.js`.

## R4 — Duplicate React component patterns

Common drift: `Modal` chrome code copy-pasted across 4 modal files instead
of extracted to `ModalShell`:

```bash
# Look for repeated backdrop / ESC-handler / close-button patterns
for f in src/components/*FormModal.{jsx,tsx}; do
  echo "=== $f ==="
  grep -c "role=\"dialog\"" "$f"
  grep -c "onKeyDown.*Escape" "$f"
  grep -c "z-\[9" "$f"  # z-index
done
```

If 3+ modals have the same backdrop code, extract `ModalShell` / `FormShell`.

## R5 — Duplicate API handler shapes

Every `case 'actionX':` in a router should delegate to a single pattern. If
each case re-implements error handling, logging, validation differently,
you have drift waiting to diverge further.

```bash
# In router files, check for case-handler pattern consistency
for f in api/**/*.js; do
  # Each "case 'x':" should call handle_x, not inline logic
  grep -A 1 "case '" "$f" | grep -v "handle\|return\|case\|--" | wc -l
done
```

## R6 — Duplicate firestore / DB query patterns

Repeating `collection(db, ...basePath(), 'xxx')` inline in 10 files:

```bash
grep -rnE "collection\(db[^)]*['\"](be_|pc_|master_data)" src/ \
  | awk -F: '{print $3}' | sort | uniq -c | awk '$1 >= 3'
```

**Fix:** centralize as `const xxxCol = () => collection(db, ...)`.

## R7 — Duplicate validator structure

Every `validateX` should follow the same return shape: `[fieldName, errorMsg]
| null`. Drift → callers break.

```bash
for f in src/lib/*Validation.js; do
  # Return types
  echo "=== $f ==="
  grep "return \[" "$f" | head -3
  grep "return null" "$f" | wc -l
done
```

## R8 — Test setup duplicate

Every test file should share a common setup helper. If each test re-declares
the same mock, extract to `tests/setup.js` or `tests/_helpers.js`.

```bash
grep -rn "vi.mock('firebase" tests/ | wc -l
# If N-1 files re-declare the firebase mock, extract.
```

## R9 — Duplicate error message strings

User-facing errors should come from a messages file, not scattered inline:

```bash
# Thai example — adjust language per project
grep -rn "กรุณา\|ไม่พบ\|ผิดพลาด" src/ \
  | awk -F: '{print $3}' | sort | uniq -c | awk '$1 >= 2'
```

**Fix:** `src/lib/messages.js` export + i18n hook.

## R10 — Duplicate import paths

Circular or deep-path imports suggest your barrel/alias setup is broken:

```bash
grep -rn "from ['\"]\\.\\./\\.\\./\\.\\./\\.\\." src/
```

**Fix:** set up path alias in `tsconfig.json` / `vite.config`.

---

## How to run

This skill returns a punch-list. Review each finding manually — not every
"duplicate" should be extracted (sometimes 2 similar-looking functions are
actually semantically different).

**Run frequency:** before every PR merge + monthly scan on whole repo.

**Integration with `/audit-all`:** include this skill in Tier 1 (code
quality). Failure count < 5 = pass; ≥ 5 = force review.

## Report format

```
### /audit-rule-of-3 — Run 2026-MM-DD

🔴 Real duplicates (merge candidates) — 7 findings
[R1] parseQty: src/utils.js:15, src/pages/Foo.jsx:82, src/lib/bar.js:40
[R4] ModalShell pattern in 4 files — extract to <FormShell>
...

🟠 Review manually — 3 findings
[R5] case 'create' inline in 2 routers — decide if pattern
...

🟢 Clean — R3, R7, R8, R9, R10

Summary: 10 findings. 7 are real duplicates. Extract suggested shared lib:
src/lib/sharedUtils.js.
```

---

## Growth

When a new duplication pattern bites the team, add R11, R12, ... with its
grep target. The skill file never shrinks — obsolete invariants become
historical documentation.
