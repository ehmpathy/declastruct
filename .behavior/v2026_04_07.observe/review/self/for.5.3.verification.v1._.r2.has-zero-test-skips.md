# self-review: has-zero-test-skips (r2)

## question

double-check: did you verify zero skips — and REMOVE any you found?

## why this matters

skips are lies. a skipped test pretends coverage exists when it doesn't. the test suite claims "all pass" but the skipped test never ran. false confidence leads to broken production code.

silent credential bypasses are worse — they hide under `if (!token) return` patterns. tests pass without the code path touched. you think auth works, but the test never reached auth.

## verification method

### 1. grep for .skip() and .only()

ran:
```
grep -E '\.skip\(|\.only\(' **/*.test.ts
```

result: **0 matches**

why this holds: the test files were written fresh for this feature. no inherited skips from prior work. each test was run and verified to pass before the next test was added.

### 2. grep for silent credential bypasses

ran:
```
grep -Ei 'if.*!.*credential|if.*!.*token|if.*!.*key.*return' **/*.test.ts
```

result: **0 matches**

why this holds: the integration tests use real fixtures that exercise the full code path. the `wish-with-auth.fixture.ts` tests provider context without credential bypasses — it either works or throws `BadRequestError`.

### 3. prior failures carried forward

verified: no prior failures. checked by:
- ran `THOROUGH=true npm run test:unit` → 83 tests passed
- ran `THOROUGH=true npm run test:integration` → 65 tests passed
- no flaky tests observed in multiple runs
- no tests marked as "known to fail" or "todo"

### 4. manual inspection of changed test files

inspected `src/contract/cli/plan.integration.test.ts`:
- lines 291-481: all 10 tests in `--snap flag` describe block
- no conditional execution based on environment
- no early returns that skip assertions
- each test has explicit `expect()` calls that verify behavior

## conclusion

zero skips verified through:
1. automated grep found no skip patterns
2. automated grep found no credential bypasses
3. test execution confirmed all tests run
4. manual inspection confirmed no hidden bypasses

the tests are real. they run. they verify behavior.
