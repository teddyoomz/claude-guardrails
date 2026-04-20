<important if="committing, pushing, deploying, or editing source files">
## Workflow — Commit · Push · Deploy · Test

### 🔥 Pre-Commit Checklist — RUN BEFORE EVERY `git commit` (no exceptions)

Mechanical checks. Each takes seconds. They catch silent failures that
AI-assisted development is especially prone to.

1. **TEST**: `[FILL-IN: npm test -- --run]` → ALL PASS.
   If you wrote new tests, verify they RAN and passed (not silently skipped).

2. **BUILD**: `[FILL-IN: npm run build]` → clean.
   Catches syntax / import / unreachable-code errors the REPL doesn't.

3. **AUDIT (area-specific)** — run the skill matching what you touched:
   - Backend data-layer change → `/audit-[your-data-layer-rule]`
   - API router/handler files → grep-pair: every `case 'x'` has matching `handle_x`
   - New collection / rule → `/audit-anti-vibe-code`
   - Whole-stack pre-release → `/audit-all`

4. **GREP-PAIR for API router / case-dispatcher files**:
   ```bash
   # Every "case 'x':" must have a matching "handle_x" definition
   grep "case '" path/to/file.js
   grep "^async function handle" path/to/file.js
   ```
   If counts don't match → silent Edit failure. Re-open + fix.

5. **END-TO-END on mutation paths**: if you added / changed a function that
   writes data or calls external APIs, trace at least ONE real caller and
   verify the shape it sends matches what you write.

**Anti-pattern to catch:** claiming "checked" after only reading the diff.
AI tracks intent, not output. Edit tool can silently fail on param typos.
Treat every "Edit succeeded" as unverified until grep confirms both sides.

---

### Commit + Push

1. `git add <files>` → `git commit` → `git push origin <branch>` → **stop**
2. **Every commit pushes immediately** — no local hoarding. Unpushed = invisible.
3. Push convention: [FILL-IN — direct to main OR PR workflow]
4. Don't `--no-verify` or `--no-gpg-sign` unless user explicitly asks.

---

### Deploy

1. Deploy ONLY if user explicitly authorized **THIS TURN**.
   Prior authorization does **not** roll over. Every deploy = new explicit ask.
2. Don't deploy without committing + pushing first.
3. [FILL-IN: any area of your repo that's commit-only, never deployed —
   e.g. backend-only files for local testing]
4. [FILL-IN: your deploy command + safety probes]

**Anti-pattern — repeated offense:** "user just said deploy X, and Y is
obviously better than X, so deploy Y too" — **NO**. Authorization was for X,
not for the session. Ask again.

---

### Testing

1. **All tests must pass before commit** — failure → fix code, not test
2. Known-limitation tests that always fail (e.g. integration tests requiring
   external auth) can be documented but shouldn't block. List them in a
   `KNOWN_FAILURES.md` — don't bury in comments.
3. Every bug / feature → **adversarial tests** (5+ nasty inputs — race
   conditions, edge cases, boundaries — NOT one happy path)
4. Never mock the database in integration tests. Use real emulator or skip.
5. [FILL-IN: your UI self-test policy]

### Test tool matrix (customize)

| Change type | Framework |
|---|---|
| Pure function | [FILL-IN — Vitest / Jest / pytest] |
| Database CRUD | [FILL-IN — real emulator integration] |
| Component render + click | [FILL-IN — RTL / Enzyme / Playwright] |
| Modal / form / nav flow | [FILL-IN — Playwright / Cypress E2E] |

---

### Codebase map / docs hygiene

- **`CODEBASE_MAP.md`** — update whenever you add/remove/rename/restructure
  source files. This is the "cold start" doc for new sessions.
- **Commit messages** — focus on **why**, not what. The diff shows what.
- **Session handoff** — update `SESSION_HANDOFF.md` (or equivalent) at the
  end of every session with: state, blockers, next action, resume prompt.

---

### Scope expansion mid-turn

When a user expands scope during a task ("also fix X", "make sure Y
propagates too"), **capture immediately** before continuing:

1. Add the expanded item to a todo list or the active session notes.
2. Confirm verbally: "Got it — also fixing X. Current task: A → then X."
3. Finish A, THEN X — don't interleave.

**Why:** absorbing scope silently causes two failures:
- A gets finished, X gets forgotten
- A doesn't finish because you pivoted mid-stream

**Anti-pattern:** "I'll remember to do X after A." You won't — long
conversations compress context and the user instruction gets lost.

**Enforcement:** if the project uses TodoWrite or equivalent, call it
immediately on scope expand. If not, state the updated task list in
your next reply so the user sees it was captured.

---

### Git safety

- Never edit `git config` without explicit user request
- Never force-push to main / master without explicit user request
- Never `git reset --hard` on published commits without explicit user request
- Merge conflict → resolve, don't discard
- Lock file unexpected change → investigate, don't delete

---

### Violations that ended up in the V-log (generic examples to learn from)

- **Deployed twice in one session without re-asking** → rule 02 now says
  "every deploy = new explicit THIS-TURN ask"
- **Edit silent-failed, claimed committed, runtime crashed** → rule 02 now
  says "grep-pair verify after every Edit to router/handler files"
- **Full test suite passed but deploy broke because build failed** → rule 02
  now says "npm run build is mandatory, not optional"

Your V-log in `00-session-start.md` should accumulate similar entries
specific to your project.
</important>
