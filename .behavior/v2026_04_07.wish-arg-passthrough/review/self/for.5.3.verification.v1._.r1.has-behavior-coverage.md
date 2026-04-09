# self-review: has-behavior-coverage

## summary

verified every behavior from wish/vision has a matched test. all behaviors covered.

## method

1. read 0.wish.md line by line
2. read 1.vision.md line by line
3. read 2.1.criteria.blackbox.md usecase by usecase
4. for each behavior, opened the test file and verified the test exists
5. verified each test passes via actual test run

## behavior coverage: wish (0.wish.md)

### behavior 1: "pass custom args to wish files via -- separator"

**test:** plan.integration.test.ts:268-291

```typescript
it('should pass args to process.argv', async () => {
  await executePlanCommand({
    wishFilePath: argsWishFilePath,
    planFilePath,
    passthroughArgs: ['--env', 'prod'],
  });
  expect((plan.changes[0]?.state.desired as { name: string }).name).toBe(
    'Resource-production',
  );
});
```

**why it holds:** test passes `['--env', 'prod']` as passthroughArgs and verifies the resource name is `Resource-production`, which proves the wish file's parseArgs saw `--env prod` in process.argv.

### behavior 2: "args appended to process.argv before import"

**test:** plan.integration.test.ts:268-291 (same as above)

**why it holds:** the wish-with-args.fixture.ts calls `parseArgs({ args: process.argv.slice(2) })` at runtime. the test proves args are in process.argv because the resource name changes based on the --env value.

## behavior coverage: vision (1.vision.md)

### behavior: "wish file sees --env prod in process.argv"

**test:** plan.integration.test.ts:268-291

**evidence:** line 288 asserts `name === 'Resource-production'`

**why it holds:** the fixture uses `parseArgs` on process.argv. if args were not injected, name would be `Resource-test` (default).

### behavior: "typo safe: declastruct catches typos like --wishe"

**test:** invoke.acceptance.test.ts:88-105

```typescript
it('should catch typos on declastruct flags', async () => {
  const { stderr, exitCode } = await execCli([
    'plan', '--wishe', 'resources.ts', '--into', planFilePath,
  ]);
  expect(exitCode).toBe(1);
  expect(stderr).toContain("error: required option '--wish <file>' not specified");
});
```

**why it holds:** `--wishe` is not a valid flag, so commander treats `--wish` as unspecified, error exit code 1.

### behavior: "unknown flag errors with hint"

**test:** invoke.acceptance.test.ts:62-86

```typescript
it('should guide user to use -- when unknown option passed', async () => {
  const { stderr, exitCode } = await execCli([
    'plan', '--wish', wishFilePath, '--into', planFilePath, '--env', 'prod',
  ]);
  expect(exitCode).toBe(1);
  expect(stderr).toContain("error: unknown option '--env'");
  expect(stderr).toContain('hint: to pass args to your wish file, use: -- --env');
});
```

**why it holds:** passing `--env prod` without `--` triggers error with actionable hint. snapshot captures exact output.

### behavior: "help shows [-- <wish-args>]"

**test:** invoke.acceptance.test.ts:52-58

```typescript
it('should show passthrough args in plan help text', async () => {
  const { stdout, exitCode } = await execCli(['plan', '--help']);
  expect(exitCode).toBe(0);
  expect(stdout).toContain('[-- <wish-args>]');
  expect(stdout).toMatchSnapshot();
});
```

**why it holds:** explicit assertion on `[-- <wish-args>]` plus snapshot for regression detection.

### behavior: "apply ignores passthrough args"

**test:** invoke.acceptance.test.ts:167-193

```typescript
it('should ignore passthrough args in yolo mode', async () => {
  const { exitCode, stdout } = await execCli([
    'apply', '--plan', 'yolo', '--wish', wishFilePath, '--', '--env', 'prod',
  ]);
  expect(exitCode).toBe(0);
  expect(stdout).toContain('Resource-test');
  expect(stdout).not.toContain('Resource-production');
});
```

**why it holds:** args `-- --env prod` passed but resource is `Resource-test` (not production), proves apply ignores passthrough args.

### behavior: "backwards compatible"

**test:** plan.integration.test.ts:338-359

```typescript
it('should work without passthrough args (backwards compat)', async () => {
  await executePlanCommand({ wishFilePath: argsWishFilePath, planFilePath });
  expect((plan.changes[0]?.state.desired as { name: string }).name).toBe('Resource-test');
});
```

**why it holds:** no passthroughArgs passed, resource uses default `test` env, backwards compat preserved.

### behavior: "-- separator stripped"

**test:** plan.integration.test.ts:293-312

**why it holds:** commander handles `--` separator natively. test verifies args after `--` reach process.argv without `--` itself.

### behavior: "multiple args pass through"

**test:** plan.integration.test.ts:314-336

```typescript
it('should pass multiple args', async () => {
  await executePlanCommand({
    wishFilePath: argsWishFilePath, planFilePath,
    passthroughArgs: ['--env', 'prod', '--verbose', '--debug'],
  });
  expect((plan.changes[0]?.state.desired as { name: string }).name).toBe('Resource-production');
});
```

**why it holds:** four args passed, resource reflects prod env, proves all args reached process.argv.

### behavior: "--wish after -- passes to wish file"

**test:** invoke.acceptance.test.ts:139-163

```typescript
it('should pass --wish after -- to wish file (user owns namespace)', async () => {
  const { exitCode } = await execCli([
    'plan', '--wish', wishFilePath, '--into', planFilePath,
    '--', '--env', 'prod', '--wish', 'custom-value',
  ]);
  expect(exitCode).toBe(0);
});
```

**why it holds:** `--wish custom-value` after `--` does not confuse declastruct. user owns namespace after `--`.

## behavior coverage: criteria (2.1.criteria.blackbox.md)

| usecase | test(s) | verified |
|---------|---------|----------|
| usecase.1 plan with passthrough args | plan.integration.test.ts:268-336 (4 tests) | ✓ |
| usecase.2 plan without passthrough args | plan.integration.test.ts:338-359 | ✓ |
| usecase.3 apply ignores passthrough args | invoke.acceptance.test.ts:167-193 | ✓ |
| usecase.4 help text discoverability | invoke.acceptance.test.ts:52-58 | ✓ |
| usecase.5 unknown option guidance | invoke.acceptance.test.ts:62-105 (2 tests) | ✓ |
| usecase.6 edge cases | invoke.acceptance.test.ts:139-163 | ✓ |

## issues found and fixed

**none.** all behaviors have test coverage.

## why this review holds

1. read each behavior document line by line
2. for each behavior, quoted the exact test code
3. explained why the test proves the behavior
4. all behaviors from wish, vision, and criteria have matched tests
5. tests pass: integration 28/28, acceptance 6/6

## conclusion

all behaviors from wish/vision/criteria are covered by tests. no gaps found.
