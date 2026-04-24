---
title: Growth Engine — the compounding loop that makes this template pay off over time
audience: anyone who wants to understand *why* this methodology works, not just how
tldr: Four mechanisms (D · G.2 · Feedback · Session Handoff) feed each other. Drop any one → loop breaks. Wire all four → toolkit sharpens every session forever.
---

# Growth Engine

> **Claim:** a project using claude-guardrails should be *measurably
> harder to make the same mistake twice in*. Not because the AI got
> smarter — because the catalog of mistakes grew, and the catalog is
> grep-visible, and the AI reads the catalog before acting.

This doc names the four mechanisms, shows how they interact, and lists
the failure modes that break the loop.

---

## The four engines

```
                 ┌──────────────────────────────┐
                 │                              │
                 │        A PROJECT USES        │
                 │       CLAUDE-GUARDRAILS      │
                 │                              │
                 └──────────────┬───────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
    ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
    │  Engine 1:     │ │  Engine 2:     │ │  Engine 3:     │
    │                │ │                │ │                │
    │  RULE D        │ │  RULE G.2      │ │  FEEDBACK      │
    │  (learning)    │ │  (consolida-   │ │  LOOP          │
    │                │ │  tion)         │ │  (cross-       │
    │  bug →         │ │                │ │  project)      │
    │  test +        │ │  manual        │ │                │
    │  rule +        │ │  rep ≥ 3 →     │ │  native        │
    │  audit         │ │  promote to    │ │  learning →    │
    │  invariant     │ │  skill         │ │  bridge file → │
    │                │ │                │ │  guardrails    │
    └────────┬───────┘ └────────┬───────┘ └────────┬───────┘
             │                  │                  │
             │                  │                  │
             └──────────┬───────┴──────────────────┘
                        │
                        ▼
              ┌──────────────────────┐
              │  Engine 4:           │
              │                      │
              │  SESSION HANDOFF     │
              │  (continuity)        │
              │                      │
              │  checkpoint →        │
              │  next session reads  │
              │  → picks up without  │
              │  context loss        │
              └──────────────────────┘
```

Each engine produces something durable (code / docs / rules). The
durable thing is **grep-discoverable** — not "remembered by the model"
but stored as bytes on disk. Future sessions read those bytes on start.

---

## Engine 1: Rule D — Continuous Improvement

**Input**: a bug that shipped (runtime error, failed test, user
complaint).

**Output** (required artifacts before the bug is "fixed"):
1. **The fix itself** — code change reverting or patching the bug.
2. **An adversarial test** — runs in CI, covers the specific failure
   class plus nearby edges. The test fails before the fix, passes
   after.
3. **A V-entry** — numbered violation log entry in
   `.claude/rules/00-session-start.md` describing what happened, root
   cause, and how to avoid next time.
4. **An audit skill invariant** — if no existing audit skill covers
   this class, add one (or extend). If it does, register as a new
   numbered invariant (e.g. AV13).

**Why four artifacts?** Because memory fades. The fix alone prevents
today's bug. The test, rule, and invariant prevent tomorrow's.

**Measurable signals Engine 1 is working:**
- `/audit-health` H1 (V-entry count) grows ≥ 1/month on active
  projects
- H3 (audit invariant count) grows monotonically
- H4 (test count) grows along with features (not flat)

**Failure modes:**
- "Too busy to write the test right now" → write it now, or the loop
  never closes
- "The bug was obvious; we don't need a rule" → every obvious bug
  shipped means the rule *wasn't* obvious enough
- Fix ships, but commit doesn't touch `.claude/` → test + rule +
  invariant didn't happen. Pre-commit hook + `/audit-health` catch
  this.

---

## Engine 2: Rule G.2 — Consolidation by repetition

**Input**: a manual workflow repeated ≥ 3 times.

**Output**: a skill that encapsulates the workflow, auto-discoverable
via `/skill-relevant`.

**Why ≥ 3?**
- 1 = novelty, might never recur
- 2 = coincidence, still might not recur
- 3 = pattern. Build the helper.

**Two scopes:**
- **Project-level** (`.claude/skills/`): LoverClinic-specific sync
  audits, Thai date helpers, etc.
- **User-level** (`~/.claude/skills/`): applies across ALL projects
  (e.g. git-commit-quality audit).

**Measurable signals Engine 2 is working:**
- H2 (audit skill count) grows ≥ 1 per 3 months
- H9 (skill velocity) stays positive

**Failure modes:**
- "It's just 3 greps, why bother with a skill" → the skill is
  **discoverable**; a bash one-liner in your head isn't
- Skills created but never invoked (`/audit-health` can count
  runs-per-skill if you log them) → remove or rewrite
- Skill created but `/skill-relevant` doesn't surface it → update
  `/skill-relevant` rules when adding a skill (see its "How to grow"
  section)

---

## Engine 3: Feedback loop — cross-project learning

**Input**: a pattern learned in one project that applies to others.

**Mechanism**: bridge file at `~/.claude/projects/{project}/memory/
project_claude_guardrails_feedback.md` (or equivalent). Every
generalizable learning gets an entry. Periodically (≥ 5 entries), port
to `F:/claude-guardrails` via commit.

**Output**: guardrails template gets richer. Next new project starts
with N more lessons baked in.

**Why a file, not an automatic pipe?** Because porting requires
judgment — "does this really generalize, or is it LoverClinic-specific?"
Humans filter; files enforce the filter step.

**Measurable signals Engine 3 is working:**
- Bridge file has ≥ 1 pending entry at any time on active projects
- Guardrails repo has a commit from bridge-file batch-port every 2-3
  months
- New projects installing guardrails report "this matches a bug I
  would've hit" within first month

**Failure modes:**
- Bridge file never written → no port ever happens → guardrails
  stagnates
- Port happens once, then never again → check: did the project stop
  learning, or did the scribe give up?
- Everything marked "generalizable" without judgment → guardrails
  gets polluted with project-specific trivia. Use the "NOT generalizable"
  list in `docs/feedback-loop.md`.

---

## Engine 4: Session handoff — cross-session continuity

**Input**: end of a working session (session limit, compaction, logout).

**Output** (before session ends):
1. **`SESSION_HANDOFF.md`** updated — current state, last commit, what's
   next, any gotchas.
2. **`.agents/active.md`** updated — hot state, current focus,
   blockers, next action.
3. **A session checkpoint** at `.agents/sessions/YYYY-MM-DD-<topic>.md`
   — immutable snapshot, includes a resume prompt.

**Next session reads those three** before any tool call. Zero context
loss.

**Why three files?**
- `SESSION_HANDOFF.md` = macro state ("phase 11 in progress")
- `.agents/active.md` = micro state ("next: add BranchesTab CRUD")
- Checkpoint = archive ("on 2026-04-20 we shipped commit X because Y")

**Measurable signals Engine 4 is working:**
- H6 (session handoff count) grows ≥ 1 per month
- New sessions start producing code within 5 minutes of first prompt
  (not re-reading the whole codebase)

**Failure modes:**
- "I'll remember where I was" → you won't, and next session starts
  from scratch
- Checkpoint written but `active.md` not updated → next session sees
  stale focus → redoes finished work
- Three files drift (one says Phase 11 done, another says in
  progress) → reader trust breaks. Add `/audit-session-coherence` if
  this recurs.

---

## How the engines compound

**Engine 1 feeds Engine 2**: when a V-entry's fix involves a
repeatable manual workflow, that's a G.2 promotion candidate. Example:
"every bug fix must run `npm run build`" (V-starter-11) → promoted
into PostToolUse hook, which promoted into `/audit-pre-commit` skill.

**Engine 2 feeds Engine 3**: a reusable skill built in one project is
prime bridge-file material. Example: `/audit-backend-firestore-only`
was a LoverClinic-specific audit; the pattern (domain boundary
enforcement) generalized — landed in guardrails as
`docs/methodology.md` section "Domain boundaries".

**Engine 3 feeds Engine 1**: bridge-file entries become V-starter
entries in the template. Next new project starts Rule-D cycle with a
warmer catalog.

**Engine 4 makes Engines 1-3 survive compaction**: without handoff,
every 5-hour session starts from zero. Rule D additions get forgotten
half the time. Session handoff turns Engines 1-3 from lossy to
lossless.

**The compounding return:**
- Month 1: ~10 rules, 5 audit skills, 20 invariants. AI makes mistakes
  roughly as often as any fresh install.
- Month 6: 20 rules, 10 audit skills, 80 invariants. AI reads the
  catalog before acting; mistakes drop measurably.
- Month 24: 30 rules, 20 audit skills, 200 invariants. AI is reading
  a project-specific playbook on every turn. New bugs are genuinely
  new — novel territory, not repeats.

---

## The failure mode that kills the whole loop

**Skipping Rule D "just this once"** to ship faster.

Every unwritten V-entry is:
- A mistake you'll make again
- That future sessions can't know about
- That audit skills can't catch
- That bridge-file can't propagate

The loop's durability is **path-dependent**: if you skip 5 V-entries
in a row, the catalog is no longer trustworthy (readers can tell it's
incomplete), so readers stop reading it, so writers stop writing it,
so it atrophies.

**Mitigation**: every PostToolUse for `git commit` reminds "did you
update V-log if this was a fix?". `/audit-health` H1 velocity <
1/month on an active project with bug-fix commits = Rule D broken.

---

## Diagnostic: is your loop healthy?

Run `/audit-health` monthly. Check:

```
✓ H1 ≥ 1 new V-entry in last 30 days  (if you had any bug fixes)
✓ H2 ≥ 1 new skill in last 90 days    (if you had any manual reps)
✓ H3 growing monotonically            (no quarter where it dropped)
✓ H4 growing along with H1            (tests tracking V-entries)
✓ H5 ≥ 4 hooks configured             (loops auto-fire)
✓ H6 ≥ 1 session handoff per month    (continuity preserved)
```

Four or more green = loop is compounding.
Two or fewer green = loop is stagnating — audit which engine stopped.

---

## For contributors to claude-guardrails

When you add a feature to the template, ask: "which engine does this
accelerate?"
- Learning more? → Engine 1 (new audit skill, new V-starter)
- Easier consolidation? → Engine 2 (better `/skill-creator`,
  `/skill-relevant`)
- More cross-project reach? → Engine 3 (bridge-file tooling)
- Better continuity? → Engine 4 (handoff templates)

If a feature doesn't help any engine, ask whether it should exist at
all. The template's value is the loop — decoration without loop-value
is liability.

---

## Further reading

- `docs/methodology.md` — the full rule system
- `docs/capability-expansion.md` — Engine 2 in depth
- `docs/feedback-loop.md` — Engine 3 in depth
- `docs/cross-session.md` — Engine 4 in depth
- `docs/triangle-rule.md` — orthogonal anti-hallucination guard
