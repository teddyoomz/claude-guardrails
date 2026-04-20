---
name: audit-anti-vibe-code
description: Audit the three Vibe-Code failure modes — hardcode/duplication (Rule of 3), security slop (leaked tokens / Math.random / world-readable user IDs / open rules), and premature schema (orphan collections, parallel docs that should be denormalized). Run before every release and whenever a commit adds a new collection, rule, or 20+ LOC of form/modal code.
---

# /audit-anti-vibe-code

Grep the codebase for the three classes of vibe-code failure. Each invariant
AV1-AV12 is a specific pattern with a grep target. Reporting is punch-list
format: file:line + what's wrong + suggested fix.

**This skill does NOT auto-fix.** It reports. Humans decide on fixes.

## AV1 — Rule of 3: duplicate helper definitions

If the same logical helper is defined in 3+ places, extract to a shared
module. 2 duplicates are OK (may be intentional). 3+ = bug rooted in AI
forgetting the shared lib exists.

```bash
# Example patterns to grep (customize per project)
grep -rn "function parseQty\|function parseQuantity" src/ | awk -F: '{print $1}' | sort -u | wc -l
# If > 1, flag all files
```

Report format:
```
[AV1] src/utils.js:15, src/pages/Foo.jsx:82, src/lib/bar.js:40
      — 3 definitions of parseQty. Extract to src/lib/quantityUtils.js.
```

## AV2 — Math.random for tokens or IDs

`Math.random().toString(36)` produces ~50 bits of entropy at best with
predictable distribution. **Not cryptographically secure.** For any user-
facing token (URL share link, password reset, access code):

```bash
grep -rn "Math\.random().*toString(36)" src/ api/
grep -rn "Math\.random.*\.slice\|\.substring" src/ api/
```

**Fix:** `crypto.getRandomValues(new Uint8Array(16))` → 128 bits, safe.

## AV3 — Secrets in source files

Source code and commit history are permanent. Any secret committed = must be
rotated + git-filter-branch'd.

```bash
# API keys, tokens, passwords in src/ or api/
grep -rnE "(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][A-Za-z0-9_\-]{20,}" src/ api/
grep -rn "Bearer\s+[A-Za-z0-9]" src/ api/  # hardcoded bearer tokens
```

**Exception:** Firebase config (`firebaseConfig.apiKey`) — public by design,
but Firestore rules must gate actual data access.

**Fix:** move to env vars, add to `.env.example` (never commit `.env`).

## AV4 — User IDs / admin identifiers in world-readable docs

Any doc that's readable by unauthenticated users must not contain UIDs,
staff IDs, or any info that aids targeted attacks.

```bash
# Rough pattern — needs manual review
grep -rn "createdBy\|ownerUid\|staffId" src/lib/*Client.js
# Cross-reference with firestore.rules or equivalent — any read:if true paths?
grep -n "allow read" firestore.rules
```

**Fix:** store IDs internally, expose display-only fields (nickname, role).

## AV5 — Open write rules (`allow: if true`)

```bash
grep -n "allow.*if true" firestore.rules storage.rules *.rules
```

**Exception:** paths that legitimately need unauth writes (webhook receivers,
public forms) — require an inline comment explaining WHY.

**Fix:** either tighten with `isSignedIn()` / custom-claim check, or add
explicit `// DEV-ONLY — remove before prod` comment + add to strip list.

## AV6 — Orphan collections (no reader)

New collection must have at least one reader. A write-only collection
is dead data.

```bash
# For each collection in your schema
for col in $(cat schema-collections.txt); do
  read_count=$(grep -rn "collection.*['\"]$col['\"]" src/ | grep -v "setDoc\|addDoc\|updateDoc" | wc -l)
  if [ "$read_count" -lt 2 ]; then
    echo "[AV6] $col — only $read_count readers, flag for review"
  fi
done
```

**Fix:** either add a reader, or delete the collection + rewrite writer to
put data on a parent doc.

## AV7 — Premature `*_log` / `*_history` collections

Timeseries / audit collections are overused. Unless you have a real reader
(report, export, dashboard), put the entries as an array on the parent doc.

```bash
grep -rn "be_.*_log\|be_.*_history\|.*_audit" src/lib/*.js firestore.rules
```

**Fix:** move to parent doc as `history: [{ts, action, ...}, ...]`.

## AV8 — Missing adversarial tests

Every validator / critical helper must have ≥5 nasty input tests (not just
happy path). Grep for new validator files with suspiciously few tests:

```bash
# For each *Validation.js file, count its test file lines
for f in src/lib/*Validation.js; do
  test=$(echo "$f" | sed 's|src/lib/|tests/|; s|\.js|.test.js|')
  if [ -f "$test" ]; then
    lines=$(wc -l < "$test")
    [ "$lines" -lt 80 ] && echo "[AV8] $test — only $lines lines, likely missing adversarial cases"
  fi
done
```

**Fix:** add boundary tests, bad-type tests, null/undefined tests, duplicate-
input tests.

## AV9 — Silent catch blocks

`try { ... } catch (_) {}` swallows errors and hides bugs. Every catch
should either log, rethrow, or have a comment explaining why ignoring is safe.

```bash
grep -rnE "catch\s*\(\s*(_|e|err|error)\s*\)\s*\{\s*\}" src/ api/
```

**Fix:** `catch (e) { console.error(e); }` at minimum, or add explanatory
comment.

## AV10 — Hardcoded magic numbers in business logic

```bash
# Timeouts, limits, percentages not in a constants file
grep -rnE "\b[0-9]{3,}\s*(\*\s*1000|\*\s*60)" src/ api/  # e.g. session timeouts
grep -rn "0\.07\|0\.10" src/ api/  # VAT, discount — should be named constants
```

**Fix:** move to `src/constants.js` with named export.

## AV11 — `any` / `unknown` types without narrowing

(TypeScript-specific) — if you `as any` or `as unknown`, you've opted out
of type safety. Every such cast should have a comment justifying it.

```bash
grep -rn "as any\|as unknown" src/
```

**Fix:** narrow with type guards, define proper interface, or comment.

## AV12 — Missing `data-field` attributes on form inputs

For apps that use scroll-to-error patterns, inputs need `data-field` for the
scroll target. Grep forms and check:

```bash
# In every *FormModal.jsx, every <input/select/textarea> should have data-field
for f in src/components/*/?*FormModal.jsx; do
  # count inputs vs data-field attrs
  inputs=$(grep -c "<input\|<select\|<textarea" "$f")
  fields=$(grep -c "data-field" "$f")
  [ "$inputs" -gt "$fields" ] && echo "[AV12] $f — $inputs inputs, only $fields data-field attrs"
done
```

**Fix:** add `data-field="fieldName"` to every input that has validation.

---

## How to grow this skill

**New AV invariant is added whenever a new class of vibe-code bug ships.**
Example workflow:

1. Bug found (e.g. "all tokens were predictable because Math.random")
2. Fix + adversarial test added
3. **New AV entry here** with grep pattern
4. Update `/audit-all` to include this skill at the right tier

The skill file stays greppable forever. Numbered invariants never get
reassigned (if AV3 is obsolete, mark deprecated but keep number).

## Report format

```
### /audit-anti-vibe-code — Run 2026-MM-DD

🔴 Critical (AV2, AV3, AV5) — 3 findings
[AV2] src/lib/tokens.js:42 — Math.random for URL token
[AV3] src/config.js:15 — API key committed
[AV5] firestore.rules:23 — allow:if true without justification

🟠 Medium (AV1, AV6, AV7) — 2 findings
[AV1] 3 copies of formatMoney in src/pages/ — extract
[AV6] be_feature_logs has 0 readers — remove

🟢 Clean — AV4, AV8, AV9, AV10, AV11, AV12

Summary: 5 findings, 3 critical. Block release until resolved.
```
