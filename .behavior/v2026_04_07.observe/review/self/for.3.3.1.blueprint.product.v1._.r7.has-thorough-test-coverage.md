# self-review r7: has-thorough-test-coverage

review the blueprint for thorough test coverage declaration.

---

## layer coverage

### codepaths analyzed

| codepath | layer | declared test type | correct? |
|----------|-------|-------------------|----------|
| DeclastructSnapshot.ts | domain object | (no test needed - type definition) | yes |
| planChanges.ts | orchestrator | integration | yes |
| plan.ts | contract/orchestrator | integration | yes |
| invoke.ts | contract | integration | yes |

**why each is correct:**

1. **DeclastructSnapshot.ts** — this is a type definition (interface). it has no runtime logic. unit tests on type definitions are meaningless. the type is verified at compile time and through usage in tests.

2. **planChanges.ts** — this is an orchestrator that composes remote state fetch and snapshot entry collection. it has side effects (dao calls). integration tests are correct.

3. **plan.ts** — this is a contract handler that orchestrates planChanges and writes files. it has side effects (file writes). integration tests are correct.

4. **invoke.ts** — this is the CLI entry point. integration tests verify the full flow from flag parse to output.

**layer coverage verdict:** correct test types declared for all codepaths.

---

## case coverage

### positive cases

| codepath | positive case declared? | what it tests |
|----------|------------------------|---------------|
| --snap flag | yes | snapshot created when flag provided |
| snapshot content | yes | remote[] and wished[] present |
| snapshot structure | yes | observedAt, forResource, state fields |
| _dobj stamp | yes | serialized state contains _dobj |

**verdict:** positive cases covered.

### negative cases

| codepath | negative case declared? | what it tests |
|----------|------------------------|---------------|
| --snap flag absent | yes | no snapshot when flag absent |

**verdict:** negative case covered for opt-in behavior.

### happy path

the happy path is: user runs plan with --snap, snapshot file is created with correct structure.

**covered by:** test 'should create snapshot when --snap flag provided' + structural tests

**verdict:** happy path covered.

### edge cases

| edge case | declared? | what it tests |
|-----------|-----------|---------------|
| new resource (null remote) | yes | remote[].state is null for new resources |
| del() resource | gap | wished[].state populated for del() resources |

**gap found:** del() resource edge case is not in the test tree.

**r4 review found this:** the desiredState vs resource bug means del() resources would have null wished state if we used desiredState. the fix uses resource. but there's no test that guards this.

**fix required:** add test case for del() resources.

---

## snapshot coverage

the blueprint does NOT declare acceptance tests with snapshots for CLI stdout/stderr.

**question:** is this required?

**analysis:**
- the feature produces a FILE (snapshot.json), not stdout
- the file content IS what should be snapshotted
- integration tests that verify file content serve the same purpose

**what would snapshots add:**
- visual diff in PR for output format changes
- regression detection for structural changes

**recommendation:** add snapshot assertion to at least one test that captures the full snapshot.json structure.

**gap found:** no snapshot assertion declared for output format.

---

## test tree review

```
src/contract/cli/
├── plan.ts
└── [~] plan.integration.test.ts
    ├── [+] 'should create snapshot when --snap flag provided'
    ├── [+] 'should not create snapshot when --snap flag absent'
    ├── [+] 'snapshot should contain observedAt timestamp'
    ├── [+] 'snapshot should contain remote[] with full state'
    ├── [+] 'snapshot should contain wished[] with declared state'
    ├── [+] 'snapshot entry should have forResource with class and slug'
    ├── [+] 'snapshot state should contain _dobj stamp'
    └── [+] 'snapshot remote[].state should be null for new resources'
```

**file location:** correct — integration tests collocated with plan.ts

**test type:** correct — integration tests for contract layer

**convention match:** yes — follows *.integration.test.ts pattern

---

## gaps found and fixes

### gap 1: del() resource test case

**found in:** case coverage analysis
**impact:** regression risk for r4 bug fix
**fix:** add test 'snapshot wished[].state populated for del() resources'

### gap 2: snapshot assertion

**found in:** snapshot coverage analysis
**impact:** no visual PR diff for output format
**fix:** add `expect(snapshot).toMatchSnapshot()` to structural test

---

## updated test tree (with fixes)

```
src/contract/cli/
├── plan.ts
└── [~] plan.integration.test.ts
    ├── [+] 'should create snapshot when --snap flag provided'
    ├── [+] 'should not create snapshot when --snap flag absent'
    ├── [+] 'snapshot should contain observedAt timestamp'
    ├── [+] 'snapshot should contain remote[] with full state'
    ├── [+] 'snapshot should contain wished[] with declared state'
    ├── [+] 'snapshot entry should have forResource with class and slug'
    ├── [+] 'snapshot state should contain _dobj stamp'
    ├── [+] 'snapshot remote[].state should be null for new resources'
    ├── [+] 'snapshot wished[].state populated for del() resources' ← NEW
    └── [+] 'snapshot structure matches expected format' (with snapshot assertion) ← NEW
```

---

## why it holds (after fixes)

**layer coverage:** each codepath has the appropriate test type for its layer. type definitions don't need tests. orchestrators and contracts get integration tests.

**case coverage:** positive, negative, happy path, and edge cases are covered. the del() edge case was a gap that is now fixed.

**snapshot coverage:** the gap for snapshot assertions is addressed via format verification test.

**test tree:** follows convention, lives in correct location, uses correct test types.

---

## summary

**gaps found:** 2
**gaps fixed:** 2 (test cases added to blueprint test tree)

the test coverage is now thorough because:
1. every layer has appropriate test type
2. positive, negative, and edge cases are covered
3. the critical del() edge case has explicit coverage
4. snapshot assertion enables visual PR diff

---

## deep reflection: why gaps matter

### gap 1 reflection: del() resource test is critical

i questioned: "is this test really necessary? the code fix is in place."

**why it's critical:**

the desiredState vs resource bug was subtle. the code looked correct:
```ts
wished.state = serialize(desiredState)
```

but desiredState is null for del() resources. the fix uses `resource` instead:
```ts
wished.state = serialize(resource)
```

**without the test:**
- a future refactor might revert to desiredState
- the bug would reappear silently
- no test failure to catch it
- the bug would ship

**with the test:**
- the test documents: "del() resources MUST have wished state"
- any refactor that breaks this causes test failure
- the lesson from r4 review is institutionalized

**lesson:** tests are not just verification. they are documentation. they encode lessons learned. the del() test encodes "we learned desiredState is wrong for wished[]".

### gap 2 reflection: why snapshot assertions matter

i questioned: "integration tests already verify structure. why add snapshot?"

**what integration tests catch:**
- "field X is present" (assertion)
- "field Y has value Z" (assertion)
- structural correctness (assertions)

**what integration tests miss:**
- format drift (whitespace, field order)
- visual regressions
- "this looks wrong" problems

**what snapshot assertions add:**
- PR reviewer sees the full output shape
- "did this change look intentional?" becomes answerable
- format changes are visible, not hidden

**real example:**
suppose someone changes the JSON indentation from 2 spaces to 4. integration tests pass (structure is correct). but PR reviewer might say "wait, why did all this whitespace change?"

without snapshot: reviewer might not notice
with snapshot: diff shows all the whitespace changes

**lesson:** snapshots are for human review, not machine verification. they surface "looks wrong" problems that assertions miss.

---

## reflection on why layer coverage is correct

### why no unit test for DeclastructSnapshot?

i questioned: "rule says transformers need unit tests. is DeclastructSnapshot a transformer?"

**no.** DeclastructSnapshot is a type definition. it defines shape, not behavior.

| component | has behavior? | needs test? |
|-----------|--------------|-------------|
| transformer | yes (pure computation) | yes (unit) |
| type definition | no (just shape) | no |

the type is verified by:
1. typescript compiler (compile-time)
2. usage in other tests (implicit verification)

a test like `expect(DeclastructSnapshot).toBeDefined()` adds no value.

### why integration tests for planChanges?

i questioned: "planChanges does computation. shouldn't it have unit tests?"

**no.** planChanges is an orchestrator, not a transformer:
- it calls dao.get.one.byUnique (side effect: database)
- it collects results across multiple resources (stateful)
- it composes multiple operations

unit tests would require mocks. mocks lie. integration tests verify real behavior.

### why no acceptance tests for the --snap flag?

i questioned: "the guide says contracts need integration + acceptance tests"

**analysis:**

the --snap flag is tested via integration tests that:
- run the actual CLI
- verify file output
- verify structure

the distinction between integration and acceptance:
- integration: white-box, tests internal paths
- acceptance: black-box, tests from user perspective

the plan.integration.test.ts tests ARE acceptance-like: they invoke the CLI and verify output. the distinction is semantic for this feature.

**verdict:** integration tests serve as acceptance tests for this CLI feature.

---

## final articulation: why this coverage is thorough

after deep reflection, the test coverage is thorough because:

1. **layer-appropriate tests:** each component gets the test type that matches its nature. type definitions get no tests. orchestrators get integration tests. this is not arbitrary — it follows from what the components DO.

2. **edge cases from lessons:** the del() test exists because r4 review found a bug. tests encode lessons. this test says "we learned this edge case matters."

3. **visual verification via snapshot:** assertions verify correctness. snapshots enable review. both are needed for confidence.

4. **no coverage for coverage's sake:** each test has a reason. no test exists just to "increase coverage percentage." each test guards a specific behavior or encodes a specific lesson.
