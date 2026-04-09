# self-review: role-standards-coverage

## summary

reviewed for patterns that should be present but might be absent. all required practices are covered.

## rule directories checked

from `.agent/repo=ehmpathy/role=mechanic/briefs/practices/`:

| directory | coverage check |
|-----------|---------------|
| code.prod/evolvable.procedures | input validation, types |
| code.prod/pitofsuccess.errors | error throws present |
| code.prod/readable.comments | headers, paragraph comments |
| code.test | test coverage for new code |

## presence verification

### error validation (rule.require.failfast)

**should be present:** input validation throws for bad inputs

**verified:**
- plan.ts:38-41: throws `BadRequestError` if wish file not found
- plan.ts:56-61: throws if exports are absent
- apply.ts:31-36: throws for required args
- apply.ts:46-47: throws if plan file not found
- apply.ts:58-59: throws if wish file not found
- invoke.ts:29-40: configureOutput intercepts unknown options

**coverage:** all user input validated. no silent failures.

### test coverage (rule.require.test-coverage-by-grain)

**should be present:** integration tests for commands, acceptance tests for CLI

**verified:**
- plan.integration.test.ts:262-359: 4 new tests for passthrough args
- invoke.acceptance.test.ts:52-58: help text test
- invoke.acceptance.test.ts:62-105: unknown option tests
- invoke.acceptance.test.ts:108-163: passthrough args tests
- invoke.acceptance.test.ts:166-193: apply ignores args test

**coverage:** all new codepaths have tests. test tree from blueprint satisfied.

### type annotations

**should be present:** explicit types on function signatures

**verified:**
- plan.ts:20-28: explicit input type with `passthroughArgs?: string[]`
- apply.ts:23-25: explicit input type
- invoke.ts:14: explicit `{ args: string[] }` input

**coverage:** all function inputs typed. return types explicit.

### documentation (rule.require.what-why-headers)

**should be present:** .what/.why headers on procedures

**verified:**
- plan.ts:15-18: complete header
- apply.ts:16-21: complete header
- invoke.ts:9-13: complete header
- wish-with-args.fixture.ts:12-15: complete header

**coverage:** all procedures have headers.

### paragraph comments (rule.require.narrative-flow)

**should be present:** one-liner comments before code paragraphs

**verified:**
- plan.ts:29, 33, 38, 43, 49, 52, 55, 63, 67, etc: paragraph comments present
- apply.ts:75-76: comment explains process.argv clear

**coverage:** code flows are documented with paragraph comments.

## patterns potentially absent but intentionally so

### context parameter

**observation:** executePlanCommand and executeApplyCommand do not use `(input, context)` pattern - they construct context internally.

**why this is correct:**
- these are CLI entry points, not reusable domain operations
- context (bottleneck, log) is constructed at CLI boundary
- internal operations they call do use (input, context)

### idempotency markers

**observation:** no explicit idempotency verification in new code

**why this is correct:**
- process.argv mutation is not idempotent (intentional - happens once per run)
- this is CLI entry point behavior, not domain operation
- idempotency would make no sense here (you don't retry CLI invocations)

## additional practices verified

### snapshot tests (rule.require.snapshots)

**should be present:** snapshots for user-visible output

**verified:**
- invoke.acceptance.test.ts:57: `expect(stdout).toMatchSnapshot()` for help text
- invoke.acceptance.test.ts:85: `expect(stderr).toMatchSnapshot()` for error output

**why snapshots matter:** help text and error messages are user-visible contracts. snapshots catch accidental format changes in PR review.

### edge case coverage

**checked potential gaps:**
- empty passthrough args: covered by 'should work without passthrough args (backwards compat)'
- multiple args: covered by 'should pass multiple args'
- overlapping flag names (--wish after --): covered by 'should pass --wish after -- to wish file (user owns namespace)'
- apply ignores args: covered by 'should ignore passthrough args in yolo mode'

**no gaps found.**

### error message clarity

**verified:**
- invoke.ts:35-36: error includes the unknown flag name and actionable hint
- error format: `error: unknown option '--env'` + `hint: to pass args to your wish file, use: -- --env`

**why this matters:** users can immediately understand what went wrong and how to fix it.

## issues found and fixed

**none.** all required practices are present.

## why this review holds

1. enumerated required practices from briefs
2. verified each is present in changed files
3. checked edge cases for gaps
4. verified snapshot usage for user-visible output
5. explained intentional absences (context pattern, idempotency)
6. found no gaps

## conclusion

all required mechanic practices are covered. no patterns are absent that should be present.
