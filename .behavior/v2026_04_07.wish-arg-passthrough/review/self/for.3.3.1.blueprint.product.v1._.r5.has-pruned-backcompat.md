# self-review: has-pruned-backcompat

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/3.3.1.blueprint.product.v1.i1.md`

---

## backwards compat items in blueprint

### item 1: `passthroughArgs = []` default

**what it does:** allows executePlanCommand to be called without passthroughArgs param

**was this explicitly requested?**

yes — vision explicitly states:
> "wish files that don't use args continue to work"

and criteria usecase.2:
> "plan without passthrough args" — "wish file sees empty args in process.argv"

**verdict:** explicitly requested. keep.

---

### item 2: separate wish-with-args.fixture.ts

**what it does:** new fixture for arg tests, keeps wish.fixture.ts unchanged

**was this explicitly requested?**

yes — we need to test both:
- wish files that parse args (new feature)
- wish files that don't parse args (backwards compat)

the test tree includes:
- 'should work without passthrough args (backwards compat)' — uses wish.fixture.ts

**verdict:** required to test backwards compat. keep.

---

### item 3: test "should work without passthrough args"

**what it does:** verifies that old wish files continue to work

**was this explicitly requested?**

yes — criteria usecase.2 explicitly says:
> given('a wish file that parses args with defaults')
> when('user runs: npx declastruct plan --wish resources.ts --into plan.json')
> then('wish file sees empty args in process.argv')

and blackbox matrix.3 covers "wish file compatibility":
> | yes (parses args) | none (no args passed) | yes | uses defaults |
> | no (does not parse) | none | yes | unchanged |

**verdict:** explicitly requested. keep.

---

### item 4: apply ignores passthrough args

**what it does:** apply command does not change behavior, ignores any args passed

**was this explicitly requested?**

yes — vision explicitly states:
> "apply should NOT support `--` args. rationale: the plan file captures complete resource state at plan time."

and criteria usecase.3:
> "apply ignores passthrough args"

**verdict:** explicitly requested. keep.

---

## backwards compat items NOT explicitly requested

**search result:** none found.

every backwards compat concern in the blueprint traces to:
- vision document
- criteria document
- blackbox matrix

---

## summary

**backwards compat items found:** 4
**explicitly requested:** 4
**assumed "to be safe":** 0

all backwards compat in the blueprint was explicitly requested by the wisher.

no items need to be flagged as open questions.

the blueprint maintains backwards compat exactly as specified — no more, no less.
