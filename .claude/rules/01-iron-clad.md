<important if="EVERY turn. Read before any commit, deploy, or rule change.">
## 🔥 Iron-Clad Rules — NEVER break

These are the rules that, if broken, produce a session-ending mistake. Every
rule has a **name**, a **why** (often an anti-example linking to a V-entry
in `00-session-start.md`), and a **grep target** so audits can enforce it.

**How to use this template:** Keep rules A, C, D, F, G, **Q** exactly as written —
they're the universally-applicable core. Customize B, E, H for your project.
Add new rules (I, J, ...) whenever a new class of bug demands it. (Rule Q keeps
its distinctive letter — it does not collide with the `V`-number violation log.)

---

### A. Bug-Blast Revert

If change X broke feature Y → **remove X immediately**. Don't patch forward,
don't add workarounds, don't attempt a quick-fix commit. Revert, then re-plan.

**Why:** Forward-patching on top of a broken change compounds the damage.
Reverting is the only safe recovery.

**How:** `git revert <sha>` or `git reset --hard <last-good>` + force-push
(coordinate with team first if shared branch).

---

### B. [FILL-IN: Deploy Safety Rule for your stack]

Example (from a Firestore-backed app):

> **Probe-Deploy-Probe for `firestore:rules`.** Every `firebase deploy --only
> firestore:rules` requires:
> 1. Curl-probe every unauth write path → must return 200
> 2. Deploy
> 3. Curl-probe same paths → if any 403, revert immediately
> 4. Delete probe docs
>
> Probe list MUST grow whenever a new unauth-write path is added.

Customize for your stack:
- Web app with env-var secrets: validate all secrets load before deploy
- Database migration: dry-run against prod clone before applying
- Third-party webhook: probe receiver endpoint before switching DNS

**Anti-example to catalog:** whatever first deploy you blew up. Put it in V-log.

---

### C. Anti-Vibe-Code — "AI is capable, the operator must be more so"

Three failure modes that AI-assisted dev falls into constantly:

**C1. Rule of 3 — Shared-first, never hardcode-first**

- Pattern in ≥ 3 places → extract shared utility **now** (2 places OK, 3 = bug)
- Before writing a new helper: **grep for existing** in shared libs first
- If similar exists but not exact → extend with backward-compat props, not fork
- Maintain a list of canonical shared modules (update when you add)

**C2. Security by default**

- Never commit secrets in `src/` or `api/` → env vars only
- Never use `Math.random()` for tokens/IDs → `crypto.getRandomValues(new Uint8Array(16))`
- Never put user IDs / admin identifiers in world-readable documents
- Never leave `allow read, write: if true` in Firestore rules without a comment explaining why
- Commit history is permanent → leaked credential = rotate immediately

**C3. Lean schema — no premature collections**

New database collection must pass 3 criteria:
1. Real reader exists
2. Real writer exists
3. Shape doesn't fit on an existing doc (denormalize first)

No `*_log` / `*_history` collections without a confirmed reader. Put on
parent doc as array if possible.

**Enforcement:** `/audit-anti-vibe-code` skill with grep patterns AV1-12.

---

### D. Continuous Improvement

**Every bug → fix + adversarial test + audit skill invariant.** Never just-fix.

- Bug found → add a failing test that reproduces it (adversarial, not happy path)
- Fix the code → test passes
- **Update rule file** if the class of bug wasn't already covered
- **Add new invariant** to the relevant audit skill (numbered — AV13, BF8, etc.)
- **Register** the skill in `/audit-all` Tier tables if pre-release relevant

**Why:** This is the engine of memory growth. Without D, your rules go stale.
With D, every session makes the rule set sharper.

---

### Q. Real-Adversarial Verification — mock tests are NOT verification

Before claiming **"verified" / "done" / "tests pass" / "ready to ship/deploy"**
for ANY user-visible code (UI, an API endpoint behind auth, a real query, a
cross-system flow), you MUST exercise the **real system**, not a mock. Passing
unit tests + a clean build are **necessary but not sufficient** — they cover the
*shape* of the code, not its *behavior* against the real environment.

Satisfy at least one level:

- **L1 (preferred)** — drive the REAL deployed interface (real browser / real
  CLI / real device) with real auth, and assert the real result (real DOM, real
  side-effect, real response).
- **L2 (acceptable)** — use the REAL client (NOT a privileged/admin path that
  bypasses the system's own permission + index + validation layers) issuing the
  EXACT queries/calls the app issues, against a real environment.
- **L3 (last resort)** — the user confirms in writing ("tried it, works" / "tried
  it, broke at X"). Only when L1 and L2 are genuinely infeasible.

**FORBIDDEN** (each = a Rule Q violation):
- Mocking the system boundary (DB/query/network) and calling the result "verified".
- An admin/privileged-SDK call standing in for the real client — it can bypass the
  exact indexes, rules, and auth that break the real user, so it passes while prod
  fails.
- "All unit tests pass + build clean → shipped" for a user-visible flow.
- A post-deploy "probe" that doesn't exercise the actual user flow.
- "I tested for 5 minutes and found nothing" — < 5 min + 0 bugs means you didn't
  try; retest at a higher level with a break-attempt mindset.
- Reasoning your way to "verified" ("it's identical to the proven path") instead of
  running a test that could actually FAIL. Certainty is exactly when self-deception
  ships bugs — run the real test anyway, and disclose the gap between what you
  *tested* and what you *reasoned about*.

**Self-check before any "verified" claim** (any "no" / "not sure" → DO NOT CLAIM):
1. Did I drive the REAL interface OR the REAL client?
2. Did I issue the EXACT call/query the app issues?
3. Did I actively TRY to BREAK my own code?
4. If < 5 min testing + 0 bugs → did I retest harder?
5. Can I produce a log / screenshot proving the flow?

**Why:** the highest-cost AI failure mode is a green test suite that lies — every
mocked layer agreeing with the bug. The cost is not a bad test; it is shipped
breakage plus collapsed trust. Real + adversarial (both words matter: the *real*
system, tried *adversarially*) is the only verification that doesn't lie.

**How to follow:** keep mock/unit tests for fast code-shape coverage, but gate every
"verified" claim on L1 or L2 evidence. Pair with Rule D: a confirmed bug becomes a
regression test + an audit invariant.

**Enforcement:** PRE-SHIP — applies to any project where tests can mock the system
boundary. Audit cue: grep for "verified"/"done" claims in session notes that lack
L1/L2 evidence. See `docs/starter-violations.md` V-starter-17 (mock-shadowed
verification) and methodology anti-pattern 9.

---

### E. [FILL-IN: Data-Layer Boundary Rule]

Example (from a clinic app):

> **Backend UI reads from OUR database ONLY.** The one sanctioned exception
> is the sync-bridge tab, which writes one-way from external → ours. All
> other UI reads from our canonical collections, never from the sync cache.

Customize for your architecture:
- Microservices: each service owns its data; no cross-service SQL queries
- Frontend/backend split: UI reads API, never hits DB directly
- Multi-tenant: tenant A code never reads tenant B data

**Anti-example to catalog:** whatever violation showed up in code review that
prompted you to write this. Add to V-log.

---

### F. Triangle Rule — 3 sources before replicating external features

Before and DURING every feature that replicates something external:

1. **External reference** — the real thing (scrape docs, intel tool, API call)
2. **Plan** — your project's plan memory / spec / design doc
3. **Existing code** — grep your own codebase for shared helpers

**Gap in any one = drift = bug**. If you're guessing a URL, method name, or
field shape without having captured it, STOP and capture it first.

**Why:** AI will happily invent plausible-looking but wrong field names.
Triangle = you verify against 3 independent sources before writing.

---

### G. Dynamic Capability Expansion — ALLOWED, rules A-F still apply

- **Deferred tools** in system prompt → load via `ToolSearch` as needed. No ask.
  Bulk-load related sets in one query (e.g. `query:"computer-use" max_results:30`),
  not `select:<one_tool>` at a time.
- **Missing capability** → check user-invocable skill list; build via
  `/skill-creator` (or hand-copy `_template/SKILL.md`) if nothing fits.
- **New audit skill** → must include grep patterns + numbered invariants (per D)
- **Uncertain which tier applies** → invoke `/capability-scout "<task>"` — it
  returns a ranked recommendation (Tier 1..5) and the literal next-action command.

**Hard constraints** — new tool/skill calls still pass rules A-F:
- Loading `WebFetch` ≠ permission to fetch arbitrary URLs from restricted files
- Loading `Write` ≠ permission to create files outside sanctioned paths
- New collections still need reader+writer+justification (C3)
- A dynamic tool call that bypasses an iron-clad rule = same severity as any
  other violation. **Audit rules override capability.**

**Ask user ONLY for:** paid API integrations, new Anthropic Plugin install,
writes to external shared state (Slack/email/JIRA/cross-account cloud), or
destructive irreversible actions. **Never ask for** tool loading or skill
invocation — those are auto-allowed.

**Reference:** `docs/capability-expansion.md` (decision tree + anti-patterns),
`.claude/skills/capability-scout/SKILL.md` (automated form).

---

### G.3. Research Before Guessing

**Companion to G and F.** If you catch yourself about to write "I think",
"probably", "the standard way", "usually", or "it should be..." about
any external fact (URL / method / field / config / library behavior) —
**STOP**. The phrase is a metacognitive flag that you have a knowledge
gap. Invoke `/research-gap` (which runs a 5-tier search: local code →
project docs → official docs → WebSearch → MCP/skill registry) and do
not write until you have a verified answer + source citation.

If research reveals "the capability you need isn't installed", invoke
`/skill-autoinstall` — it handles Anthropic bundled skills, deferred
tools, MCP servers, and community skills. Zero-cost installs auto-
execute under Rule G; installs with external write-surface ask for
user consent.

**Why:** AI's #1 failure mode is confident hallucination — plausible-
looking invention that passes type-checks and mocked tests but fails
in production. Research costs ~30 seconds; a hallucination costs hours
+ a V-entry. Research Mode flips the incentive.

**Anti-example (prevented by this rule):** V-starter-10 — agent writes
`PATCH /api/users/{id}?action=deactivate` without verifying. Real
endpoint is `POST /api/users/{id}/deactivate`. 404 in staging. Fix:
Rule G.3 + `/research-gap`.

**Hard constraint:** G.3 applies even inside another skill. A skill
invoking an external service without research = same severity as
writing it by hand.

**Reference:** `docs/research-mode.md`,
`.claude/skills/research-gap/SKILL.md`,
`.claude/skills/skill-autoinstall/SKILL.md`.

---

### G.2. Promotion Trigger — ≥ 3 repetitions = new skill

**Companion to G.** When the agent does the same manual pattern 3+ times in
a session or project → **promote it to a skill**, don't keep re-doing it
ad-hoc.

**Why:** Rule G allows on-demand capability. G.2 makes the toolkit **compound**
— every recurring manual pattern gets captured, so the next session starts
smarter. Without G.2, G's freedom leaks into perpetual rework.

**Trigger criteria (all three must be YES):**
1. Same task ≥ 3 times in this session or recent project history
2. Reusable (not one-shot / not this-bug-specific)
3. Expressible as grep-auditable invariants OR a deterministic decision tree

If YES to all three → promote now. Use `/capability-scout` for a starter
recommendation, or hand-copy `.claude/skills/_template/SKILL.md`.

**Scope decision:**
- **User-level** (`~/.claude/skills/<name>/SKILL.md`) — reusable across
  projects (stack-agnostic, or applies to any project with similar stack)
- **Project-level** (`.claude/skills/<name>/SKILL.md`) — specific to this
  codebase or domain

**Anti-example (the drift G.2 prevents):**
- Session 1: agent runs `grep X | awk Y | sort` three times while auditing.
- Session 2: same incantation, five more times, different audit target.
- Session 3: user asks "why is this so slow?" — because nothing got captured.
  Should have been promoted on session 1's 3rd invocation.

**Hard constraint:** G.2 promotion still passes rules A-F — new skills don't
bypass audit, security, or data-boundary rules. A freshly-promoted skill that
violates Rule E is the same severity as any other violation.

**Enforcement:** `.claude/skills/capability-scout/SKILL.md` (CS5 invariant)
encodes this decision tree. `docs/capability-expansion.md` is the reference.

---

### H. [FILL-IN: Data Ownership Rule]

Example (from a clinic app):

> **All master data lives in OUR database.** External sync = initial seed
> only. After seed, CRUD in our UI. No write-back to external. Every
> master-data entity gets a dedicated CRUD tab in our canonical collections.

Customize for your architecture:
- SaaS integrating with 3rd-party CRM: ours canonical, theirs = sync mirror
- E-commerce with inventory sync: master stock in OUR system, feed out to channels
- Content app with external API: cache + enrich, canonical is ours

---

## Anti-patterns to grep

Below are generic anti-patterns audits should catch. Customize per stack.

```
# C1 — repeated logic (Rule of 3)
grep -rn "function parseQty\|function formatMoney" src/ | wc -l  # >1 in different files = extract

# C2 — crypto hygiene
grep -rn "Math\.random().*toString(36)" src/ api/  # should be zero
grep -rn "process\.env\.\w*KEY" src/  # secrets in frontend bundle — check

# C3 — orphan collections
ls collections/ | while read c; do
  echo "$c: $(grep -rn "$c" src/ | wc -l) references"  # < 2 = orphan
done
```
</important>
