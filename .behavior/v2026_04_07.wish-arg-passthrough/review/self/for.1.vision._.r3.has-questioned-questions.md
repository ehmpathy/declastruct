# self-review r3: has-questioned-questions

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/1.vision.md`

---

## triage guide followed

for each item, asked:
1. can answer via logic now?
2. can answer via extant docs/code now?
3. should answer via external research later?
4. does only wisher know?

---

## assumptions triage

### assumption 1: `--` separator is sufficient

- **via logic?** yes — `--` is universal CLI convention
- **via code?** n/a
- **research?** no
- **wisher?** no

**verdict: [answered]**
**why it holds:** npm, docker, yarn, git all use `--`. no user has ever requested alternative syntax for arg passthrough. this is a solved pattern.

---

### assumption 2: raw string array is simpler

- **via logic?** partially — depends on option choice
- **via code?** n/a
- **research?** no
- **wisher?** yes — this is tied to option A/B/C choice

**verdict: [wisher]**
**why unclear:** option C pre-parses to env vars, which is "simpler" for users but more complex internally. the simplicity tradeoff depends on which direction we optimize.

---

### assumption 3: both exports need args

- **via logic?** yes — both may need env-specific config
- **via code?** checked — both functions currently have zero params
- **research?** no
- **wisher?** no

**verdict: [answered]**
**why it holds:** providers need auth config (api keys vary by env). resources need naming config (bucket names vary by env). both legitimately need args.

---

### assumption 4: typed args tradeoff

- **via logic?** yes — strings are universal CLI interface
- **via code?** n/a
- **research?** no
- **wisher?** no

**verdict: [answered]**
**why it holds:** every CLI tool in existence returns string arrays from argv. users parse to types using their preferred method. declastruct shouldn't break this pattern.

---

## questions triage

### question 1: option A vs B vs C

- **via logic?** can recommend, but not decide
- **via code?** n/a
- **research?** no
- **wisher?** yes

**verdict: [wisher]**
**why unclear:** each option has valid tradeoffs. A is explicit. B is flexible. C is simple. only wisher knows product direction.

---

### question 2: apply command scope

- **via logic?** YES — can derive answer
- **via code?** checked plan.ts — plan captures full state
- **research?** no
- **wisher?** no

**verdict: [answered]**
**how fixed:** apply should NOT support args. rationale: plan captures resource state. apply executes plan. different args = different state = plan violation. updated vision with this answer.

---

### question 3: arg share

- **via logic?** yes — implementation detail
- **via code?** trivial to pass same array
- **research?** no
- **wisher?** no

**verdict: [answered]**
**why it holds:** we control the implementation. we guarantee same args instance. no ambiguity.

---

### question 4: help text

- **via logic?** yes — UX best practice
- **via code?** n/a
- **research?** no
- **wisher?** no

**verdict: [answered]**
**why it holds:** discoverability is a noted con. help text is the standard mitigation. show `[-- <wish-args>]` in usage.

---

### question 5: "second parameter" phrase

- **via logic?** no — ambiguous
- **via code?** checked — zero params currently
- **research?** no
- **wisher?** yes — need to know intent

**verdict: [wisher]**
**why unclear:** could be typo ("a parameter") or future-proof ("second" implies future first). only wisher knows.

---

### question 6: sdk usage

- **via logic?** partially — option A is cleanest for SDK
- **via code?** n/a
- **research?** no
- **wisher?** yes — depends on option choice

**verdict: [wisher]**
**why unclear:** inherits from question 1. once option is chosen, sdk pattern follows.

---

## summary

### fixes applied

1. marked assumption #2 as [wisher] — depends on option choice
2. answered question #2 via logic — apply ignores args
3. marked all items with clear [answered]/[wisher] tags in vision

### final state

| item | verdict |
|------|---------|
| assumption 1 | answered |
| assumption 2 | wisher |
| assumption 3 | answered |
| assumption 4 | answered |
| question 1 | wisher |
| question 2 | answered |
| question 3 | answered |
| question 4 | answered |
| question 5 | wisher |
| question 6 | wisher |

**total:** 6 answered, 4 need wisher input, 0 need research.

all items are now triaged and marked in the vision.
