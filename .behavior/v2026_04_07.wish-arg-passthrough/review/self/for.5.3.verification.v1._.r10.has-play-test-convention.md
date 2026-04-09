# self-review: has-play-test-convention (r10)

## deeper reflection

paused. re-read the guide. checked for `.play.test.ts` files in repo.

```bash
$ glob '**/*.play.*.test.ts'
No files found
```

the `.play.` convention is not used in this repo.

## repo convention investigation

### what patterns exist?

searched all test files:

```
22 test files total:
- 15 unit tests: *.test.ts
- 5 integration tests: *.integration.test.ts
- 2 acceptance tests: *.acceptance.test.ts
- 0 play tests: *.play.test.ts
```

this repo uses `.integration.test.ts` and `.acceptance.test.ts` for journey-style tests.

### where are the journey tests for this feature?

#### plan.integration.test.ts (lines 262-360)

```typescript
describe('passthrough args', () => {
  it('should pass args to process.argv', async () => {
    await executePlanCommand({
      wishFilePath: argsWishFilePath,
      planFilePath,
      passthroughArgs: ['--env', 'prod'],
    });
    // verifies resource name reflects prod env
    expect((plan.changes[0]?.state.desired as { name: string }).name).toBe(
      'Resource-production',
    );
  });

  it('should strip -- separator from process.argv', async () => { ... });
  it('should pass multiple args', async () => { ... });
  it('should work without passthrough args (backwards compat)', async () => { ... });
});
```

these are journey tests: they exercise the full plan flow with passthrough args.

#### invoke.acceptance.test.ts

```typescript
describe('plan --help', () => {
  it('should show passthrough args in plan help text', async () => { ... });
});

describe('plan with unknown option', () => {
  it('should guide user to use -- when unknown option passed', async () => { ... });
});
```

these are acceptance tests: they verify the public CLI contract.

## is the fallback convention correct?

the guide says:

> if not supported, is the fallback convention used?

verified:

1. **no `.play.` files exist anywhere** — not just for this feature, zero in entire repo
2. **journey tests use established convention** — `.integration.test.ts` for flow tests
3. **acceptance tests use established convention** — `.acceptance.test.ts` for CLI contract
4. **consistency preserved** — new tests match repo pattern

## stress test: should i add `.play.` files?

| option | consequence |
|--------|-------------|
| add `.play.test.ts` | inconsistent with 22 other test files |
| use established convention | consistent, discoverable, follows repo pattern |

**verdict:** use established convention. consistency trumps convention from another repo.

## why this holds

1. **repo has clear convention** — `.integration.test.ts` and `.acceptance.test.ts`
2. **22 test files follow it** — no exceptions
3. **journey tests placed correctly** — `describe('passthrough args')` block tests the journey
4. **fallback clause applies** — guide allows established repo conventions

## conclusion

`.play.test.ts` convention is not used in this repo. journey tests for arg passthrough are in `plan.integration.test.ts` (lines 262-360) and `invoke.acceptance.test.ts`. these follow the repo's established convention. this satisfies the guide's fallback clause.

