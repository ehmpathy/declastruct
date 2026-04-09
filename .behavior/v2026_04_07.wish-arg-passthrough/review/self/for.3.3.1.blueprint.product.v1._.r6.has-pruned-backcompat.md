# self-review: has-pruned-backcompat (round 6)

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/3.3.1.blueprint.product.v1.i1.md`

---

## the review question

"did we add backwards compat that was not explicitly requested?"

the guide says to flag and eliminate backwards compat that was assumed "to be safe" rather than explicitly requested.

---

## item 1: passthroughArgs default value

**blueprint shows:**
```typescript
passthroughArgs = []  // default value
```

**was this explicitly requested?**

let me check the vision document word-for-word:
> "wish files that don't use args continue to work"

this explicitly requests backwards compat. the default value implements this requirement.

**why this holds:** without the default, old callers of executePlanCommand would need to pass an empty array. the default makes the new parameter backward-compatible with old call sites.

---

## item 2: separate fixture file

**blueprint shows:**
```
src/.test/assets/
└── [+] wish-with-args.fixture.ts
```

note: wish.fixture.ts is NOT modified (not in filediff tree).

**was this explicitly requested (to preserve wish.fixture.ts)?**

let me check the criteria:
> usecase.2: "plan without passthrough args"
> then('plan is generated with default configuration')

and the blackbox matrix:
> | no (does not parse) | none | yes | unchanged |

this explicitly requires that wish files without arg parse continue to work unchanged.

**why this holds:** the old fixture must remain unchanged to verify that old behavior is preserved. a separate fixture lets us test new behavior without a break to old tests.

---

## item 3: backwards compat test case

**blueprint shows:**
```
├── [+] 'should work without passthrough args (backwards compat)'
```

**was this test explicitly requested?**

yes — criteria usecase.2:
> given('a wish file that parses args with defaults')
> when('user runs: npx declastruct plan ...')
> then('wish file sees empty args')

**why this holds:** the test directly implements a criterion. it is not assumed "to be safe" — it is required.

---

## item 4: apply ignores args

**blueprint shows:**
```
└── [○] apply.ts  # no changes (ignores passthrough args)
```

**was this explicitly requested?**

yes — vision explicitly states:
> "apply should NOT support `--` args"

and criteria usecase.3 covers this.

**why this holds:** this is not backwards compat — it is a design decision about the feature. apply was already not aware of passthrough args, and it stays that way intentionally.

---

## search for assumed backwards compat

**methodology:** search blueprint for backwards-compat language:

| search term | found? | context |
|-------------|--------|---------|
| "backwards" | once | test name "backwards compat" — traced to criteria |
| "compatible" | none | n/a |
| "legacy" | none | n/a |
| "old" | none | n/a |
| "retain" | yes | `[○]` markers mean "retain" — no changes needed |

the `[○]` markers (retain) indicate files unchanged. let me verify each is justified:

| file | marker | justification |
|------|--------|---------------|
| apply.ts | [○] | vision says apply ignores args |
| wish.fixture.ts | not in tree | implicitly retained, justified above |

**verdict:** all "retain" decisions trace to requirements.

---

## conclusion

**backwards compat items found:** 4
**explicitly requested:** 4
**assumed "to be safe":** 0

every backwards compat concern traces to:
- vision: "wish files that don't use args continue to work"
- criteria usecase.2: "plan without passthrough args"
- blackbox matrix.3: "wish file compatibility"

**the blueprint contains zero assumed backwards compat. all backwards compat was explicitly requested.**
