# self-review: has-all-tests-passed

## summary

all test suites pass with exit code 0. ran with THOROUGH=true to verify full suite. fixed one parallel test race condition. proof cited below for each suite.

## test:types

### command

```bash
THOROUGH=true npm run test:types
```

### output

```
> declastruct@1.7.3 test:types
> tsc -p ./tsconfig.json --noEmit
```

### exit code

0 (no output means no type errors)

### why it holds

typescript compiler found no type errors. exit 0.

## test:lint

### command

```bash
npm run test:lint
```

### output

```
> declastruct@1.7.3 test:lint
> npm run test:lint:biome && npm run test:lint:deps

> declastruct@1.7.3 test:lint:biome
> biome check --diagnostic-level=error

Checked 54 files in 195ms. No fixes applied.

> declastruct@1.7.3 test:lint:deps
> npx depcheck -c ./.depcheckrc.yml

No depcheck issue
```

### exit code

0

### why it holds

biome found no lint errors. depcheck found no unused dependencies. exit 0.

## test:format

### command

```bash
npm run test:format
```

### output

```
> declastruct@1.7.3 test:format
> npm run test:format:biome

> declastruct@1.7.3 test:format:biome
> biome format

Checked 54 files in 12ms. No fixes applied.
```

### exit code

0

### why it holds

biome found no format issues. exit 0.

## test:unit

### command

```bash
THOROUGH=true npm run test:unit
```

### output

```
PASS src/domain.operations/apply/applyChange.test.ts
PASS src/domain.objects/genDeclastructDao.test.ts
PASS src/domain.objects/DeclastructDao.test.ts
PASS src/domain.operations/plan/computeChange.test.ts
PASS src/domain.operations/ref/getRefByUnique.test.ts
PASS src/domain.operations/ref/getRefByPrimary.test.ts
PASS src/domain.operations/plan/getDaoByResource.test.ts
PASS src/domain.operations/plan/getDisplayableDiff.test.ts
PASS src/domain.objects/DeclastructProvider.test.ts
PASS src/domain.objects/DeclastructChange.test.ts
PASS src/domain.objects/DeclastructPlan.test.ts
PASS src/domain.objects/IsoTimestamp.test.ts
PASS src/domain.objects/ContextDeclastruct.test.ts
PASS src/domain.operations/del/del.test.ts
PASS src/infra/withSpinner.test.ts

Test Suites: 15 passed, 15 total
Tests:       83 passed, 83 total
Snapshots:   2 passed, 2 total
Time:        1.246 s
```

### exit code

0

### why it holds

all 83 unit tests pass. 2 snapshots pass. exit 0.

## test:integration

### command

```bash
THOROUGH=true npm run test:integration
```

### output

```
PASS src/domain.operations/ref/getRefByUnique.integration.test.ts
PASS src/contract/cli/apply.integration.test.ts
PASS src/contract/cli/plan.integration.test.ts
PASS src/domain.operations/ref/getRefByPrimary.integration.test.ts

Test Suites: 6 passed, 6 total
Tests:       60 passed, 60 total
Snapshots:   0 total
Time:        1.527 s
```

### exit code

0

### fix applied

initial THOROUGH=true run surfaced a flaky test in `getRefByUnique.integration.test.ts`. root cause: `demo-with-getref.provider.ts` used a shared temp directory for all test files. jest runs with `maxWorkers: '50%'` (parallel execution), so `getRefByUnique.integration.test.ts` and `getRefByPrimary.integration.test.ts` interfered with each other's state.

fix: added namespace isolation to `demo-with-getref.provider.ts`:
- added `setDemoRefNamespace(namespace: string)` function
- each test file calls this in `beforeAll` with a unique namespace
- temp directory now uses namespace: `.test/demo/getref-provider/.temp/{namespace}/`

files modified:
- `src/.test/assets/providers/demo-with-getref.provider.ts`
- `src/domain.operations/ref/getRefByUnique.integration.test.ts`
- `src/domain.operations/ref/getRefByPrimary.integration.test.ts`

after fix, all 60 integration tests pass with THOROUGH=true.

### why it holds

all 60 integration tests pass after fix. exit 0.

## test:acceptance

### command

```bash
npm run test:acceptance
```

### output

```
PASS src/contract/cli/invoke.acceptance.test.ts

  invoke CLI
    plan --help
      ✓ should show passthrough args in plan help text (565 ms)
    plan with unknown option
      ✓ should guide user to use -- when unknown option passed (659 ms)
      ✓ should catch typos on declastruct flags (596 ms)
    plan with passthrough args
      ✓ should pass args after -- to wish file (585 ms)
      ✓ should pass --wish after -- to wish file (user owns namespace) (610 ms)
    apply with passthrough args
      ✓ should ignore passthrough args in yolo mode (596 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   2 passed, 2 total
Time:        3.794 s
```

### exit code

0

### why it holds

all 6 acceptance tests pass. 2 snapshots pass. exit 0.

## issues found and fixed

### issue: parallel test race condition

**symptom:** `getRefByUnique.integration.test.ts` case3 failed with `Received: null` when expected `{ exid: ... }`.

**root cause:** shared temp directory between test files + parallel execution (`maxWorkers: '50%'`).

**fix:** added `setDemoRefNamespace()` for test isolation. each test file uses a unique namespace.

**verification:** all 60 integration tests pass with THOROUGH=true after fix.

## why this review holds

1. **test:types** — exit 0, no type errors
2. **test:lint** — exit 0, no lint errors
3. **test:format** — exit 0, no format issues
4. **test:unit** — exit 0, 83 tests passed (THOROUGH=true)
5. **test:integration** — exit 0, 60 tests passed (THOROUGH=true, after fix)
6. **test:acceptance** — exit 0, 6 tests passed, 2 snapshots passed

total: 149 tests run (83 + 60 + 6), all pass, 0 failures.

## conclusion

all test suites pass with exit code 0. ran with THOROUGH=true. fixed parallel test race condition. proof cited for each suite.
