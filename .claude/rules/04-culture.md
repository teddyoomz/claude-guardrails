<important if="writing UI text, working with colors, dates, names, or cultural content">
## Domain + Culture Rules

Every product has cultural / domain constraints that are non-negotiable:
color taboos, date formats, text conventions, accessibility rules, legal
compliance. Document them here so AI-generated UI doesn't accidentally
violate them.

**How to use:** Replace the examples below with rules specific to your
product's users.

---

### Example: Color / visual constraints

**1. [Culture-specific color rule]**
> e.g. "Red text on patient names is forbidden — red on names = death in
> Thai culture. Avatar initials + ID badges must be white/gray."

**2. [Brand palette]**
> e.g. "Primary palette: [colors]. Accent: [color]. Never use gold —
> explicitly rejected by stakeholder."

**3. [Accessibility contrast]**
> e.g. "All text must pass WCAG 2.1 AA contrast on both light + dark theme.
> Minimum 4.5:1 for body, 3:1 for large headings."

---

### Example: Date + time formats

**1. [Display format]**
> e.g. "dd/mm/yyyy everywhere. Year in Buddhist era (พ.ศ.) for patient-facing,
> Gregorian (ค.ศ.) for backend."

**2. [Timezone handling]**
> e.g. "All server times in UTC. All displayed times in Asia/Bangkok.
> Never use `new Date().toISOString().slice(0,10)` — emits UTC date, not
> local. Use `thaiTodayISO()` helper from utils."

**3. [Weekday convention]**
> e.g. "Week starts Monday, not Sunday (local convention)."

---

### Example: Copy + microcopy

**1. [Error messages]**
> e.g. "Thai, polite, actionable. Not 'Error' — 'กรุณากรอกข้อมูล...'"

**2. [Labels]**
> e.g. "Concise, specific. 'เลขบัตรประชาชน' not 'เลข ID'."

**3. [CTA buttons]**
> e.g. "Verb-first. 'บันทึก' / 'ส่งข้อมูล' / 'ยกเลิก'."

**4. [Forbidden phrasing]**
> e.g. "Never use medical jargon without layperson explanation."

---

### Example: Data privacy / compliance

**1. [PII handling]**
> e.g. "National ID numbers stored encrypted. Display last-4 only in lists."

**2. [Audit trail]**
> e.g. "Every patient data read logged with user + timestamp.
> Export + deletion rights per [applicable regulation]."

**3. [Consent gates]**
> e.g. "Marketing opt-in required before any non-essential comm.
> Implicit consent insufficient."

---

### Example: Forbidden patterns

List UI patterns that have been explicitly rejected (document the reason):

**1. [Rejected pattern + reason]**
> e.g. "Infinite scroll in patient list — rejected because staff lose their
> place when switching tabs; use numbered pagination."

**2. [Rejected pattern + reason]**
> e.g. "Auto-advance forms — rejected because users need to review before
> submit; use explicit next button."

---

### Enforcement via audit skill

If your project has UI / cultural rules, create an audit skill like
`audit-ui-cultural-a11y` that greps for violations:

```bash
# Example: red text on patient names
grep -rn 'className.*name.*text-red' src/components/

# Example: wrong date format
grep -rn 'toISOString().slice(0, 10)' src/

# Example: gold color usage
grep -rn 'gold\|#FFD700\|bg-amber-4[0-9][0-9]' src/
```

Run this skill as part of `/audit-all` pre-release.
</important>
