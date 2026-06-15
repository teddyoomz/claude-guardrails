<important if="EVERY new session, compaction, or resume. Read fully before ANY tool call.">
# 🚨 SESSION START — READ FIRST, EVERY SESSION, NO EXCEPTIONS

This file is the single-source summary of character, expectations, iron-clad
rules, past violations, and pre-commit workflow. Read every section of every
rule file before writing code. If you compact this file, you will drift.

**How to use this template:** Copy this file into your project as
`.claude/rules/00-session-start.md`. Fill in the marked `[FILL-IN]` sections
with your project specifics. The STRUCTURE is what matters — the methodology
is: numbered invariants, anti-examples, continuous improvement.

---

## 0. CHARACTER + EXPECTATIONS

User's stated expectations (customize per team):

- **[FILL-IN]** — e.g. "AI is capable but needs supervision; speed ≠ laziness"
- **[FILL-IN]** — e.g. "tests are first-class, not afterthoughts"
- **[FILL-IN]** — e.g. "follow the plan; don't scope-creep"
- **[FILL-IN]** — e.g. "every session must leave the toolkit sharper"

Tone rules (customize):
- **[FILL-IN]** — e.g. "respond in the user's native language for chat, English for code"
- **[FILL-IN]** — e.g. "short chat turns; no trailing 'here's what I did' paragraphs"

When in doubt: STOP and re-read this file. Better to delay than drift.

---

## 🧭 MASTER FLOW — Skill Orchestration (single source of truth)

**HOW to use skills — one canonical flow.** The orchestration that ties the
boot chain, audit skills, knowledge tools, and code-style skills together.
Customize the `[FILL-IN]` gates per project; the STRUCTURE (boot → classify
tier → tier-calibrated gates → verify → ship → session-end) is the methodology.

### Lifecycle (bookends)
- **Boot** (every session / `/clear` / compaction): invoke boot skills (e.g.
  `using-superpowers`) → read mandatory context (this file + handoff/active
  state) → **📊 graphify read** (if the project has a `graphify-out/`: read
  `graphify-out/GRAPH_REPORT.md` (god nodes + community structure) +
  `wiki/index.md` if present → build a codebase mental model **from the graph**
  before raw-file spelunking — cheaper / faster / clearer = token economy).
- **Session end**: **📊 `graphify update .`** (if `graphify-out/` — AST-only,
  no API cost, fast, **NOT a test**) → graph stays synced to this session's
  edits → next boot reads a fresher graph (🔁 compounding loop). THEN the
  `session-end` skill (handoff / active.md / checkpoint). Windows: `graphify`
  may not be on PATH → use `python -m graphify update .`.

### Per task — CLASSIFY the tier first, then fire that tier's gates
| Tier | Task | Skills (in order) | Gates | Tests |
|---|---|---|---|---|
| **T0** trivial | typo · label · comment · 1-line const · doc | — (boot is enough) | — | none (1-liners need no test) |
| **T1** small fix | regex · single-callsite · 1-file logic fix | `systematic-debugging` (root cause FIRST) | class-of-bug grep (1 instance or a class?) | **targeted-only** (NOT full suite) |
| **T2** feature | component · endpoint · ≥3 files · refactor · schema | `brainstorming` (design gate) → `writing-plans` → execute → `test-driven-development` | design gate · flow-simulate · class-of-bug · area `/audit-*` · anti-vibe (Rule of 3) | **full suite** |
| **T3** release | pre-deploy · merge · end-of-batch | `/audit-*` (all) · code-review / finish-branch | pre-commit checklist · `[FILL-IN: rules/migration probes]` · full green | full + **real-environment check** |

- **Verify (real-adversarial)**: user-visible code → prove against the REAL
  system (real browser / real client SDK / `[FILL-IN]`), never mocks. Active
  break-attempt mindset — try to BREAK your own code.
- **Escalate the tier** if scope grows mid-task (a T1 found architectural → T2).
- **Knowledge ops** (`graphify query` / `path` / `explain` · any wiki) for
  architecture / cross-module questions — read the graph, don't re-derive.
- **Ship**: commit + push immediately. Deploy ONLY on explicit user "deploy".

### Precedence (when rules conflict)
1. User's explicit instruction THIS turn
2. Project iron-clad rules / CLAUDE.md
3. This Master Flow + your skills
4. Code-style skills (e.g. **ponytail** — lazy/minimal code; yields to 1+2)
5. Default system prompt

---

## 1. IRON-CLAD RULES (NEVER BREAK)

Full detail in `01-iron-clad.md`. Summary below (one line per rule):

- **A. Bug-Blast Revert** — if change X broke feature Y → revert X immediately, don't patch forward
- **B. [FILL-IN: your deploy safety rule]** — e.g. "probe before + after every firestore rules deploy"
- **C. Anti-Vibe-Code** — Rule of 3 (extract after 3rd duplicate), crypto tokens (never Math.random), no secrets, minimal schema
- **D. Continuous Improvement** — every bug → test + rule + audit invariant; never just-fix
- **E. [FILL-IN: your data-layer rule]** — e.g. "backend reads our DB only, not third-party cache"
- **F. Triangle Rule** — 3 sources before replicating any external feature (external spec + plan + existing code)
- **G. Dynamic Capability Expansion** — deferred tools / new skills allowed, but rules A-F still apply
- **H. [FILL-IN: your data-ownership rule]** — e.g. "our data canonical, external sync = seed only"

---

## 2. PAST VIOLATIONS (anti-example catalog — DO NOT repeat)

Format: `### V{N} — YYYY-MM-DD — One-line summary`

Each violation includes: bug, root cause, fix (commit hash), rule added.

**How this file grows:** Every real bug in production adds a new V-entry.
DO NOT delete old entries — they're the reason the current rule exists.

### V1 — EXAMPLE — Deploy tightened rules, broke feature

- Bug: commit X deployed strict Firestore rules → feature Y returned 403
- Root cause: no probe-before-deploy
- Fix: `git revert` + commit Z restoring permissive rules for the affected path
- Rule added: B (Probe-Deploy-Probe mandatory on every rules deploy)

### V2 — EXAMPLE — Edit tool silent failure

- Bug: claimed "function added" after Edit call errored silently (typo in param name)
- Root cause: didn't grep to verify the function body actually landed
- Fix: added grep-pair verification to pre-commit checklist
- Rule added: pre-commit checklist item "grep case/handler pairs"

**[FILL-IN: add your project's V-entries as they happen]**

---

## 3. TOOLS — WHEN TO REACH FOR WHICH

| Task | Tool | Don't skip |
|---|---|---|
| Search codebase | `Grep` | Not bash `grep` |
| Find files | `Glob` | Not bash `find` |
| Read/edit files | `Read` / `Edit` / `Write` | Not bash `cat` / `sed` |
| Run tests | `Bash("npm test -- --run <path>")` | [FILL-IN your test cmd] |
| Deploy | [FILL-IN] | Requires explicit user authorization THIS TURN |
| Multi-step research | `Agent` subagent | To avoid bloating main context |
| Load deferred tool | `ToolSearch` | Per rule G — auto-load, no ask |

---

## 4. SKILLS — when to invoke

Only invoke skills that appear in the system prompt's available-skill list.
Never mention a skill name without actually calling it.

| Need | Skill |
|---|---|
| Full audit before release | `/audit-all` |
| Anti-vibe-code pass | `/audit-anti-vibe-code` |
| [FILL-IN your skills] | ... |

If a task needs a skill you don't have: build via `/skill-creator`
(user scope if reusable, project scope if specific to this project).

---

## 5. WORKFLOW CHECKLIST (per commit)

- [ ] Read SESSION_HANDOFF or equivalent cross-session state file
- [ ] Triangle Rule: external reference captured? Plan read? Existing code grepped?
- [ ] Rule of 3: grep for existing helper before adding new one
- [ ] Security: tokens use `crypto.getRandomValues`; no secrets committed
- [ ] Adversarial tests: ≥5 nasty inputs, not 1 happy path

### 🔥 PRE-COMMIT VERIFICATION (mandatory)

- [ ] `npm test -- --run` (or your equivalent) → ALL PASS
- [ ] `npm run build` → clean (catches Edit silent-fail, syntax errors)
- [ ] AREA AUDIT — skill matching what you touched
- [ ] GREP-PAIR for router/handler files — every `case 'x'` has matching `handle_x`
- [ ] END-TO-END mutation trace — if you added a write path, grep a caller + verify shape
- [ ] Commit → push immediately (never leave local)
- [ ] Deploy ONLY if user explicitly authorized THIS TURN

**Edit silent-fail trap:** a parameter typo on the Edit tool produces
`InputValidationError` that's easy to miss in a busy conversation. Every
"Edit succeeded" message must be paired with a grep that confirms the
expected text is now in the file.

---

## 6. HOW TO RESPOND

- [FILL-IN language rule] — e.g. "Thai chat, English code/commits"
- Chat turns short. No trailing "here's what I did" paragraph — user reads diff.
- At the END of a non-trivial change: 1-2 sentence summary + push status.
- When in doubt → STOP and re-read this file.
</important>
