<important if="EVERY turn. Read before any commit, deploy, or rule change.">
## 🔥 Iron-Clad Rules — NEVER break

These are the rules that, if broken, produce a session-ending mistake. Every
rule has a **name**, a **why** (often an anti-example linking to a V-entry
in `00-session-start.md`), and a **grep target** so audits can enforce it.

**How to use this template:** Keep rules A, C, D, F, G exactly as written —
they're the universally-applicable core. Customize B, E, H for your project.
Add new rules (I, J, ...) whenever a new class of bug demands it.

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
- **Missing capability** → check user-invocable skill list; build via
  `/skill-creator` if nothing fits.
- **New audit skill** → must include grep patterns + numbered invariants (per D)

**Hard constraints** — new tool/skill calls still pass rules A-F:
- Loading `WebFetch` ≠ permission to fetch arbitrary URLs from restricted files
- Loading `Write` ≠ permission to create files outside sanctioned paths
- New collections still need reader+writer+justification (C3)

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
