---
name: audit-{topic}
description: [One-paragraph elevator. Who uses this skill, when, what it catches. Be specific — this becomes the trigger description Claude reads to decide when to invoke.]
---

# /audit-{topic}

[One paragraph: what this skill checks for. Use specific nouns — "form
validation flows" not "validation stuff". The reader should understand
the scope in < 30 seconds.]

**This skill does NOT auto-fix.** It reports. Humans decide on fixes.

## {TOPIC-LETTER}1 — [Invariant name]

[1-sentence description of what's being checked + why it matters.]

```bash
# Grep pattern to detect violation
grep -rnE "pattern-here" src/
```

**Fix:** [what to do when caught]

**Evidence:** [REQUIRED — one of:]
- `V-example: V{N}` (YYYY-MM-DD) — citation to the V-entry in
  `.claude/rules/00-session-start.md` that motivated this invariant
- `PRE-SHIP — no real-world bug yet, added based on <pattern>`
  (pattern = starter-violations reference OR known industry class)

A invariant without evidence decays. `/audit-rules` LR4 greps every
invariant for a `V[0-9]+` citation or `PRE-SHIP` marker — missing
either = findings.

## {TOPIC-LETTER}2 — [Next invariant]

...

## {TOPIC-LETTER}N — [Last invariant]

...

---

## How to grow this skill

Every time a bug in this area ships, add the next numbered invariant.
Grep pattern MUST be specific enough that false-positive rate is < 10%.
If grep produces noise, add a second filter or split into 2 invariants.

Invariant numbers never get reassigned. If AV3 becomes obsolete, mark it
DEPRECATED but keep the number — the V-log references it.

## How to register

1. Save this file as `.claude/skills/audit-{topic}/SKILL.md`
2. List the skill in `/audit-all` SKILL.md at the appropriate tier
3. Update README or docs so new team members know this exists

## Report format

```
### /audit-{topic} — Run 2026-MM-DD

🔴 Critical — N findings
[{topic}{N}] file:line — what's wrong
...

🟠 Medium — N findings
...

🟢 Clean — {which invariants passed}

Summary: N findings, X critical. [Block release | OK to ship]
```

## Checklist for authoring a new audit skill

- [ ] Filename: `audit-{kebab-case-topic}/SKILL.md`
- [ ] Frontmatter has `name` + `description` (description triggers discovery)
- [ ] Each invariant has: number, name, 1-sentence why, grep pattern, fix, evidence
- [ ] **Every invariant cites `V-example: V{N}` OR marks `PRE-SHIP`** (methodology principle 6)
- [ ] Grep patterns tested against a real project (no false-positive flood)
- [ ] Skill listed in `/audit-all` at appropriate tier
- [ ] `/skill-relevant` updated so the skill gets surfaced (path/keyword/commit rules)
- [ ] README mentions when to run this skill (pre-release, per-PR, weekly)
- [ ] If the skill researches external knowledge: cross-link `/research-gap`
- [ ] If the skill can recommend installs: cross-link `/skill-autoinstall`
