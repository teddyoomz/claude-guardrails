# Capability Expansion (Rule G + G.2)

**When the agent hits a task it can't do with the built-in toolkit, what
happens?**

Three options, in priority order:

1. **Discover** — find an existing tool or skill that fits
2. **Promote** — if the same manual pattern repeats 3+ times, package it as
   a skill
3. **Ask** — only for external-state writes, paid APIs, or destructive
   actions

This document is the decision tree. The `/capability-scout` skill is the
automated form of the same flow — humans invoke it, but agents can also
self-invoke when uncertain.

---

## The decision tree

```
Task arrives
│
├─ Can a built-in tool do it? (Read/Write/Edit/Bash/Grep/Glob/Agent/...)
│   └─ YES → use directly, no ceremony
│
├─ Is there a deferred tool in <system-reminder>?
│   └─ YES → ToolSearch query:"<keyword>" max_results:30
│            (bulk-load related set) → then call. NO ask. (Rule G)
│
├─ Is there a user-invocable skill that matches?
│   └─ YES → invoke via Skill tool. NO ask.
│
├─ Have I done this same task ≥ 3 times in this session/project?
│   └─ YES → PROMOTE to a skill now (Rule G.2)
│            Scope: user-level if reusable across projects,
│                   project-level if domain-specific.
│            Use /skill-creator, or hand-copy _template/SKILL.md.
│
├─ Does it need paid API / Anthropic Plugin install / external write?
│   └─ YES → ask user (state destination + credential + reversal plan)
│
└─ Otherwise → build ad-hoc with what's available, but LOG it
               ("did X manually") — if it recurs, Rule G.2 fires.
```

---

## Why each tier exists

### Tier 1 — Built-in tools

Fastest, zero context cost, no permission surface. No reason to wrap.
Just call.

### Tier 2 — Deferred tools (ToolSearch)

The system may list dozens of specialty tools by name only, without
schemas. Loading them all upfront wastes context. ToolSearch loads on
demand.

**Bulk-load related sets in one query** — e.g.
`query:"computer-use" max_results:30` grabs the whole computer-use
toolkit in one round-trip. Don't use `select:<one_tool>` for individual
tools in a known bundle.

**Hard constraint (Rule G):** loading a tool ≠ license to use it in
restricted areas. If `Write` can now touch `/api/external/*`, Rule E
(or your project's data-boundary rule) still forbids it there. **Audit
rules override capability.**

### Tier 3 — Existing skills

Before building anything new, grep the skill list in the system prompt.
If a description kinda-matches, try invoking — cheap to find out.

**Matching heuristic:**
- Keyword match on the skill description (first line is the trigger)
- If 2+ skills match, pick the more specific one (narrower wins)
- If 0 match, proceed to Tier 4

### Tier 4 — Promotion (Rule G.2)

If you manually did the same thing 3+ times, you've paid enough tax.
Package the pattern into a skill file.

**Promotion criteria (all three must be YES):**
1. Same task ≥ 3 times in this session or recent project history
2. Reusable (not one-shot / not this-bug-specific)
3. Expressible as grep-auditable invariants OR a deterministic decision
   tree

**Scope decision:**
- **User scope** (`~/.claude/skills/<name>/SKILL.md`) — reusable across
  projects (stack-agnostic, or applies to any project with similar stack)
- **Project scope** (`.claude/skills/<name>/SKILL.md`) — specific to
  this codebase or domain

**Two rules for the new skill file:**
- Follow `_template/SKILL.md` format (frontmatter + numbered invariants
  + report format)
- If it's an audit pattern, register in `/audit-all` at the right tier

### Tier 5 — Ask user

Reserve for things the agent genuinely can't decide:
- Paid API integrations (cost implication)
- Installing a new Anthropic Plugin (trust surface)
- Writes to external shared state — Slack, email, JIRA, PR comments,
  cross-account cloud resources (data-exfil risk)
- Anything labelled "destructive" or "irreversible"

**Never ask for tool loading or skill invocation** — those are Rule G
auto-allowed. Asking wastes user time and trains them to rubber-stamp
future asks.

---

## Anti-patterns

### AP1 — Asking before trying

"Should I use the Read tool?" — No. Just use it. Ask only when the
decision tree branches to Tier 5.

### AP2 — Manual repetition without promotion

Running the same 3-step bash incantation 5 times in a session because
"it's quick". Rule G.2 fires on the 3rd time — promote to a skill.

### AP3 — Scope-creep via capability

"I loaded `WebFetch` via ToolSearch, so now I can fetch any URL from
anywhere." — No. Data-boundary rules (E) and audit rules override.
Loading changes what's POSSIBLE, not what's ALLOWED.

### AP4 — Over-promotion

Making a skill for a 1-time task. Skills have maintenance cost — every
skill adds to the discovery surface. Only promote after G.2's 3-count.

### AP5 — Pre-emptive tool loading

ToolSearch is on-demand. Don't pre-load a bundle because "I might use
these later" — it pollutes context with schemas you won't invoke.

### AP6 — Promoting without grep-auditability

New skill has no grep pattern, no numbered invariants, no report format
— it's a paragraph of prose. That's documentation, not a skill. Refactor
into invariants or demote to a `docs/` page.

---

## How this interacts with Rule D

Rule D (Continuous Improvement) is the sibling: **every bug → test +
rule + audit skill invariant**. Rule G.2 is its proactive twin: **every
repeat → skill**. Together:

- D catches **bugs** and hardens rules
- G.2 catches **repetition** and hardens workflows
- Both grow the toolkit over time; neither summarizes it away

A new skill from G.2 can later gain D-triggered invariants (real bugs
that bit while using the skill). The two rules compound.

---

## Measuring Rule G + G.2 adoption

Signals the team is using capability expansion well:
- Skill count grows month-over-month (especially workflow / procedural
  skills, not just audit skills)
- `/capability-scout` invoked by AI sessions when stuck (log it)
- Tool loads via ToolSearch appear in transcripts (not just built-ins)
- Session repetition count of "did X manually N times" trends down
- V-log has zero entries for "agent asked user for routine tool load"

Signals drift:
- AI sessions ask user "should I use X?" for routine tool loads
- Same manual pattern in 10+ session transcripts, no skill
- Skills library static for months while bug-rate steady or up
- `.claude/skills/` contains only audit-*, no workflow/procedural skills
- Tool-loading logs show `select:<one>` patterns (one-at-a-time waste)

---

## How to grow this doc

Append new anti-patterns as you discover them. Link V-entries when a
capability-misuse bug ships (e.g. a hypothetical V11: "agent loaded
WebFetch and fetched prod secrets"). The doc is the canonical reference
for Rule G + G.2; the `/capability-scout` skill implements it.
