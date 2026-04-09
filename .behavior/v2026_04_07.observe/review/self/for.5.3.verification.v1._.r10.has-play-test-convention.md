# self-review: has-play-test-convention (r10)

## question

double-check: are journey test files named correctly?

## investigation

### does this repo use .play.test.ts convention?

```sh
# search for .play.*.ts files
find . -name "*.play.*.ts" -type f
# result: no files found
```

no `.play.test.ts` files exist in this repo. the convention is not used here.

### what test convention does this repo use?

```
src/contract/cli/
├── apply.integration.test.ts
└── plan.integration.test.ts
```

this repo uses:
- `.integration.test.ts` for integration tests
- `.test.ts` for unit tests (if any)

### were journey tests added for --snap?

no. the --snap tests are standard integration tests added to the extant `plan.integration.test.ts` file:

```ts
// in plan.integration.test.ts
describe('--snap flag', () => {
  it('should create snapshot when --snap flag provided', ...)
  it('should not create snapshot when --snap flag absent', ...)
  it('should produce snapshot output that matches expected format', ...)
  ...
})
```

these test the feature through its public contract (CLI flags), which is appropriate for integration tests.

---

## guide questions answered

### q1: are journey tests in the right location?

**answer:** n/a — no journey tests were created for this feature.

**why:** the --snap feature is atomic (one flag, one output). it doesn't warrant a journey test because:
- no multi-step user flow to test
- no cross-feature interaction
- standard integration tests cover the contract

### q2: do they have the `.play.` suffix?

**answer:** n/a — no journey tests exist.

**verification:**
```sh
find . -name "*.play.*.ts" -type f
# result: no files
```

### q3: if not supported, is the fallback convention used?

**answer:** yes — this repo uses `.integration.test.ts` as its convention.

**evidence:**
```
src/contract/cli/
├── apply.integration.test.ts   # extant convention
└── plan.integration.test.ts    # --snap tests added here
```

the --snap tests were added to `plan.integration.test.ts`, which follows the repo's extant pattern. this is the correct fallback when `.play.test.ts` is not the repo convention.

---

## why this holds

### the atomic feature test

the --snap feature is:
- one flag (`--snap <path>`)
- one output (snapshot.json)
- one command (plan)

there's no user journey to test. the tests verify:
1. flag creates file
2. flag absent means no file
3. file content matches structure

these are contract tests, not journey tests.

### if this were a journey

if --snap were part of a multi-step flow like:

```
plan --snap → inspect snapshot → modify wish → re-plan → diff snapshots → apply
```

then a `.play.test.ts` would be appropriate. but --snap is standalone — it doesn't initiate a journey.

### the decision tree

| question | answer | action |
|----------|--------|--------|
| does the feature span multiple steps? | no | no journey test |
| does the feature require special setup? | no | no journey test |
| is the feature atomic? | yes | integration test |
| does repo use .play.test.ts? | no | use .integration.test.ts |

---

## what i learned

journey tests (`.play.test.ts`) test user journeys, not features. the distinction:

| type | tests | example |
|------|-------|---------|
| integration test | single feature contract | `--snap creates file` |
| journey test | multi-step user flow | `onboard → configure → deploy → verify` |

--snap is a feature, not a journey. integration tests are the right level.

---

## conclusion

no journey tests were added because none were needed. the feature is fully covered by standard integration tests that follow the repo's `.integration.test.ts` convention.

| check | result |
|-------|--------|
| journey tests needed? | no — feature is atomic |
| repo convention followed? | yes — `.integration.test.ts` |
| coverage adequate? | yes — 18 tests total, with snapshot |

no fixes needed.

