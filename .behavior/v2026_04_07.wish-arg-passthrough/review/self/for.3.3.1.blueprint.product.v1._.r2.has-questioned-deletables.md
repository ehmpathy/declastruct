# self-review: has-questioned-deletables

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/3.3.1.blueprint.product.v1.i1.md`

---

## feature traceability

### feature 1: allowUnknownOption()

**traced to:** vision requirement "commander captures unknown flags via `allowUnknownOption()`"

**can we delete it?** no. without this, commander would throw on unknown flags.

**verdict:** required. keep.

---

### feature 2: .usage() help text

**traced to:** criteria usecase.4 "help output shows [-- <wish-args>] in usage"

**can we delete it?** yes, but it would violate the criteria.

**verdict:** required. keep.

---

### feature 3: process.argv injection

**traced to:** vision requirement "declastruct replaces process.argv with captured unknowns"

**can we delete it?** no. this is the core mechanism of the feature.

**verdict:** required. keep.

---

### feature 4: process.argv restoration

**traced to:** blueprint states "optional safety"

**can we delete it?** yes. after import completes, the original argv is no longer needed.

**if we deleted it and had to add it back, would we?**
- pro: defensive — future code might depend on original argv
- con: adds complexity for hypothetical future need

**verdict:** questionable. however, it is a single line and provides safety without cost. keep, but note it is defensive rather than required.

---

### feature 5: wish-with-args.fixture.ts

**traced to:** criteria usecase.1 "wish file sees --env prod in process.argv"

**can we delete it?** no. tests need a fixture that parses args to verify the feature works.

**verdict:** required. keep.

---

## component analysis

### component: invoke.ts changes

| change | simplest version? | notes |
|--------|-------------------|-------|
| `.allowUnknownOption()` | yes | single method call |
| `.usage(...)` | yes | single method call |
| `command.args` capture | yes | one line |
| pass to executePlanCommand | yes | one parameter |

**verdict:** minimal. no over-engineering detected.

---

### component: plan.ts changes

| change | simplest version? | notes |
|--------|-------------------|-------|
| add `passthroughArgs` param | yes | one parameter with default |
| save originalArgv | yes | one line |
| inject into process.argv | yes | one line |
| restore originalArgv | questionable | defensive, not required |

**verdict:** nearly minimal. the restoration line is defensive.

---

### component: test coverage

| test | traceable to criteria? | notes |
|------|------------------------|-------|
| 'should pass args to process.argv' | usecase.1 | yes |
| 'should strip -- separator' | usecase.1 edge | yes |
| 'should pass multiple args' | usecase.1 | yes |
| 'should work without passthrough args' | usecase.2 | yes |
| 'should ignore passthrough args' | usecase.3 | yes |

**verdict:** all tests trace to criteria. no extra tests.

---

## deletion opportunities

### could delete: process.argv restoration

**rationale:** the original argv is not used after wish import. restoration is purely defensive.

**decision:** keep. cost is one line. benefit is safety if future code relies on original argv. acceptable trade-off.

---

## summary

reviewed all features and components for deletability. found one questionable item (argv restoration) which was kept due to low cost and defensive value.

all other features and components trace directly to vision or criteria requirements. no items were assumed or added without justification.

the blueprint is minimal — no optimization of components that should not exist.
