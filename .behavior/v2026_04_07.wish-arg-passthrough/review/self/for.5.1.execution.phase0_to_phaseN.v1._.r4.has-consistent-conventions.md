# self-review: has-consistent-conventions

## summary

reviewed for divergence from extant name patterns. all conventions align with codebase.

## method

searched codebase for:
- `execute\w+Command` pattern - found in invoke.ts, apply.ts, plan.ts
- `log\.(info|error|warn|debug)` in src/contract/cli - found in apply.ts, plan.ts, invoke.ts
- `describe\(|it\(|given\(|when\(|then\(` in test files - found cli uses describe/it, domain uses given/when/then
- `passthroughArgs|passthrough` - found consistent usage across new code

## conventions reviewed

### 1. function names

**convention:** `execute<Name>Command` for cli command handlers

**evidence:** invoke.ts imports `executeApplyCommand` and `executePlanCommand`

**my code:** uses extant functions, only adds `passthroughArgs` parameter to `executePlanCommand`

**why it holds:** no new functions introduced. extant function signatures extended, not replaced.

### 2. parameter names

**convention:** camelCase for parameters

**evidence:** extant parameters: `wishFilePath`, `planFilePath`

**my code:** `passthroughArgs`

**why it holds:** follows same camelCase pattern. no underscores, no PascalCase.

### 3. error output

**convention:** uses `log.error` for error output

**evidence:** invoke.ts:52 `log.error('✖ Error during plan:', error)`

**my code:** invoke.ts:35-36 uses `log.error(str.trim())` and `log.error('hint: ...')`

**why it holds:** matches extant error output pattern. no console.error or process.stderr.write.

### 4. test structure

**convention:** cli tests use `describe/it` pattern

**evidence:**
- plan.integration.test.ts:38 `describe('executePlanCommand', () => {`
- apply.integration.test.ts:75 `describe('executeApplyCommand', () => {`
- invoke.acceptance.test.ts:50 `describe('invoke CLI', () => {`

note: domain.operations tests use `given/when/then` from test-fns - different directory, different convention

**my code:** new tests use `describe/it`

**why it holds:** followed local convention in cli directory. did not import test-fns.

### 5. test file extensions

**convention:** `.integration.test.ts` for integration, `.acceptance.test.ts` for acceptance

**evidence:** jest.integration.config.ts and jest.acceptance.config.ts use these patterns

**my code:** added tests to extant files (no new files with wrong extensions)

**why it holds:** extended extant test files rather than create new ones.

### 6. term usage

**convention:** `passthrough` as adjective for args

**evidence:** searched for alternatives - no "user args", "wish args", "extra args" in codebase

**my code:** uses `passthroughArgs` (variable), `passthrough args` (comments/docs)

**why it holds:** consistent term. no synonym drift. matches npm scripts convention (`--` passthrough).

## conclusion

all name conventions and patterns align with codebase. no divergence found. each convention verified via grep search of extant code.
