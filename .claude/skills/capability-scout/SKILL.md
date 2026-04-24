---
name: capability-scout
description: Decide quickly whether a task needs a built-in tool, a deferred tool, an existing skill, or a new skill. Returns a ranked recommendation + scope (user vs project) + next-action command. Invoke when you're unsure which capability to reach for, or when the same manual pattern has repeated ≥ 3 times and it's time to promote (Rule G.2).
---

# /capability-scout

**Input:** a one-line task description.
**Output:** ranked recommendation + reason + next-action command.

This skill is the automated form of `docs/capability-expansion.md`.
Humans invoke it; agents can also self-invoke when uncertain.

**This skill does NOT execute the task.** It recommends. Humans (or the
invoking agent) then run the chosen path.

## CS1 — Task classification

Categorize the input task into one of:
- **Read-only** (look up state, inspect files, check status) → Tier 1/2/3
- **Write** (modify files, call APIs, create resources) → Tier 1/3/5
- **Procedural** (multi-step workflow the agent runs repeatedly) →
  Tier 3/4 (skill territory)
- **Domain audit** (grep for pattern violations) → Tier 3/4

If uncertain, ask the requester: "what does success look like?" and
re-classify. Mis-classification sends you to the wrong tier and wastes
the rest of the flow.

## CS2 — Built-in tool match (Tier 1)

Before anything else, check if a built-in does it:

| Task keyword | Built-in |
|---|---|
| read / open / inspect file | `Read` |
| search content in files | `Grep` |
| find files by name / pattern | `Glob` |
| run command / test / build | `Bash` |
| modify a file in place | `Edit` |
| create new file / rewrite | `Write` |
| open question across codebase | `Agent(subagent_type: Explore)` |

If yes → return: **"Use built-in `<tool>` directly. No ceremony."**

## CS3 — Deferred-tool match (Tier 2)

If the system-reminder lists deferred tools, grep their names for task
keywords. Common families:

| Task family | ToolSearch query |
|---|---|
| Browser automation | `query:"Claude_in_Chrome" max_results:30` |
| Desktop automation | `query:"computer-use" max_results:30` |
| Scheduled / background | `query:"schedule" max_results:10` |
| Web research | `query:"web" max_results:5` |
| Preview / screenshot | `query:"preview" max_results:15` |

Return: **`ToolSearch query:"<keyword>" max_results:<N>`** — then call
the loaded tool.

**Anti-pattern to catch (CS3-AP):** loading `select:<one_tool>` at a
time. Keyword-search grabs the whole bundle per round-trip.

## CS4 — Existing skill match (Tier 3)

Grep the user-invocable skill list (shown in the system prompt).
Matching heuristic:

- Keyword match on the skill description (first line is the trigger)
- If 2+ skills match, pick the more specific one (narrower wins)
- If 0 match, proceed to CS5

Return: **`Skill(skill:"<name>", args:"<task>")`** — with the literal
args the skill expects.

## CS5 — Promotion trigger (Tier 4 / Rule G.2)

Ask all three:
1. Have I done this same task ≥ 3 times in this session or recent
   history?
2. Is the pattern reusable (not one-shot / not this-bug-specific)?
3. Can it be expressed as grep-auditable invariants OR a deterministic
   decision tree?

If **YES to all three** → promote. Recommend:

- **Scope**: user-level (`~/.claude/skills/<name>/SKILL.md`) if pattern
  is stack-agnostic / reusable across projects. Project-level
  (`.claude/skills/<name>/SKILL.md`) if domain-specific.
- **Template**: copy `.claude/skills/_template/SKILL.md` → replace
  `{TOPIC-LETTER}` with your chosen prefix (e.g. `CS`, `RN`, `WF`).
- **Format**: frontmatter (`name` + `description`) + numbered invariants
  + report format.
- **Registration**: if it's an audit skill, add to `/audit-all` at the
  appropriate tier.

Return: **"Promote. Scope: `<user|project>`. Path: `<absolute-path>`.
Starter: `cp .claude/skills/_template/SKILL.md <path>`."**

If **NO to any** → fall through to CS6 or CS7.

## CS6 — Ask-user gate (Tier 5)

Require user approval ONLY for:
- Paid API calls (Stripe, OpenAI, Twilio, any metered third-party)
- New Anthropic Plugin / connector install
- Writes to external shared state (Slack post, email send, PR comment,
  Linear ticket, cross-account cloud resource)
- Destructive irreversible actions (delete data, rotate prod secret,
  force-push shared branch, drop table)

If task falls in any category → return: **"Ask user. State:
`<destination>`, `<credential used>`, `<reversal plan if fails>`."**

**Do NOT ask for:** loading a tool, invoking a skill, reading a new
file, running a read-only command. These are Rule G auto-allowed.

## CS7 — Default fallback

If CS2-CS6 all miss, the task is genuinely ad-hoc. Recommend:
- Run once with existing tools (best guess — but verify per CS8!)
- Log it (so G.2 can count repetitions later)
- If it feels heavy → consider asking the user whether to plan further

Return: **"Ad-hoc. Use `<best tool guess>`. If this recurs, promote on
3rd repetition (Rule G.2)."**

## CS8 — Research + auto-install (Tier 3.5, added v0.3)

**When CS4 says "no existing skill matches" AND the task touches anything
external** (third-party API, library method, protocol, config schema,
vendor quirk), don't fall through to CS7. Instead:

1. Invoke `/research-gap` — runs a 5-tier search (local → project docs →
   official docs via WebFetch → WebSearch → capability registries).
2. If research reveals "capability exists but isn't loaded", invoke
   `/skill-autoinstall` — handles 4 install paths (Anthropic bundled,
   deferred tools via ToolSearch, MCP registry via
   `mcp__mcp-registry__list_connectors`, community skills via git clone).
3. Only after research + install path is exhausted → CS7 ad-hoc.

**Why this tier:** CS2-CS6 assume you know the capability landscape.
Once you hit "I don't know if what I need exists", you've shifted from
classification to discovery. `/research-gap` + `/skill-autoinstall` is
the discovery protocol.

**Golden trigger to insert CS8:** if you catch yourself about to write
"I think the API is..." or "the usual way is..." — STOP. Route through
CS8 before writing anything.

Return: **"Route through CS8. Invoke `/research-gap` with query: `<gap>`.
Expect Tier-5 registry hit OR Tier-3 official-docs answer. Then
`/skill-autoinstall` if install needed, or use verified answer direct."**

---

## Invocation examples

### Example 1 — audit a codebase

```
/capability-scout "check for Math.random token leaks"
```

→ CS4 match: `/audit-anti-vibe-code` (covers AV2 — Math.random for
tokens).
Return: `Skill(skill:"audit-anti-vibe-code")`.

### Example 2 — 3rd manual occurrence

```
/capability-scout "generate a release note from git log since last tag"
```

→ CS5 match: pattern is deterministic, reusable across projects.
Return: "Promote. Scope: user (reusable). Path:
`~/.claude/skills/release-notes/SKILL.md`. Starter:
`cp .claude/skills/_template/SKILL.md <path>`."

### Example 3 — native app automation

```
/capability-scout "screenshot the macOS Finder window"
```

→ CS3 match: computer-use MCP.
Return: `ToolSearch query:"computer-use" max_results:30` →
then `mcp__computer-use__screenshot`.

### Example 4 — paid API

```
/capability-scout "generate image via OpenAI DALL-E"
```

→ CS6 match: paid API.
Return: "Ask user. State: OpenAI account, API key source, fallback
behavior if quota exceeded."

### Example 5 — built-in is enough

```
/capability-scout "find all files matching src/**/*.test.js"
```

→ CS2 match: `Glob`.
Return: "Use built-in `Glob` directly. No ceremony."

---

## Report format

```
### /capability-scout — "<input task>"

Classification: <Read-only | Write | Procedural | Domain audit>
Tier: <1..5>
Recommendation: <literal command or ToolSearch query or promotion plan>
Reason: <1-line why this tier over the others>
```

---

## How to grow this skill

When a new class of capability gap shows up (new MCP server, new
`anthropic-skills` bundle, new plugin pattern), add CS8, CS9, ... with
matching rules. **Numbered invariants never get reassigned** — if CS3
becomes obsolete, mark DEPRECATED but keep the number. V-entries may
reference it.

**Anti-pattern to catch (CS-AP):** CS5 firing without a real repetition
count. Promotion should be **earned**, not pre-emptive. The 3-count is
the whole point of G.2.
