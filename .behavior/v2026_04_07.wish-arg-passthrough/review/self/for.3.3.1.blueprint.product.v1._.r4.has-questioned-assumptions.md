# self-review: has-questioned-assumptions (round 4)

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/3.3.1.blueprint.product.v1.i1.md`

---

## deeper examination: module cache assumption

### the hidden assumption

the blueprint assumes that process.argv injection before `await import()` will work correctly. but there's a hidden assumption about node module cache that deserves scrutiny.

**the assumption:** each time `await import(wishPath)` is called, the wish file's top-level code executes.

**what if the opposite were true?** node caches module imports. if the wish file was already imported, `await import()` returns the cached module — top-level code does not re-run, and parseArgs does not see the new argv.

---

### scenario analysis

**scenario 1: CLI usage (separate processes)**

```bash
npx declastruct plan --wish r.ts --into p1.json --env test
npx declastruct plan --wish r.ts --into p2.json --env prod
```

each command runs in a fresh process. module cache is empty at start of each. no issue.

**verdict:** no problem for CLI usage.

---

**scenario 2: integration tests (same process)**

```typescript
// test 1
await executePlanCommand({ wishFilePath: 'wish-with-args.fixture.ts', planFilePath: 'p1.json', passthroughArgs: ['--env', 'test'] });

// test 2 (same test file)
await executePlanCommand({ wishFilePath: 'wish-with-args.fixture.ts', planFilePath: 'p2.json', passthroughArgs: ['--env', 'prod'] });
```

**the question:** does jest clear module cache between tests?

**evidence check:**
- jest has `resetModules` option but it's not enabled by default
- jest has `clearMocks` but that doesn't affect module cache
- our jest config would need `resetModules: true` to clear cache between tests

**potential issue found:** if tests run sequentially and import the same wish file with different args, the second test might see stale parseArgs values from the first test.

---

### is this actually a problem?

let me verify against the test tree:

```
├── [+] 'should pass args to process.argv'
├── [+] 'should strip -- separator from process.argv'
├── [+] 'should pass multiple args'
└── [+] 'should work without passthrough args (backwards compat)'
```

the backwards compat test uses `wish.fixture.ts` (no arg parse).
the other tests use `wish-with-args.fixture.ts`.

if the arg tests run in order, test 1 imports the fixture, test 2 gets cached module.

**but wait:** each test in the blueprint creates a fresh plan file path. the tests verify that the plan file was created correctly. the plan file content comes from `getResources()`, which reads `values.env` from parseArgs.

if parseArgs is cached from the first test, subsequent tests would generate wrong content.

---

### issue found: module cache could break tests

**the problem:** the blueprint doesn't account for node module cache in test scenarios.

**potential fixes:**

1. **clear module cache before each test** — add `jest.resetModules()` in beforeEach
2. **use dynamic file names** — change fixture path per test to avoid cache hit
3. **don't cache parseArgs result** — move parseArgs inside getResources() instead of at top-level

option 3 is the cleanest: if parseArgs runs inside getResources(), it reads current process.argv on each call, not at import time.

---

### fix applied

**issue:** top-level parseArgs in fixture is problematic because it runs once at import time, not on each getResources call.

**fix:** move parseArgs inside getResources() in the fixture.

**before (problematic):**
```typescript
const { values } = parseArgs({ args: process.argv.slice(2), ... });  // runs once at import

export const getResources = async () => {
  const suffix = values.env === 'prod' ? '-production' : '-test';  // uses cached value
  ...
};
```

**after (correct):**
```typescript
export const getResources = async () => {
  const { values } = parseArgs({ args: process.argv.slice(2), ... });  // runs on each call
  const suffix = values.env === 'prod' ? '-production' : '-test';
  ...
};
```

this way, each call to getResources() sees the current process.argv, even if the module is cached.

---

## update to blueprint

updated `3.3.1.blueprint.product.v1.i1.md` section for `wish-with-args.fixture.ts`:
- moved parseArgs call inside getResources()
- ensures each invocation reads current process.argv

---

## other assumptions verified

| assumption | evidence | verdict |
|------------|----------|---------|
| command.args contains unknowns | commander.js docs | holds |
| allowUnknownOption() is correct API | commander.js docs | holds |
| argv[0] and [1] convention | node.js docs | holds |
| apply ignores args | vision document | intentional |

---

## summary

**found issue:** module cache could break tests when multiple tests import the same wish file with different args.

**root cause:** top-level parseArgs runs once at import time, caches the result.

**fix:** move parseArgs inside getResources() so it reads fresh argv on each call.

**lesson learned:** top-level side effects in dynamically imported modules can cause cache-related surprises. put state-dependent logic inside exported functions, not at module top-level.
