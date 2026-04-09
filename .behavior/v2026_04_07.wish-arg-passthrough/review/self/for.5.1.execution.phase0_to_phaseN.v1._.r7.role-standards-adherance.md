# self-review: role-standards-adherance

## summary

reviewed changed files against mechanic role standards. all files comply with required patterns.

## rule directories checked

from `.agent/repo=ehmpathy/role=mechanic/briefs/practices/`:

| directory | relevance |
|-----------|-----------|
| code.prod/evolvable.procedures | function signatures, input pattern |
| code.prod/pitofsuccess.errors | error throw patterns |
| code.prod/readable.comments | .what/.why headers |
| code.prod/readable.narrative | no else, early returns |
| code.test | test structure, bdd style |
| lang.terms | no gerunds, treestruct names |
| lang.tones | lowercase, no shouts |

## file-by-file verification

### invoke.ts

| rule | check | result |
|------|-------|--------|
| rule.require.arrow-only | all functions are arrow | ✅ |
| rule.require.what-why-headers | line 9-13 has .what/.why/.note | ✅ |
| rule.forbid.else-branches | no else branches | ✅ |
| rule.prefer.narrative-flow | linear code, guard clauses | ✅ |
| rule.forbid.gerunds | no gerunds in comments | ✅ |

**why it holds:** `invoke` function uses arrow syntax. JSDoc has .what/.why. Error output uses ternary (line 32-38), not if/else.

### plan.ts

| rule | check | result |
|------|-------|--------|
| rule.require.arrow-only | executePlanCommand is arrow | ✅ |
| rule.require.what-why-headers | line 15-18 has .what/.why/.note | ✅ |
| rule.require.input-context-pattern | uses `{ wishFilePath, planFilePath, passthroughArgs }` | ✅ |
| rule.forbid.else-branches | no else branches | ✅ |
| rule.require.failfast | BadRequestError on line 40 | ✅ |

**line-by-line verification:**
- line 15-18: JSDoc with `.what`, `.why`, `.note` - complete header
- line 20: `export const executePlanCommand = async ({` - arrow function, named input destructure
- line 23: `passthroughArgs = [],` - default value for optional param (rule.require.input-context-pattern)
- line 29: `// ... paths` - one-liner paragraph comment (rule.require.narrative-flow)
- line 38-41: early throw for validation (rule.require.failfast)
- line 49-50: comment + mutation (rule.require.what-why-headers for paragraph)

**why it holds:** function signature matches `(input)` pattern with destructure. Early return via throw. No else branches. Comments precede code paragraphs.

### apply.ts

| rule | check | result |
|------|-------|--------|
| rule.require.arrow-only | executeApplyCommand is arrow | ✅ |
| rule.require.what-why-headers | line 16-21 has .what/.why/.note | ✅ |
| rule.require.input-context-pattern | uses `(input: {...})` | ✅ |
| rule.forbid.else-branches | uses if without else (line 28-32) | ✅ |
| rule.require.failfast | BadRequestError throws | ✅ |

**why it holds:** uses early returns via throw. No else branches - uses separate if blocks.

### wish-with-args.fixture.ts

| rule | check | result |
|------|-------|--------|
| rule.require.arrow-only | getResources/getProviders are arrow | ✅ |
| rule.require.what-why-headers | line 12-15 has .what/.why/.note | ✅ |
| rule.forbid.gerunds | no gerunds | ✅ |

**why it holds:** fixture follows same patterns as production code. JSDoc headers present.

### plan.integration.test.ts (new tests)

| rule | check | result |
|------|-------|--------|
| rule.require.given-when-then or describe/it | uses describe/it | ✅ |
| rule.forbid.remote-boundaries (unit) | this is integration test | n/a |

**why it holds:** integration tests use describe/it (local convention). Tests call real executePlanCommand.

### invoke.acceptance.test.ts (new tests)

| rule | check | result |
|------|-------|--------|
| rule.require.given-when-then or describe/it | uses describe/it | ✅ |
| rule.require.blackbox | only tests via CLI | ✅ |

**why it holds:** acceptance tests spawn CLI process, do not import internals. Follows blackbox pattern.

## deeper verification: did I miss any rule categories?

checked all subdirectories:
- code.prod/consistent.* - n/a (no new artifacts)
- code.prod/evolvable.architecture - n/a (no new bounded contexts)
- code.prod/evolvable.domain.objects - n/a (no new domain objects)
- code.prod/evolvable.domain.operations - n/a (no new operations)
- code.prod/evolvable.procedures - ✅ checked above
- code.prod/evolvable.repo.structure - n/a (no new files in new locations)
- code.prod/pitofsuccess.errors - ✅ BadRequestError usage verified
- code.prod/pitofsuccess.procedures - n/a (no idempotent mutations)
- code.prod/pitofsuccess.typedefs - n/a (no new types)
- code.prod/readable.comments - ✅ .what/.why headers verified
- code.prod/readable.narrative - ✅ no else branches verified
- code.prod/readable.persistence - n/a (no persistence code)

all relevant categories checked.

## issues found and fixed

**none.** all files comply with mechanic role standards.

## why this review holds

1. enumerated all 14 code.prod subdirectories
2. identified which apply to changed files
3. verified each applicable rule line by line
4. found no violations

## conclusion

all changed files adhere to mechanic role standards. verified against code.prod, code.test, and lang.* rule directories.
