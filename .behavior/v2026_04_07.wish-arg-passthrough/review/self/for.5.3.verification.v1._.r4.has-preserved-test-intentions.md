# self-review: has-preserved-test-intentions (r4)

## deeper reflection

paused. re-read the guide. reviewed each test file again line by line.

## the core question

> "to 'fix tests' via changed intent is not a fix — it is at worst malicious deception, at best reckless negligence."

did i change **what** tests verify, or did i fix **why** they failed?

## analysis: what the test verified before

`getRefByUnique.integration.test.ts` case3:

```typescript
given('[case3] multiple resources persisted', () => {
  const scene = useBeforeEach(async () => {
    const resource1 = genSampleDemoRefResource({ name: 'First Resource' });
    const resource2 = genSampleDemoRefResource({ name: 'Second Resource' });
    const persisted1 = await demoRefDao.set.findsert(resource1, {});
    const persisted2 = await demoRefDao.set.findsert(resource2, {});
    return { resource1: persisted1, resource2: persisted2 };
  });

  when('[t0] called with RefByPrimary for first resource', () => {
    then('it should return correct unique key', async () => {
      const result = await getRefByUnique(
        { ref: { uuid: scene.resource1.uuid } },
        { dao: demoRefDao },
      );
      expect(result).toEqual({ exid: scene.resource1.exid });
    });
  });
});
```

**what this test verifies:** given multiple persisted resources, getRefByUnique can return the correct unique key for a specific resource identified by uuid.

**what caused the failure:** when tests run in parallel, another test file cleared the temp directory mid-test, so `findResourceByUuid()` returned null because the file no longer existed.

**was the test wrong?** no. the test correctly verifies that getRefByUnique returns the unique key.

**was the code wrong?** no. the code correctly looks up resources by uuid.

**was the infrastructure wrong?** yes. the temp directory was shared between test files, so parallel execution caused interference.

## analysis: what i changed

i added infrastructure isolation:
1. each test file sets a namespace
2. temp directory includes namespace
3. tests no longer share state

i did NOT:
- change any assertion
- change any expected value
- remove any test case
- weaken any verification

## the key insight

the test knew a truth: "getRefByUnique returns unique key for a resource identified by uuid."

that truth is still verified after my change. the test still:
- creates resources
- persists them
- calls getRefByUnique with uuid
- asserts it returns the correct exid

the failure was not because the truth was wrong. the failure was because parallel test execution corrupted shared state.

## forbidden patterns: did i violate any?

| pattern | violated? | evidence |
|---------|-----------|----------|
| weaken assertions | no | all assertions identical |
| remove test cases | no | all 8 tests in file |
| change expected values | no | same exid expectations |
| delete tests that fail | no | fixed infrastructure instead |

## why this holds

the fix addressed **test infrastructure**, not **test intention**.

before: test verifies getRefByUnique returns unique key (but fails due to race condition)
after: test verifies getRefByUnique returns unique key (and passes with isolation)

same verification. different infrastructure.

## conclusion

test intentions preserved. the truth the test knew is still the truth it verifies.
