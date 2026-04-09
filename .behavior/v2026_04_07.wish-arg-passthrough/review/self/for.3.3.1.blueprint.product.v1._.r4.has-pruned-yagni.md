# self-review: has-pruned-yagni

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/3.3.1.blueprint.product.v1.i1.md`

---

## YAGNI check: was each component requested?

### component 1: allowUnknownOption()

**was this requested?** yes — vision says "commander captures unknown flags via `allowUnknownOption()`"

**is this minimal?** yes — one method call, no abstraction

**verdict:** required. not YAGNI.

---

### component 2: .usage() help text

**was this requested?** yes — criteria usecase.4 says "help output shows [-- <wish-args>] in usage"

**is this minimal?** yes — one method call, no abstraction

**verdict:** required. not YAGNI.

---

### component 3: command.args capture

**was this requested?** yes — this is how commander exposes captured unknowns (documented API)

**is this minimal?** yes — one line to capture

**verdict:** required. not YAGNI.

---

### component 4: passthroughArgs parameter

**was this requested?** implicitly — we need to pass captured args from invoke to plan

**is this minimal?** yes — one parameter with default value

**could we avoid this?**
- could use global state — but violates dependency injection principle
- could parse argv again in plan.ts — but duplicates work

**verdict:** required. not YAGNI.

---

### component 5: process.argv injection

**was this requested?** yes — vision says "declastruct replaces process.argv with captured unknowns"

**is this minimal?** yes — one assignment before import

**verdict:** required. not YAGNI.

---

### component 6: wish-with-args.fixture.ts

**was this requested?** implicitly — we need a fixture to test that args reach wish files

**is this minimal?** yes — minimal fixture that reads one arg and changes output

**could we reuse the extant fixture?**
- wish.fixture.ts does not parse args
- to modify it would break backwards compat tests
- separate fixture is cleaner

**verdict:** required. not YAGNI.

---

### component 7: test cases

**was this requested?** implicitly — all features need test coverage

**are these minimal?** let me check each:

| test | traces to criteria? | YAGNI? |
|------|---------------------|--------|
| 'should pass args to process.argv' | usecase.1 | no |
| 'should strip -- separator' | usecase.1 edge | no |
| 'should pass multiple args' | usecase.1 | no |
| 'should work without passthrough args' | usecase.2 | no |
| 'should ignore passthrough args' | usecase.3 | no |

**verdict:** all tests trace to criteria. not YAGNI.

---

## potential YAGNI items found: 0

after the previous reviews:
- process.argv restoration was deleted (YAGNI in has-questioned-deletables)
- top-level parseArgs was moved to function (module cache fix in has-questioned-assumptions)

the current blueprint contains only what was requested or required to implement what was requested.

---

## "while we're here" check

did we add any extras "while we're here"?

| temptation | did we add it? | why not? |
|------------|----------------|----------|
| arg validation utility | no | user parses their own args |
| typed args helper | no | out of scope, mentioned as future work in vision |
| multiple arg formats | no | only passthrough, no special handle |
| env var fallback | no | not requested |
| config file support | no | not requested |

**verdict:** resisted temptation. no extras added.

---

## "future flexibility" check

did we add abstraction for future flexibility?

| abstraction | present? | justification |
|-------------|----------|---------------|
| arg parser interface | no | just use process.argv |
| provider interface | no | uses extant interface |
| plugin system | no | not requested |

**verdict:** no premature abstraction.

---

## summary

**YAGNI items found:** 0
**extras added:** 0
**premature abstractions:** 0

the blueprint is minimal. every component traces to a requirement in vision or criteria. no "nice to haves" were added.
