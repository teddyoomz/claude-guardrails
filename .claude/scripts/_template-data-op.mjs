// _template-data-op.mjs — copy this for any one-off production data operation
// (migrate / backfill / bulk-update / cleanup / reclassify). Iron-clad Rule M.
//
//   node .claude/scripts/my-data-op.mjs            # DRY-RUN (default) — reports, writes NOTHING
//   node .claude/scripts/my-data-op.mjs --apply    # commits writes
//
// The five non-negotiables (Rule M):
//   1. It's a SCRIPT run from a trusted local/admin context — NOT bolted into app startup.
//   2. TWO-PHASE — dry-run by default; writes only behind --apply.
//   3. IDEMPOTENT — re-running with --apply yields 0 writes (skip already-done rows).
//   4. AUDITED — write an audit record (scanned/changed/skipped + before/after + ts).
//   5. FORENSIC — stamp prior value + a `*MigratedAt` marker on every mutated row.
//
// Replace the FILL-IN blocks with your DB client + your read/decide/write logic.
// Keep the structure: it's what makes the op safe to run, re-run, and roll back.

const APPLY = process.argv.includes('--apply');

// ── FILL-IN: connect your DB / admin client (load creds from env, never hardcode) ──
// const db = await connectAdmin(process.env.DB_URL, process.env.DB_KEY);
// Use the canonical path/collection/table your PRODUCTION app actually reads — a
// wrong path silently scans 0 rows and looks like a clean no-op.
const db = null; // TODO

// Pure decision: given a row, what (if anything) changes? Idempotency lives HERE —
// return {skip:true} for rows already migrated so a re-run writes nothing.
function decide(row) {
  // const already = row.fieldMigratedAt != null;
  // if (already) return { skip: true, reason: 'already-migrated' };
  // const next = transform(row.field);
  // if (next === row.field) return { skip: true, reason: 'no-change' };
  // return { skip: false, patch: { field: next } };
  return { skip: true, reason: 'TODO: implement decide()' };
}

async function main() {
  console.log(`── data-op ── ${APPLY ? 'APPLY (writing)' : 'DRY-RUN (no writes)'}`);
  const stamp = new Date().toISOString();
  const audit = { scanned: 0, changed: 0, skipped: 0, before: {}, after: {}, samples: [] };

  // ── FILL-IN: stream the rows you intend to touch (the real prod source) ──
  const rows = []; // TODO: await db.query(...) — the production records
  for (const row of rows) {
    audit.scanned++;
    const d = decide(row);
    if (d.skip) { audit.skipped++; continue; }
    audit.changed++;
    if (audit.samples.length < 5) audit.samples.push({ id: row.id, patch: d.patch });

    if (APPLY) {
      // FORENSIC: stamp prior value + a *MigratedAt marker alongside the change so the
      // mutation is traceable and reversible.
      const forensic = {};
      for (const k of Object.keys(d.patch)) {
        forensic[`${k}_legacyValue`] = row[k];
        forensic[`${k}MigratedAt`] = stamp;
      }
      // await db.update(row.id, { ...d.patch, ...forensic });  // TODO
    }
  }

  console.log(`scanned=${audit.scanned} changed=${audit.changed} skipped=${audit.skipped}`);
  console.log('sample patches:', JSON.stringify(audit.samples, null, 2));

  if (APPLY) {
    // AUDIT: persist a durable record of this run (a doc/row/file with the counts).
    // await db.insert('admin_audit', { op: 'my-data-op', ...audit, appliedAt: stamp });  // TODO
    console.log('applied. audit record written.');
  } else {
    console.log('dry-run only — re-run with --apply after sanity-checking the counts above.');
  }
  process.exit(0);
}

// Invocation guard — so importing this file in a test doesn't auto-run main().
import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

export { decide }; // unit-test the pure decision (idempotency, transform) without a DB
