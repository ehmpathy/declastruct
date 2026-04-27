# self-review r3: has-questioned-questions

🍵 tea first.

---

## comprehensive question audit

i read through the vision line by line to surface ALL questions, not just obvious ones.

---

## questions from the wish

### q1: env var access [answered]
- logic: process.argv doesn't include them
- terraform pattern confirms this approach

### q2: multiline vs single line [answered]
- logic: single line = one triple-click to select
- no shell escape issues

### q3: is simpler approach acceptable? [wisher]
- wish TEXT says "only replace --wish and --into flags"
- our approach doesn't preserve any flags
- **wisher must confirm**: static output ok?

### q4: is npx the right default? [answered]
- logic: npx works universally
- pnpm/yarn users can adapt

### q5: does format deviation matter? [wisher]
- wish example shows `🌊 planned for 4 resources`
- we use current format `🌊 declastruct plan`
- **wisher must confirm**: current format ok?

---

## questions from the vision details

### q6: what if plan has no changes? [answered]
- logic: still show hint, user may want to verify
- "0 resources" is informative

### q7: should hint have blank line before it? [answered]
- logic: no, keep tree structure consistent

### q8: what about the exact phrasing "to apply, run:"? [answered]
- terraform uses similar phrasing
- imperative, clear, direct

### q9: what about paths with spaces or special characters? [answered]
- the path is quoted implicitly by being on its own line
- shell copy-paste handles this
- no escaping needed for typical paths

### q10: what about CI/automation contexts? [answered]
- hint is stdout, can be parsed programmatically
- CI can grep for "declastruct apply" if needed
- doesn't interfere with automation

### q11: is the tree structure (└─) the right visual? [answered]
- matches current declastruct output style
- consistent visual language

---

## questions from edge cases

### q12: what if wish file moves after plan? [answered]
- plan file contains absolute wish path
- apply will fail if wish moved — expected behavior
- not our problem to solve

### q13: what if user runs plan multiple times? [answered]
- each plan overwrites the plan file
- hint always shows correct path
- no issue

---

## final triage summary

| # | question | verdict | reason |
|---|----------|---------|--------|
| 1 | env var access | [answered] | logic: can't detect |
| 2 | multiline | [answered] | logic: single line easier |
| 3 | simpler approach | [wisher] | wish says preserve flags |
| 4 | npx default | [answered] | logic: universal |
| 5 | format deviation | [wisher] | wish shows different format |
| 6 | no changes | [answered] | logic: show anyway |
| 7 | blank line | [answered] | logic: tree consistency |
| 8 | phrasing | [answered] | terraform pattern |
| 9 | special chars | [answered] | shell handles it |
| 10 | CI/automation | [answered] | grep-able |
| 11 | tree visual | [answered] | matches style |
| 12 | wish moves | [answered] | expected failure |
| 13 | multiple plans | [answered] | no issue |

**2 questions need wisher input: q3, q5**
**11 questions answered via logic**
**0 questions need external research**

---

## vision update

added questions 1-7 to vision with proper triage tags.
questions 8-13 are implicit in the vision design choices.

---

## lesson

**audit questions systematically, not just reactively.**

i started with obvious questions (env vars, format). deeper audit surfaced edge cases (paths, CI, multiple plans) that strengthen confidence in the design.
