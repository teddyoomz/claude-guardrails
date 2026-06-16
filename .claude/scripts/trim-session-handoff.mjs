// Trim SESSION_HANDOFF.md to the newest N `### Session` blocks (default 10) and,
// if the project uses a one-line-per-session Current State convention, the newest N
// of those bullets too. Overflow moves to .agents/sessions/session-handoff-archive.md
// (a dated batch prepended at the TOP). IDEMPOTENT — no-op when already within cap.
//
// Run as the LAST step of /session-end, after inserting today's block + bullet:
//   node .claude/scripts/trim-session-handoff.mjs            (KEEP=10, today's date)
//   node .claude/scripts/trim-session-handoff.mjs 12 2026-06-16   (KEEP, batch date)
//   KEEP=8 node .claude/scripts/trim-session-handoff.mjs
//
// Why a COUNT cap, not a byte cap: a size trigger ("archive when > 180 KB") lets the
// handoff accumulate dozens of session blocks — tens of thousands of boot tokens —
// while still UNDER the trigger, so it never fires and every session overpays at boot.
// Count, don't weigh. Per-session detail lives in .agents/sessions/*.md checkpoints +
// docs/violation-log.md, so trimming the live file loses nothing.
// See docs/starter-violations.md V-starter-16.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const SH = 'SESSION_HANDOFF.md';
const AR = '.agents/sessions/session-handoff-archive.md';
const args = process.argv.slice(2).filter((a) => a !== '');
const KEEP = Number(process.env.KEEP || args.find((a) => /^\d+$/.test(a)) || 10);
const TODAY = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) || new Date().toISOString().slice(0, 10);

if (!existsSync(SH)) { console.error(`trim: ${SH} not found — aborting`); process.exit(1); }
const lines = readFileSync(SH, 'utf8').split('\n');

const csIdx = lines.findIndex((l) => l.startsWith('## Current State'));
const sess = lines.map((l, i) => [l, i]).filter(([l]) => l.startsWith('### Session ')).map(([, i]) => i);
if (sess.length === 0) { console.log('trim: no `### Session` blocks — no-op'); process.exit(0); }

// Optional: a per-session one-line Current State bullet, e.g. `- **NEW (2026-06-16) ...`
// or `- **Date (...`. Only present if the project uses that convention; else [].
const SESS_BULLET = /^- \*\*(NEW|Date|Session)[ (]/;
let bullets = [];
if (csIdx >= 0) {
  for (let i = csIdx + 1; i < sess[0]; i++) if (SESS_BULLET.test(lines[i])) bullets.push(i);
}

if (sess.length <= KEEP && bullets.length <= KEEP) {
  console.log(`trim: already within cap (${sess.length} sessions, ${bullets.length} session-bullets) — no-op`);
  process.exit(0);
}

const dateOf = (idx) => (lines[idx].slice(12).split(/ [—-] /)[0] || lines[idx].slice(12)).trim();
const firstArch = dateOf(sess[Math.min(KEEP, sess.length - 1)]);
const lastArch = dateOf(sess[sess.length - 1]);

// kept / dropped slices
const csKeep = bullets.length > KEEP ? lines.slice(bullets[0], bullets[KEEP - 1] + 1) : (bullets.length ? lines.slice(bullets[0], bullets[bullets.length - 1] + 1) : []);
const csDrop = bullets.length > KEEP ? lines.slice(bullets[KEEP], bullets[bullets.length - 1] + 1) : [];

let sessKeep, sessDrop;
if (sess.length > KEEP) { sessKeep = lines.slice(sess[0], sess[KEEP]); sessDrop = lines.slice(sess[KEEP]); }
else { sessKeep = lines.slice(sess[0]); sessDrop = []; }
const strip = (a) => { while (a.length && !a[0].trim()) a.shift(); while (a.length && !a[a.length - 1].trim()) a.pop(); return a; };
strip(sessKeep); strip(sessDrop); strip(csDrop);

// rebuild the live file
const head = lines.slice(0, csIdx >= 0 ? csIdx + 1 : sess[0]);
const footer = ['', '---', '',
  `\u{1F4C2} **Older sessions (\`${firstArch}\` and earlier) → ` +
  '`.agents/sessions/session-handoff-archive.md`** (cold storage, NOT read at boot).', ''];
const out = csIdx >= 0
  ? [...head, '', ...csKeep, '', ...sessKeep, ...footer]
  : [...head, ...sessKeep, ...footer];
writeFileSync(SH, out.join('\n'), 'utf8');

// prepend overflow to the archive (newest batch on top)
if ((sessDrop.length || csDrop.length) && existsSync(AR)) {
  const ar = readFileSync(AR, 'utf8').split('\n');
  let ins = ar.findIndex((l) => l.startsWith('## Archived '));
  if (ins < 0) ins = ar.length;
  const nDropped = sessDrop.filter((l) => l.startsWith('### Session ')).length;
  const batch = [`## Archived ${TODAY} — SESSION_HANDOFF overflow: sessions \`${firstArch}\` → \`${lastArch}\``, ''];
  if (sessDrop.length) batch.push(`### Session blocks (${nDropped})`, '', ...sessDrop, '');
  if (csDrop.length) batch.push('### Current State index entries', '', ...csDrop, '');
  batch.push('---', '');
  ar.splice(ins, 0, ...batch);
  writeFileSync(AR, ar.join('\n'), 'utf8');
} else if (sessDrop.length || csDrop.length) {
  console.warn(`trim: WARNING — ${AR} missing; overflow DELETED (create the archive file to preserve it)`);
}

// self-check
const after = readFileSync(SH, 'utf8').split('\n');
const nSess = after.filter((l) => l.startsWith('### Session ')).length;
const nBul = after.filter((l) => SESS_BULLET.test(l)).length;
if (nSess > KEEP || nBul > KEEP) { console.error(`trim SELF-CHECK FAILED: ${nSess} sessions / ${nBul} bullets remain`); process.exit(1); }
console.log(`trim: kept ${nSess} sessions + ${nBul} session-bullets; archived ${sessDrop.filter((l) => l.startsWith('### Session ')).length} blocks + ${csDrop.filter((l) => l.trim()).length} bullets; ~${Math.round(Buffer.byteLength(after.join('\n')) / 4)} tokens`);
