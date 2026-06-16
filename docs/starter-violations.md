---
title: Starter V-log — 20 universal violations to pre-seed your project
audience: projects installing claude-guardrails for the first time
purpose: Rule D (Continuous Improvement) has teeth even on day 1, because the catalog isn't empty.
---

# Starter V-log

When a project first installs claude-guardrails, the V-log in
`.claude/rules/00-session-start.md` is empty. Empty catalogs let AI make
every mistake at least once.

This file pre-seeds **20 violations that happen to almost every project
eventually**. Copy the ones relevant to your stack into your project's
V-log. Each entry is a placeholder — you'll replace the fake
date/commit SHA with your own when the violation actually happens (or
mark it PRE-SHIP if you want to prevent it proactively).

**How to use:**

1. Read through the 15. Identify which apply to your stack.
2. Copy 5-10 into `.claude/rules/00-session-start.md` under "## 2. PAST
   VIOLATIONS".
3. Mark each `PRE-SHIP — no real-world bug yet, seeded from starter
   V-log`. When a real instance happens, update with actual date +
   commit SHA.
4. Delete any that truly don't apply (e.g. V12 Firestore-specific if
   you don't use Firestore).

**Why pre-seed instead of wait:** if you wait for the first bug, you
get hit by it first. Pre-seeding means the AI reads "don't do X"
before it has a chance to do X. The starter entries below come from
patterns so common that "wait and see" is strictly worse.

---

## V-starter-01 — node_modules / build artifacts committed

**What happened**: A commit included `node_modules/`, `dist/`,
`build/`, or similar generated directories. Repo size jumps from MB to
GB. Future clones take forever.

**Root cause**: `.gitignore` missing or a new developer ran `git add .`
without checking.

**Fix**: `git rm -r --cached node_modules dist`, add to `.gitignore`,
commit the `.gitignore`, force everyone to re-clone IF the bad commit
was pushed (otherwise interactive rebase out).

**Class**: "commit hygiene"

**Rule motivated**: C.3 (Anti-Vibe-Code — never add X to repo without
intent). Pre-commit hook: reject commit if `node_modules/` staged.

---

## V-starter-02 — Secret leaked in commit (`.env`, API key, credential)

**What happened**: A `.env` file, `credentials.json`, or a hardcoded
API key made it to a public commit. Anyone who clones sees the secret.

**Root cause**: No pre-commit scan for secret patterns. Or dev did
`git add -A` and forgot the `.env` wasn't ignored.

**Fix**: 1) **rotate the key immediately** (assume compromise — the
commit history is forever), 2) rewrite history with
`git filter-branch` or BFG, 3) force-push, 4) add `.env*` to
`.gitignore`, 5) add a pre-commit hook that greps for secret patterns
(`API_KEY=`, `BEGIN PRIVATE KEY`, etc.).

**Class**: "secret leak"

**Rule motivated**: C.2 (Security by default — secrets never in src/).
Install `.claude/hooks/PreToolUse-secret-scan.sh` (greppable heuristic).

---

## V-starter-03 — Deploy without explicit authorization this turn

**What happened**: User authorized deploy of commit A. 10 minutes
later, agent shipped commit B "because it was clearly better" without
asking. User frustrated.

**Root cause**: Agent treats past authorization as rolling consent.

**Fix**: Every `vercel --prod` / `firebase deploy` / `kubectl apply`
= new explicit ask. Authorization never rolls over, no matter how
"obviously better" the new change is.

**Class**: "authorization creep"

**Rule motivated**: B (Probe-Deploy-Probe), plus workflow rule
"explicit authorization per deploy, never inferred".

---

## V-starter-04 — UTC timezone bug (date shifted 1 day)

**What happened**: `new Date().toISOString().slice(0, 10)` returned
yesterday's date because the user's real timezone is UTC+7 and it's
23:30 local. Reports pulled wrong day.

**Root cause**: Used raw `new Date()` instead of timezone-aware
helper. `toISOString()` is always UTC.

**Fix**: Create a `src/utils/time.ts` (or equivalent) with
`nowInTz(zone)` / `todayIsoInTz(zone)`. Grep-ban raw `toISOString()`
outside the helper module.

**Class**: "implicit TZ"

**Rule motivated**: C (Anti-vibe-code — never use Date directly, always
a wrapped helper with the project's canonical TZ).

---

## V-starter-05 — Math.random for security-sensitive token

**What happened**: A URL-share token generated via
`Math.random().toString(36)` — only 30-50 bits of entropy. Attacker
can brute-force in minutes.

**Root cause**: Agent picked the obvious API without thinking about
entropy or predictability.

**Fix**: Use `crypto.getRandomValues(new Uint8Array(16))` (128 bits) in
browser, `crypto.randomBytes(16).toString('hex')` in Node. Grep-ban
`Math.random()` in token-generating paths.

**Class**: "weak randomness in security context"

**Rule motivated**: C.2 (Security by default).

---

## V-starter-06 — Edit tool silent-fail: router referenced undefined function

**What happened**: Agent added `case 'newAction':` to a router file
and tried to Edit in the corresponding `async function handleNewAction`
body. The Edit call had a parameter typo, errored silently, and the
function body never landed. Tests passed (they didn't cover the new
route). Runtime crashed on first real call: `handleNewAction is not
defined`.

**Root cause**: Agent claimed "committed" after reading only the
successful router diff; didn't grep to verify both sides of the
case/handler pair exist.

**Fix**: After any Edit that adds a paired entry (router case →
handler fn, rule → test, constant → consumer), grep BOTH sides. Never
trust Edit's success message alone. Add `npm run build` (or
equivalent) to pre-commit — an undefined-reference crash triggers
there. Add a PostToolUse hook that re-greps after Edit.

**Class**: "unverified pair"

**Rule motivated**: A + D. Pre-commit hook + Edit verify hook.

---

## V-starter-07 — Force-push to main/master destroyed coworker work

**What happened**: Agent ran `git push --force` on main to "fix" a bad
commit. Coworker had just pushed 3 commits; they were silently
replaced.

**Root cause**: Force push is never safe on shared branches.

**Fix**: Revert with a new commit (`git revert`), not force-push. If
force-push truly needed (rewriting personal feature branch), use
`--force-with-lease` which refuses if the remote moved.

**Class**: "destructive git op"

**Rule motivated**: Workflow rule "never force-push shared branches;
never `reset --hard` published commits".

---

## V-starter-08 — Filesystem case-sensitivity rename broke prod build

**What happened**: Developer renamed `src/components/Button.jsx` →
`button.jsx` on macOS (case-insensitive FS). Git committed as if
unchanged. Linux CI (case-sensitive) saw import path
`./components/Button` resolve to a different file — build failed only
in prod.

**Root cause**: macOS/Windows FS hides case changes; git's default
ignores them.

**Fix**: Set `git config core.ignorecase false` in the repo. When
renaming, do a two-step: `git mv Button.jsx Temp.jsx && git mv
Temp.jsx button.jsx`. Add CI on Linux to catch.

**Class**: "platform-specific bug"

**Rule motivated**: PRE-SHIP. Workflow rule: when renaming, use
two-step.

---

## V-starter-09 — Pre-commit hook bypassed with --no-verify

**What happened**: Tests were failing. Agent bypassed with `git
commit --no-verify` to "unblock" user. The failing test was real —
prod crashed with the same error 2 hours later.

**Root cause**: Treating the hook as bureaucracy instead of the guard
rail it is. A failing hook = investigate, not bypass.

**Fix**: Ban `--no-verify` outright unless user explicitly requests.
If hook fails, read the failure, fix the root cause. Add a hook
audit: grep git log for `Commits that bypassed hooks` (can be
inferred by CI running the same checks).

**Class**: "safety-rail bypass"

**Rule motivated**: Workflow rule — never skip hooks.

---

## V-starter-10 — AI invented API shape (guessed URL / params)

**What happened**: Agent wrote code calling
`PATCH /api/users/{id}?action=deactivate` — a URL that doesn't exist
in the backend. Code passed local tests (mocked the endpoint). Failed
in staging with 404.

**Root cause**: Agent asked "how do I deactivate a user?" and the
model fabricated a plausible-looking URL from training data instead
of checking the actual API.

**Fix**: Before writing any API call, **verify the endpoint exists**.
Either: (a) `grep` the backend router file, (b) `curl` against the
real endpoint, or (c) read the OpenAPI/Swagger spec. Never accept a
URL from your own imagination.

**Class**: "hallucinated API"

**Rule motivated**: F (Triangle Rule — Evidence + Intention + Existing
code; never guess). The Evidence axis is non-negotiable.

---

## V-starter-11 — Tests pass, build fails (type error or undefined import)

**What happened**: `npm test` — all green. `git commit`. CI ran `npm
run build` — TypeScript error in a file tests don't import. Prod
deploy broken.

**Root cause**: Tests only cover files tests import. A type error in
an unreferenced file is invisible to tests.

**Fix**: Add `npm run build` to pre-commit hook after `npm test`.
Seconds of build-time; prevents hours of triage.

**Class**: "incomplete pre-commit verification"

**Rule motivated**: Workflow rule — pre-commit = test + build + audit
+ grep-pair, not just test.

---

## V-starter-12 — Rule of 3 violation (same pattern copy-pasted 3+ times)

**What happened**: Same date-formatting code pasted in 8 components.
Locale changed from US → Thai (dd/mm/yyyy). Agent fixed 5 places,
missed 3. Mixed date formats shipped.

**Root cause**: No shared helper. Each component had its own
`formatDate()` — forked from the original and drifted.

**Fix**: Extract to a single `formatDate` in `src/lib/time.ts`. Grep-
ban raw `.toLocaleDateString()` outside the helper.

**Class**: "parallel implementation drift"

**Rule motivated**: C.1 (Rule of 3 — extract on 3rd occurrence).

---

## V-starter-13 — Orphan collection / table with no reader

**What happened**: A feature added a Firestore collection (or SQL
table, or S3 prefix) for "audit logs". Code to write lands. Code to
read never lands. Six months later, 12 GB of data with no consumer.

**Root cause**: Planning step forgot the reader. AI added the writer
because the plan said so.

**Fix**: No new collection/table without (a) reader code in the same
PR, (b) size estimate, (c) retention policy. Write-only = YAGNI.

**Class**: "premature infrastructure"

**Rule motivated**: C.3 (Lean schema).

---

## V-starter-14 — Stale closure in React useEffect

**What happened**: `useEffect` referenced a state variable but didn't
list it in the deps array. On re-render, effect captured the initial
state forever. User click did nothing.

**Root cause**: React's closure model + ESLint rule disabled.

**Fix**: Enable `react-hooks/exhaustive-deps` ESLint rule. When deps
list is intentionally partial, comment with why. Use `useRef` for
values that should bypass the closure.

**Class**: "React stale closure"

**Rule motivated**: PRE-SHIP (stack-specific; replace with your
equivalent if not React).

---

## V-starter-15 — Database PATCH without field mask dropped fields

**What happened**: PATCH request to Firestore REST endpoint replaced
the entire document, wiping 18 fields not in the request payload.

**Root cause**: Firestore REST PATCH = full replace unless
`updateMask.fieldPaths` is set. Agent used `fetch` instead of the
SDK, missed the mask.

**Fix**: Always use the SDK. If REST is required (e.g. from a Vercel
function), build the mask from the payload keys:
`updateMask.fieldPaths=${Object.keys(fields).join(',')}`. Grep-ban
`method: 'PATCH'` against Firestore without a mask.

**Class**: "destructive PATCH"

**Rule motivated**: PRE-SHIP (stack-specific; applies to any REST
PATCH that has replace-vs-merge semantics — Firestore, DynamoDB,
Mongo, etc.).

---

## V-starter-16 — Cross-session handoff file grew unbounded (append-only accumulator)

**What happened**: `SESSION_HANDOFF.md` (read at the start of EVERY session)
kept growing — session-end only ever *appended* a new `### Session` block (and,
in some projects, a per-session one-line status bullet) and never removed
anything. It reached 20+ blocks / tens of thousands of tokens. Every future
session paid that token cost at boot for context it almost never needed. In one
case the file even exceeded the Read-tool size limit, so boot couldn't load it
at all.

**Root cause**: the maintenance policy was **byte-triggered** ("archive when the
file is > 180 KB") or absent entirely. A byte trigger is the wrong tool — the
file can hold dozens of sessions while still sitting *under* the threshold, so it
never fires and the file silently bloats. The session-end skill also said "NEVER
rewrite older sessions", which (mis)read as "never touch them" → never trim.

**Fix**: cap by **COUNT, every turn** — keep only the newest N (10 is a good
default) `### Session` blocks + N per-session Current State bullets in the live
file; move the overflow to a cold archive
(`.agents/sessions/session-handoff-archive.md`) that is **never read at boot**.
Per-session detail also lives in checkpoints + `docs/violation-log.md`, so the
live file loses nothing. Make the trim idempotent and run it on every
`/session-end` (canonical trimmer:
`.claude/scripts/trim-session-handoff.mjs`). "Frozen older sessions" means
*never edited in place* — archiving the overflow is trimming, not rewriting.

**Class**: "append-only accumulator with no count cap"

**Rule motivated**: cross-session protocol (`docs/cross-session.md` — bound the
handoff by count) + session-end skill HARD CAP. PRE-SHIP — applies to any file
an agent appends to every turn AND re-reads every boot (handoff, running notes,
a "decisions" log, a changelog the agent loads).

---

## V-starter-17 — Mock/stub tests mistaken for real verification

**What happened**: A feature shipped after the unit suite, source-grep checks,
and a build all went green — the agent claimed "verified / done". In production
it was broken in several user-visible ways on the first real use. Every green
layer had tested the *shape* of the code against mocks, not the real system: the
DB/query layer was stubbed, the client used a privileged/admin path that bypassed
the real permission + index layer, and the "post-deploy probe" was a trivial
request that never exercised the actual user flow.

**Root cause**: mock tests are **code-shape coverage, not behavior verification**.
A privileged/admin SDK call can bypass the very indexes, rules, and auth the real
client is subject to — so an admin-path test passes while the real client fails.
"Tests pass + build clean" is necessary but **not sufficient** for any
user-visible flow.

**Fix (real-adversarial verification — see iron-clad Rule Q)**: before claiming
"verified" for user-visible code, satisfy at least one: **L1** — drive the REAL
deployed interface (real browser / real CLI) with real auth and assert the real
result; **L2** — use the REAL client (not an admin/privileged path) issuing the
EXACT queries the app issues against a real environment; **L3 (last resort)** —
the user confirms in writing. Default to a break-attempt mindset: assume you're
wrong somewhere and go find it. Found 0 bugs in < 5 minutes? You didn't test hard
enough — retest at a higher level.

**Class**: "mock-shadowed verification"

**Rule motivated**: Q (Real-Adversarial Verification). PRE-SHIP — applies to any
project where tests can mock the system boundary (almost all of them).

---

## V-starter-18 — Fixed the one instance; the sibling broke next session

**What happened**: A bug was found and fixed in the file in front of the agent.
Tests went green, shipped. A week later "the same bug" was reported — a different
file had the identical broken pattern that the first fix never touched. This
repeated several rounds, each fixing only that round's instance, before someone
grepped the whole project and found all five at once.

**Root cause**: the fix scope was the surfaced instance, not the class-of-bug. The
same pattern (a shape change that broke a sibling reader, a race, a two-call-site
fix that missed the twin) usually exists in 3-5 places. The un-fixed siblings
aren't "not broken yet" — they're latent.

**Fix (Rule P)**: the moment you fix a bug, before committing: name the class →
cross-file grep for every instance of that pattern → fix them all in one batch →
add a source-grep regression test + a numbered audit invariant. If the grep returns
more than one hit, your fix scope is all of them.

**Class**: "instance-only fix (no class-of-bug expansion)"

**Rule motivated**: P (Class-of-Bug Expansion) + D. PRE-SHIP — applies whenever a
copy-pasted or systemic pattern can recur across files.

---

## V-starter-19 — Concurrent read-modify-write lost an update (double-click / two actors)

**What happened**: Two requests modified the same record at almost the same time (a
user double-clicked "submit", or two staff acted on the same row). Each did
`read → modify → write` without a transaction: both read the same starting value,
both wrote, last-write-wins. One update — a payment, a stock deduction, a points
change — silently vanished. No error was thrown. The bug never reproduced in
single-actor testing.

**Root cause**: a plain read-then-write on a record that more than one flow can
mutate is not concurrency-safe. The two writers race; the loser's change is
overwritten.

**Fix (Rule T)**: make the read-modify-write atomic — a database transaction
(read + write inside it; the loser retries against the fresh value), an atomic
increment / compare-and-swap, or optimistic-concurrency version check with retry.
For a multi-record allocation, re-verify inside the transaction and re-plan on
contention. Verify with a REAL concurrent test (fire both writers at once, assert
no-lost-update) — a mock can't expose a race.

**Class**: "non-atomic concurrent RMW (lost update)"

**Rule motivated**: T (Atomic Read-Modify-Write). PRE-SHIP — DB-agnostic; applies to
any balance / counter / inventory / shared-array / status field.

---

## V-starter-20 — Production data migration coupled to a deploy (or hand-edited in a console)

**What happened**: A one-off data fix was either (a) bolted into app startup
("on next load, if field X is missing, backfill it") — so it shipped with a deploy,
re-ran on every boot, and was hard to roll back; or (b) done by hand in a database
console — leaving no audit trail, no dry-run, and no re-run safety. In one case the
migration logic had a bug that only surfaced at write time, and because it was
deploy-coupled, fixing it meant a whole new deploy cycle.

**Root cause**: a data manipulation was treated as shipped code (or as a manual
console action) instead of a two-phase script.

**Fix (Rule M)**: make it a script run from a trusted local/admin context — two-phase
(dry-run by default; writes only behind `--apply`), idempotent (re-apply = 0 writes),
with an audit record (scanned / changed / skipped + before/after) and forensic
fields (prior value + a `*MigratedAt` marker) on every mutated row. Dry-run first,
sanity-check the counts, then apply. Never hand-edit prod data in a console.

**Class**: "deploy-coupled / unaudited data migration"

**Rule motivated**: M (Data Ops are Scripts). PRE-SHIP — applies to any project that
ever mutates production data. Start from `.claude/scripts/_template-data-op.mjs`.

---

## How to use this list with `/audit-health`

A fresh install has 0 native V-entries. After copying 5-10 starters in
(marked PRE-SHIP), your H1 metric shows `10 seeded + 0 native`. Over 6
months, native V-entries should grow — starter entries get replaced as
real instances happen.

**Healthy trajectory:**
- Month 0: 0 native, 10 seeded
- Month 3: 2-3 native replacing seeds
- Month 12: 8-12 native, seeds mostly absorbed
- Month 24: 20+ native, seeds optional (you have better-tailored
  examples now)

## Anti-patterns to avoid with this starter V-log

1. **Delete all 15 "because they don't feel like my project"**. V-01
   (node_modules) and V-02 (secret leak) apply to every git repo. Keep
   those even if nothing else.

2. **Copy all 15 without reading**. A starter you don't understand is
   a rule you can't enforce. Read each, decide, copy the relevant.

3. **Never mark starters as "PRE-SHIP"**. Future readers won't know
   which are real bugs (with date+SHA evidence) vs. preventive. Mark
   every copied starter.

4. **Never upgrade starters to real entries when they actually fire**.
   If V-starter-06 fires in your project, edit the V-entry with the
   real date, commit SHA, and the specific function names involved.
   Now it's real evidence, not a hypothetical.

---

## How this file grows

When another universal pattern surfaces (e.g. "circular dependency
between modules caused infinite boot loop"), add V-starter-16. Keep
the list ≤ 20 — beyond that, universality is doubtful and it should
become stack-specific.

Candidates to add later (as evidence accrues):
- Circular dependency (TS/ESM)
- `npm audit` ignored for a year → shipped with CVE
- CORS misconfig locked out legit clients
- Logging secret in server stdout (shows up in CloudWatch forever)
- `try { } catch { }` swallowed the real error
