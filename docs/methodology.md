# Methodology — How to Write Rules That Don't Drift

This is the core document. Every other file in claude-guardrails is an
instance of one of these patterns.

---

## The 5 principles

### 1. Rules as code, not guidance

Bad: `CLAUDE.md` says "be careful with secrets".

Good: `.claude/rules/01-iron-clad.md` section C2:
> No `Math.random()` for tokens → use `crypto.getRandomValues(new Uint8Array(16))`
> No secrets in `src/` or `api/` → env vars only
> No user IDs in world-readable docs

Why: the good version is **greppable**. Claude reads it verbatim. An audit
skill greps `Math\.random.*toString\(36\)` to catch violations. CI fails.

**Rules should be numbered, specific, and have a grep target.**

### 2. Every rule has an anti-example

A rule without a story of pain is a rule that'll be broken.

Bad: "Always test before deploying."

Good:
> **B. Probe-Deploy-Probe for rules changes.**
> V1 (2026-04-19) commit `8fc2ed9` tightened firestore rules → webhook
> + calendar dropped to 403 in production. Fix: `git revert`. Rule: every
> `firebase deploy --only firestore:rules` = curl-probe endpoints 1-4
> before + after. If any 403 post-deploy → revert immediately.

Why: the anti-example explains WHY the rule exists. New team members +
new AI sessions understand the cost of violating it. Without the story,
the rule looks like paranoid policy.

### 3. Violations grow the rule set, never shrink it

Every production bug = new V-entry + new rule / audit invariant.

- V1, V2, V3, ... accumulate over years
- Never delete old entries — even obsolete ones are documentation
- If a rule becomes obsolete, mark DEPRECATED but keep the number

Why: the V-log is institutional memory. Rule drift happens when the
"why" gets forgotten. The V-log is the "why" preserved forever.

### 4. No AI summarization of rules

Other tools (claude-mem, GenericAgent, evolver) summarize project memory
with AI. This breaks grep-auditability.

Rule: **a rule file is only edited by humans** (optionally with AI drafting
the edit). Auto-compress tools are banned on `.claude/rules/*`.

Why: summarization is lossy. "No Math.random for tokens" becomes "use
good randomness" which becomes "handle tokens carefully" which becomes
nothing. Humans preserve literal text; AI erodes it.

### 5. Continuous Improvement (Rule D)

Every bug triggers a 4-step response:

1. **Fix the code** — make the failing test pass
2. **Add adversarial test** — 5+ nasty inputs, not just the one that bit
3. **Update rule file** — if the bug class wasn't already covered
4. **Add audit invariant** — numbered grep pattern in the relevant skill

The 4th step is what makes the team smarter over time. Without it,
you fix the same class of bug 10x.

### 6. Every rule cites evidence (or is explicitly preventive)

A rule without evidence is decoration — future sessions can't assess
whether to keep it, extend it, or delete it.

**Every rule must end in one of two markers:**
- **`V-example: V{N}`** — references a V-entry in
  `.claude/rules/00-session-start.md`. The V-entry documents the real
  bug (date, commit SHA, what went wrong, root cause, fix).
- **`PRE-SHIP — no real-world bug yet, rule added based on <pattern>`**
  — marks the rule as preventive. The `<pattern>` cites either a
  starter V-entry (`docs/starter-violations.md`) or a known class of
  bug from industry knowledge.

**Why two markers:** reactive rules (from V-entries) and proactive
rules (from PRE-SHIP analysis) are both valid. But fuzzy rules with no
marker rot — nobody remembers why they exist, so they eventually get
deleted when someone "simplifies" (see anti-pattern 4).

**Audit**: `/audit-rules` LR4 greps every rule section for either
`V[0-9]+` or `PRE-SHIP`. Missing marker = findings.

---

## How to write a new rule

Template:

```markdown
### {Letter}. {Rule name in imperative}

{One-paragraph description of what the rule requires.}

**Why**: {1-2 sentences of motivation. Reference V-entry if from real bug.}

**How to follow**: {Specific action — "grep for X before writing Y", "run
tool Z before deploying", etc.}

**Enforcement**: {Which audit skill catches violations. If none yet,
write the audit skill at the same time as the rule.}

**Anti-example** (if from real incident):
- **V{N} YYYY-MM-DD**: {short title}
- Bug: {what went wrong}
- Root cause: {why it happened}
- Fix: {commit SHA + what changed}
```

## How to write a new audit skill

Template at `.claude/skills/_template/SKILL.md`.

Key points:
- Skill name in frontmatter triggers discovery
- Each invariant has: number, name, grep pattern, fix suggestion
- Grep patterns should have < 10% false-positive rate
- Skills are "report-only" — humans decide on fixes, don't auto-modify

## How to handle cross-session drift

The risk: Claude session 1 follows the rules. Session 2 (new chat) starts
cold. Without strict mechanism, session 2 might:
- Skip reading rule files
- Summarize them into its own understanding (drift)
- Violate a rule because it doesn't know V3 existed

Mitigation:
1. **`CLAUDE.md`** lists the mandatory read-first files with explicit
   "blocks any tool calls until read" language
2. **`.agents/AGENTS.md`** defines trust priority — rules win on conflict
3. **`SESSION_HANDOFF.md`** includes a paste-ready Resume Prompt
4. **Session checkpoint** files accumulate context the new session can load

See `docs/cross-session.md` for the full protocol.

---

## Anti-patterns (how rules DON'T work)

### Anti-pattern 1: "Best practices" list

A document listing 30 "best practices" without numbers, grep targets,
or anti-examples is decoration. AI reads it, nods, ignores it when
instructions conflict.

Symptom: rule file grows but bugs still ship.

Fix: every line must be either a numbered invariant with a grep target,
or anti-example story. Delete decorative text.

### Anti-pattern 2: Rules that only exist in one person's head

If the senior dev enforces "no Math.random for tokens" in code review but
it's not written anywhere, AI doesn't know, and the rule dies when the
senior dev is on vacation.

Fix: every spoken rule gets written into `.claude/rules/*`.

### Anti-pattern 3: Rules that conflict without resolution

Rule X says "optimize for speed", Rule Y says "optimize for readability".
When both apply, AI picks whichever fits its current instruction.

Fix: when rules conflict, add a priority section. Example:
> **When X conflicts with Y**: Y wins if the code is user-facing, X wins
> if internal. Document which case applied in the commit message.

### Anti-pattern 4: Summarized rules

"Rules updated to simplified version" = rules erased.

Symptom: V5 in LoverClinic — consolidated 8 rule files → 4, lost context,
next session violated removed rule.

Fix: never summarize. Split / expand / reorganize, but keep every rule's
text intact. Deprecation is the only way to remove text — and even
deprecated rules stay in file as historical reference.

### Anti-pattern 5: Migration fallback that hides state

When migrating consumers from legacy source X → canonical source Y,
leaving `Y empty ? fallback X` in the consumer hides the actual migration
state. When the user legitimately clears Y, they expect empty state — not
silent fallback to the old source.

Bad:
```js
// Looks safe — graceful degradation
const items = getFromNew() || getFromLegacy();
```

Good:
```js
// Shows the actual state of the migration
const items = getFromNew();
// If empty, that IS the state — show empty, not legacy data
```

Why: fallbacks were appropriate during the migration period when Y was
being populated. Once migration is complete, the fallback:
- Hides bugs (Y is wrong, but legacy fallback masks the error)
- Hides user intent (user deleted from Y; fallback resurrects the data)
- Prevents testing (Y always looks "fine" even when broken)

**Rule:** migrations have two phases. Phase 1: Y empty → fallback X
(bootstrap). Phase 2: Y populated → remove fallback (production).
Schedule and commit the fallback removal as part of the migration plan,
not as a follow-up cleanup.

**V-example:** an adapter was reading medication_groups from
`getAllMasterDataItems('medication_groups')`. When migrated to
`be_product_groups`, the fallback `list.length === 0 ? legacyFallback()`
was left in. User deleted all records from `be_product_groups` to test
the CRUD — the UI showed all the records back (from legacy), making it
look like delete wasn't working. Fix: remove fallback, trust the new
canonical source.

---

### Anti-pattern 6: Adapter registries that drift from the canonical list

When you use an adapter pattern to abstract "which entities have been
migrated to the new canonical store" (e.g. `BE_BACKED_TYPES = ['A', 'B']`),
the registry IS the source of truth for "is this entity migrated?".

Any consumer, UI label, or status indicator that reads the registry
must see the same truth. When the registry drifts (entity migrated but
not added to registry, or vice versa), consumers show contradictory state.

```js
// Registry drives all downstream logic
const BE_BACKED_TYPES = Object.freeze({
  products: 'be_products',
  courses: 'be_courses',
  // When 'orders' migrates, it MUST be added here at the same time
});

// Status badge reads registry — must match what's actually in be_*
const status = BE_BACKED_TYPES[type] ? 'migrated' : 'legacy';
```

**Rule:** every entity migration requires TWO commits:
1. The migration code (new be_* collection + CRUD)
2. The registry update (add to BE_BACKED_TYPES or equivalent)

Never separate these. The registry is an invariant — grep it in audit
skills to verify the count matches the actual number of migrated entities.

---

### Anti-pattern 7: Auto-compressed memory

Using vector DB / AI summary to store project context = drift built-in.

Symptom: after 10 sessions, the "compressed insights" contradict each
other because no single human reviewed the compression pass.

Fix: plain files, human-curated. If you need search, use grep.

---

### Anti-pattern 8: Guess-over-research (Confident hallucination)

Agent invents a plausible-looking URL / field / method / config based on
training-data pattern-matching instead of verifying. Code type-checks,
tests mock the invention, production fails.

Symptom: V-entry "404 at staging because endpoint didn't exist" or
"function signature wrong despite my 'I think' confidence".

Fix (Rule G.3 + `/research-gap`): treat phrases like "I think X",
"probably Y", "the standard way is Z" as metacognitive flags that a
knowledge gap exists. STOP writing. Run the 5-tier research protocol
(local code → project docs → official docs → WebSearch → capability
registry). Only write after you have a verified answer + citation.

If research reveals "the capability you need isn't installed", invoke
`/skill-autoinstall` — zero-cost installs (Anthropic-bundled, deferred
tools) auto-execute under Rule G; user-consent installs (MCP servers,
community skills) return a plan for approval.

**V-example:** V-starter-10 in `docs/starter-violations.md` — agent
wrote `PATCH /api/users/{id}?action=deactivate`; real endpoint was
`POST /api/users/{id}/deactivate`. Caught by staging, not dev.

**Why "guess-over-research" is tempting:** admitting ignorance feels
like failure. The default AI loop rewards appearing helpful. Research
Mode flips the incentive — it gives a scripted path so admitting
ignorance is the fast path, not the slow one.

Reference: `docs/research-mode.md`.

---

### Anti-pattern 9: Mock tests mistaken for verification

Agent runs the unit suite + source-grep checks + a build, all green, and claims
"verified / done / ready to ship". In production it's broken on first real use.
Every green layer tested the *shape* of the code against mocks — the system
boundary (DB / query / network / auth) was stubbed, or a privileged/admin path
stood in for the real client and bypassed the very indexes, rules, and permissions
the real user hits.

Symptom: V-entry "shipped after a green suite; broke immediately in prod" — the
tests all agreed with the bug because they all mocked the same boundary.

```
# Looks verified — but every layer is shape-only
unit tests (DB mocked) ........ PASS
source-grep (code shape) ...... PASS
build ......................... clean
→ "verified, shipping"        ← FALSE. Nothing touched the real system.
```

Fix (Rule Q — Real-Adversarial Verification): mock tests are code-shape coverage,
NOT behavior verification. Before any "verified" claim on user-visible code,
exercise the REAL system — **L1** drive the real deployed interface with real auth,
or **L2** use the real client (not an admin/privileged path) issuing the exact
calls the app issues, against a real environment. Default to a break-attempt
mindset; "found nothing in 5 minutes" means test harder, not "done". Never reason
your way to "verified" when a test that could actually fail was available — and
when you do reason rather than run, disclose that gap out loud.

**Why "tests pass → shipped" is tempting:** a green suite *feels* like proof and is
the cheap, fast path. But a privileged/admin SDK call bypasses the real index +
rule + auth layers, so it passes while the real client fails — the suite's green is
the loudest lie. Real + adversarial is the only signal that doesn't.

**V-example:** `docs/starter-violations.md` V-starter-17 — a feature shipped on a
green unit suite + admin-path "e2e" + a trivial post-deploy probe; the real client,
subject to the real permission + index layer, was broken in several user-visible
ways on first use.

Reference: iron-clad Rule Q (`.claude/rules/01-iron-clad.md`).

---

## How to grow this methodology

This file itself should grow. When you discover a new anti-pattern or a
new rule-writing technique, add it here with an example.

The methodology is **not** a finished product. It's a living document
shaped by the bugs your team ships and the rules you write to prevent
them recurring.
