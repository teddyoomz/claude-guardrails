<important if="editing source or config files in your stack">
## Stack Gotchas — [FILL-IN: your stack name]

This file is **stack-specific**. The STRUCTURE below is a template — replace
the examples with gotchas that have bitten your team. Every entry should be:

1. **Named** (numbered or titled)
2. **Has an anti-example** (a real bug that motivated it)
3. **Greppable** (so an audit skill can catch repeats)

---

### Example section: [Database framework]

Replace with your ORM / DB / query-builder specifics.

**1. [Naming convention for problematic API]**
> e.g. "`serverTimestamp()` fires 2x on snapshot (local estimate + server
> confirm). Don't compare timestamps directly — use `JSON.stringify(data)`
> equality instead."

Anti-example: if a timestamp-compare bug bit you, link to the V-entry here.

**2. [Data shape gotcha]**
> e.g. "REST API PATCH requires `updateMask.fieldPaths` — without it,
> the API replaces the entire doc, deleting fields you didn't send."

---

### Example section: [Build tool]

**1. [Parser quirk]**
> e.g. "Vite OXC parser crashes on IIFE in JSX like `{(() => {...})()}`.
> Extract to a component or pre-compute into a variable."

**2. [HMR / reload limitation]**
> e.g. "`manifest.json` changes require full browser reload, not HMR."

---

### Example section: [Frontend framework]

**1. [State management gotcha]**
> e.g. "`useEffect` depending on async-loaded props → stale closure.
> Use `useRef` or a loaded-flag state."

**2. [Prop-drill anti-pattern]**
> e.g. "if you're passing the same prop through 3+ components, lift to
> context or colocate state."

---

### Example section: [Integration with external service]

**1. [Auth flow gotcha]**
> e.g. "cookie-relay extension writes cached cookies via REST without
> Firebase auth token → rules must explicitly allow that path"

**2. [Rate-limit handling]**
> e.g. "external API returns 429 → wait 5-10s → retry (exponential
> backoff); don't retry immediately"

---

### Example section: [External reference tooling]

If your project replicates an external system (CRM, partner API, etc.),
list the tools you use to inspect it:

**1. Inspection tool**
> e.g. "`node scripts/intel.js <path>` — runs the triangle scan on
> external reference URL, saves JSON to `docs/external-scan/*.json`"

**2. Cache convention**
> e.g. "every feature commit includes the intel artifact in
> `docs/external-scan/<feature>-phase{N}.json` — permanent record of
> the spec you implemented against"

---

### Anti-patterns to grep (stack-specific examples)

Replace these with patterns specific to your stack. The goal: every time
you find a pattern that bit the team, add the grep here so audits catch it.

```bash
# Example: forbidden direct imports
grep -rn "from '.*dangerous-internal-module'" src/

# Example: config drift
grep -rn "DANGEROUS_FLAG.*true" config/

# Example: deprecated API usage
grep -rn "oldDeprecatedMethod\(" src/
```

Keep these greppable forever. An audit skill reads them and fails the
build if any violate.
</important>
