---
title: Research Mode — how the agent avoids confident hallucinations
audience: anyone who wants to understand why the template forces research before writing
tldr: "I think probably X" → STOP. Invoke /research-gap. Five-tier search before any guess becomes code. Admitting ignorance costs 30 seconds; shipping a hallucination costs hours plus a V-entry.
---

# Research Mode

> **The #1 way AI-assisted dev ships bugs is confident hallucination.**
> The model fills in a plausible-looking URL / field / method / config
> based on training-data pattern-matching, the code type-checks, the
> tests mock the invention, and production fails.
>
> This template forces a research pass before writing, as a rule
> (Rule G.3) backed by a skill (`/research-gap`) backed by auto-install
> tooling (`/skill-autoinstall`).

---

## The failure mode in 4 stages

1. **Gap appears** — you need to know a fact about an external thing
   (API endpoint, config option, library method).
2. **Mental autocomplete fires** — training data surfaces a plausible
   answer. It *feels* like knowledge.
3. **Confidence survives the write** — the code looks right. Maybe you
   even write a test for it (that also uses the plausible answer).
4. **Production disagrees** — the real system has a different URL /
   field / method. The code was never connected to reality.

The bug is caught **in production**, not in dev, because dev had no
ground-truth check. The V-log catalogs this as a class of its own —
V-starter-10 (`docs/starter-violations.md`) is exactly this pattern.

---

## The mitigation: treat gaps as detectable events

Research Mode names the trigger:

> **If you catch yourself completing a phrase with "I think", "probably",
> "the standard way", "usually", or "it should be..." — STOP.**

At that moment, you have a **gap**. Before writing anything that depends
on the gap-answer, invoke `/research-gap`. The skill runs a 5-tier
search (local code → project docs → official docs → WebSearch → MCP/
skill registry). If it finds the answer, proceed. If it doesn't, escalate
to the user with the search context so they can help efficiently.

**Why the trigger works:** the "I think" phrase is a metacognitive flag
the model already produces. The rule makes that flag load-bearing.

---

## Three skills, one philosophy

The template ships three skills that work together:

### `/research-gap` — the verification step
When you detect a gap, this skill runs the 5-tier search and returns a
verified answer with source citation. Invariants RG1-RG8.

### `/skill-autoinstall` — the capability-gap step
If the 5-tier search reveals "the capability you need exists but isn't
installed", this skill finds + installs the missing tool/skill/MCP.
Invariants SA1-SA7. Auto-installs safe classes (Rule G); asks user for
external-write classes.

### `/capability-scout` — the classifier
When uncertain which tier / tool applies, this skill classifies and
recommends. Invariants CS1-CS7. It delegates to the other two for
execution.

The philosophy: **make admitting ignorance cheap, make guessing
expensive.**

---

## Interaction with existing rules

| Rule | Role in research mode |
|---|---|
| F (Triangle) | Research IS the capture step. Rule F says "capture before writing"; research-gap is how |
| G (Dynamic capability) | Authorizes auto-loading tools/skills found via research. No ask for read-only. |
| G.2 (≥3 repetitions) | If the same research question recurs → promote the research result to a project doc or skill |
| G.3 (Research before guessing) | The rule that mandates the skill. New in claude-guardrails v0.3. |
| D (Continuous improvement) | Every time research prevents a hallucination = PRE-SHIP V-entry. Builds the catalog. |

---

## When NOT to research

Research is cheap but not free. Skip it when:

- The fact is in your **immediate prior turn's output** (it's context,
  not memory)
- You're calling a **built-in tool** whose schema is already in the
  system prompt (Read, Edit, Bash, Grep, Glob)
- The question is about **your own project's code** and you've already
  grepped it
- The cost of being wrong is **near-zero** (throwaway script,
  exploratory REPL)

Research every time = performative. Research when a real gap surfaces =
load-bearing.

---

## Auto-install: when the gap is capability, not knowledge

Sometimes research reveals "you can't do X because you don't have the
tool for X". `/skill-autoinstall` handles this:

- **Zero-cost installs** (Anthropic-bundled skills, deferred-tool
  loads) auto-execute under Rule G
- **User-consent installs** (MCP servers, community skills, OAuth)
  return an install plan for user approval

This closes the loop: not only does the agent research before guessing,
it also installs the capability needed to do the task correctly.

**Example trajectory:**
```
User: "Extract the data from this PDF into a spreadsheet"
Agent: [gap detected — I don't have a direct PDF tool loaded]
       /research-gap "extract PDF tables + write to xlsx"
       → Tier 5: anthropic-skills:pdf + anthropic-skills:xlsx both
         pre-bundled
       → /skill-autoinstall: SA2 match, zero install needed
       → Skill(skill:"anthropic-skills:pdf") + 
         Skill(skill:"anthropic-skills:xlsx")
Result: works in one turn, no hallucinated PDF-parsing code.
```

---

## The 5 tiers in detail

### Tier 1 — Local codebase
**Why first:** highest authority (it runs here), no network, project-
convention-matching. `grep -rn` + `find . -name "*<keyword>*"`.

### Tier 2 — Project docs + V-log
**Why second:** captures this-project's-version. Past V-entries may
document the exact gap from a prior session.

### Tier 3 — Official external docs
**Why third:** verified source but generic (not version-pinned to your
install). `WebFetch` + version cross-check.

### Tier 4 — WebSearch
**Why fourth:** broader but noisier. Use for questions official docs
don't address (e.g. a specific stack interaction).

### Tier 5 — Capability registries
**Why fifth:** when the gap is "tool missing", not "knowledge missing".
Checks deferred tools, Anthropic skills, MCP registry, community
skills.

Result is progressive — stop at the first tier that answers. You rarely
reach Tier 5 unless the problem genuinely requires a new capability.

---

## Anti-patterns Research Mode prevents

### Anti-pattern R1: "Quick answer from training data"
Model answers without checking. Training data may be stale or wrong for
this user's version. Research Mode: verify version-matched source.

### Anti-pattern R2: "Ask the user instead of researching"
Lazy. The user has less context than the agent (they haven't been
reading files). Research first; if stuck, THEN ask with the research
context.

### Anti-pattern R3: "Research everything"
Performative. Research when a gap is real, not to pad turns. Rule G.2
tracks real gaps — research-gap without a real gap wastes context.

### Anti-pattern R4: "Install everything speculatively"
`/skill-autoinstall` is demand-driven, not pre-emptive. Installing
"might be useful" skills accumulates settings cruft + attack surface.

### Anti-pattern R5: "Research once, cache forever"
External APIs change. The answer you verified in January may be wrong
in June. Re-research when you see unexpected behavior — don't assume
cached knowledge still applies.

---

## How to measure Research Mode adoption

- `/audit-health` H1 (V-entry count) with PRE-SHIP entries citing
  "would have hallucinated X" → evidence of gap-prevention
- Commit messages mentioning `/research-gap` invocations → adoption
  signal
- Decreasing rate of `"I think X"` / `"probably Y"` / `"should be Z"`
  language in agent responses → cultural adoption
- Zero or falling count of "guessed API shape" V-entries over time →
  outcome measure

Target: after 3 months of adoption, Research Mode should fire on ~80%
of external-reference tasks and ~20% of internal-refactor tasks (the
former have more unknowns).

---

## Further reading

- `docs/triangle-rule.md` — the pattern research-gap implements
- `docs/capability-expansion.md` — where research-gap fits in the
  capability decision tree
- `docs/growth-engine.md` — how research-gap feeds Rule D's V-log
- `.claude/skills/research-gap/SKILL.md` — the skill itself
- `.claude/skills/skill-autoinstall/SKILL.md` — the install companion
- `.claude/skills/capability-scout/SKILL.md` — the classifier
