# self-review: has-questioned-questions

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/1.vision.md` — open questions section

---

## question triage

### question 1: option A vs B vs C

- **can answer via logic?** no — each option has valid tradeoffs
- **can answer via docs/code?** no — this is new contract design
- **needs external research?** no — internal decision
- **only wisher knows?** yes — this is a product direction choice

**verdict: [wisher]**

---

### question 2: apply command scope

- **can answer via logic?** partially:
  - plan captures resource state at plan time
  - if apply args differ, state could be inconsistent
  - safest: apply ignores args, uses only plan state
  - but: some users need different auth at apply time
- **can answer via docs/code?** no
- **needs external research?** no
- **only wisher knows?** yes — depends on real usecases

**verdict: [wisher]**

---

### question 3: arg share between exports

- **can answer via logic?** yes:
  - if option B or C chosen: args are global, automatic
  - if option A chosen: pass same array instance to both
  - implementation is straightforward either way
- **can answer via docs/code?** no
- **needs external research?** no
- **only wisher knows?** depends on #1

**verdict: [answered]** — whichever option is chosen, implementation guarantees same args to both exports

---

### question 4: help text

- **can answer via logic?** yes:
  - discoverability is a noted con
  - help text is the standard mitigation
  - `-- <wish-args>` should appear in `--help` output

**verdict: [answered]** — yes, show `-- <wish-args>` in help

---

### question 5: "second parameter" phrase

- **can answer via logic?** no — we don't know if future first param is planned
- **can answer via docs/code?** checked current code:
  - getResources() has zero params
  - getProviders() has zero params
  - no evidence of planned first param
- **needs external research?** no
- **only wisher knows?** yes — wisher may have future plans

**verdict: [wisher]** — could be typo or intentional future-proof

---

### question 6: sdk usage

- **can answer via logic?** partially:
  - option A is cleanest for SDK (pass array)
  - option B requires argv mutation (awkward for library)
  - option C requires env setup (acceptable)
- **can answer via docs/code?** no
- **needs external research?** no
- **only wisher knows?** depends on #1

**verdict: [wisher]** — inherits from option choice

---

## summary

| # | question | verdict | action |
|---|----------|---------|--------|
| 1 | option A/B/C | wisher | ask wisher |
| 2 | apply scope | wisher | ask wisher |
| 3 | arg share | answered | guarantee same args |
| 4 | help text | answered | yes, add to help |
| 5 | "second parameter" | wisher | clarify intent |
| 6 | sdk usage | wisher | depends on #1 |

**fixes applied:**
- marked questions #3 and #4 as answered
- updated vision to reflect triage

---

## answers resolved

**question 3 answer:** implementation will guarantee same args array instance to both getResources and getProviders (or global access via option B/C).

**question 4 answer:** yes, help text should include `-- <wish-args>` for discoverability. example:
```
npx declastruct plan --wish <file> --into <file> [-- <wish-args>]
```
