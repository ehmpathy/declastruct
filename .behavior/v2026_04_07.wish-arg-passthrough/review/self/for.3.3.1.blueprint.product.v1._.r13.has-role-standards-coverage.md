# self-review: has-role-standards-coverage (round 13)

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/3.3.1.blueprint.product.v1.i1.md`

---

## methodology

check whether all relevant mechanic standards are present in the blueprint. focus on patterns that should exist but might be absent: error paths, validation, tests, types.

---

## rule directories enumerated

| directory | applicable? | why |
|-----------|-------------|-----|
| code.prod/evolvable.procedures | yes | plan.ts procedure |
| code.prod/evolvable.repo.structure | yes | file organization |
| code.prod/readable.narrative | yes | code structure |
| code.prod/readable.comments | yes | comments required |
| code.prod/pitofsuccess.procedures | yes | idempotency, immutability |
| code.prod/pitofsuccess.errors | limited | no new error paths |
| code.prod/pitofsuccess.typedefs | yes | type safety |
| code.test/frames.behavior | yes | test structure |
| code.test/scope.coverage | yes | coverage requirements |
| lang.terms | yes | term conventions |
| lang.tones | yes | tone conventions |

---

## coverage-by-standard assessment

### code.prod/evolvable.procedures

**question:** are all procedure standards applied?

| standard | applicable? | applied? | evidence |
|----------|-------------|----------|----------|
| input-context pattern | yes | yes | line 131-138: `({ wishFilePath, planFilePath, passthroughArgs })` |
| arrow-only | yes | yes | line 131: `export const executePlanCommand = async` |
| clear-contracts | yes | yes | line 135-138: inline types declared |
| dependency-injection | no | n/a | no dependencies injected (process.argv is global) |
| named-args | yes | yes | all params are named |

**verdict:** ✓ all applicable procedure standards covered

---

### code.prod/pitofsuccess.errors

**question:** are error paths covered?

| scenario | needs error? | covered? | evidence |
|----------|--------------|----------|----------|
| passthroughArgs empty | no | n/a | defaults to [], valid state |
| passthroughArgs malformed | no | n/a | strings are passed through, wish file owns validation |
| wish file parse fails | no change | extant | blueprint does not alter error paths |

**why coverage is complete:** passthrough args are raw strings. declastruct passes them through without interpretation. wish file owns parse errors. no new error conditions introduced.

**verdict:** ✓ no error coverage needed for new code

---

### code.prod/pitofsuccess.typedefs

**question:** are type standards applied?

| standard | applicable? | applied? | evidence |
|----------|-------------|----------|----------|
| shapefit | yes | yes | `string[]` flows through all layers |
| forbid-as-cast | yes | yes | no `as` casts in blueprint |
| inline types | yes | yes | line 135-138 |

**verdict:** ✓ type standards covered

---

### code.test/scope.coverage

**question:** are test coverage requirements met?

| grain | test type required | provided? | evidence |
|-------|-------------------|-----------|----------|
| contract (invoke.ts) | acceptance + snapshot | yes | line 95-96: invoke.acceptance.test.ts |
| contract (plan.ts) | integration | yes | line 85-89: plan.integration.test.ts |
| contract (apply.ts) | integration | yes | line 92-93: apply.integration.test.ts |

**verdict:** ✓ test coverage standards covered

---

### code.prod/readable.comments

**question:** are comment standards applied?

| element | needs .what/.why? | provided? | evidence |
|---------|-------------------|-----------|----------|
| executePlanCommand | yes (actual impl) | blueprint level | actual code must add |
| getResources | yes | yes | line 161-162: inline comment explains module cache |
| getProviders | minimal | acceptable | fixture, trivial return |

**note:** blueprint shows snippets. actual implementation must include `.what/.why` headers on executePlanCommand.

**verdict:** ✓ comment standards covered at blueprint level

---

### code.test/frames.behavior

**question:** are test structure standards applied?

| test file | given/when/then? | evidence |
|-----------|------------------|----------|
| plan.integration.test.ts | expected | test names use 'should' pattern, impl uses test-fns |
| apply.integration.test.ts | expected | test names use 'should' pattern |
| invoke.acceptance.test.ts | expected | test names use 'should' pattern |

**why this holds:** blueprint declares test case names. actual implementation will wrap in `given()`, `when()`, `then()` blocks from test-fns per extant codebase patterns.

**verdict:** ✓ test structure standards covered

---

### lang.terms

**question:** are term standards applied?

| standard | applicable? | applied? | evidence |
|----------|-------------|----------|----------|
| forbid-gerunds | yes | yes | no gerunds in blueprint |
| ubiqlang | yes | yes | consistent terms throughout |
| treestruct | yes | yes | verb-noun patterns for procedures |

**verdict:** ✓ term standards covered

---

## patterns that could be absent

### 1. error boundaries

**question:** should declastruct validate passthrough args?

**analysis per rule.require.failfast:**
- passthrough args are raw strings — any string is valid input
- validation is wish file responsibility, not declastruct
- vision says: "wish files parse args themselves via standard node patterns"

**answer:** no validation needed. blueprint correctly omits it.

---

### 2. backwards compat guards

**question:** should there be guards for old callers?

**analysis per rule.prefer.wet-over-dry:**
- new param `passthroughArgs` defaults to `[]`
- callers without passthrough args work unchanged
- no conditional code needed — default handles it

**answer:** covered. line 134: `passthroughArgs = []` default.

---

### 3. help text validation

**question:** should help text be validated?

**analysis per rule.require.test-coverage-by-grain:**
- invoke.ts is contract layer — needs acceptance test
- help text is user-visible output — needs snapshot
- blueprint declares: invoke.acceptance.test.ts with snapshot

**answer:** covered. line 95-96.

---

### 4. module cache behavior

**question:** is module cache behavior documented?

**analysis per rule.require.what-why-headers:**
- wish files may be imported multiple times in tests
- process.argv changes between imports
- parseArgs inside getResources() (not module top-level) handles this

**answer:** covered. line 161-162: comment explains why parseArgs is inside function.

---

### 5. process.argv preservation

**question:** should original argv be preserved for restore?

**analysis:**
- blueprint replaces argv entirely
- no restore needed — plan command runs once and exits
- wish file import happens after injection
- no code after import needs original argv

**answer:** not needed. blueprint correctly omits restoration.

---

### 6. non-null assertions

**question:** are `!` assertions on process.argv safe?

**analysis per rule.require.shapefit:**
- line 143: `process.argv[0]!` and `process.argv[1]!`
- node guarantees [0] = node path, [1] = entry path
- these are never null in node runtime

**answer:** safe. non-null assertions are appropriate here.

---

### 7. useThen/useWhen pattern in tests

**question:** should tests use useThen for shared results?

**analysis per rule.require.useThen-useWhen-for-shared-results:**
- blueprint test tree shows 6 test cases
- each tests a distinct behavior
- no shared results between cases

**answer:** not applicable. each test case is independent.

---

## gaps found

**none.** all relevant mechanic standards are applied in the blueprint.

---

## summary

| category | standards checked | gaps |
|----------|------------------|------|
| evolvable.procedures | 5 (input-context, arrow-only, clear-contracts, dependency-injection, named-args) | 0 |
| pitofsuccess.errors | 3 scenarios (empty, malformed, parse fail) | 0 |
| pitofsuccess.typedefs | 3 (shapefit, forbid-as-cast, inline types) | 0 |
| test scope.coverage | 3 files (plan, apply, invoke) | 0 |
| readable.comments | 3 elements (executePlanCommand, getResources, getProviders) | 0 |
| test frames.behavior | 3 files (given/when/then expected) | 0 |
| lang.terms | 3 (forbid-gerunds, ubiqlang, treestruct) | 0 |
| patterns absent | 7 questions (error, backwards compat, help, cache, preservation, assertions, useThen) | 0 |
| **total** | **30 checks** | **0 gaps** |

**the blueprint covers all relevant mechanic role standards.**

---

## briefs referenced

| brief | applied where |
|-------|--------------|
| rule.require.input-context-pattern | executePlanCommand signature |
| rule.require.arrow-only | all function declarations |
| rule.forbid.undefined-inputs | passthroughArgs default |
| rule.require.failfast | error boundary analysis |
| rule.require.test-coverage-by-grain | test type decisions |
| rule.require.what-why-headers | comment requirements |
| rule.require.shapefit | non-null assertion safety |
| rule.require.useThen-useWhen | test independence |
| rule.prefer.wet-over-dry | backwards compat guard |

