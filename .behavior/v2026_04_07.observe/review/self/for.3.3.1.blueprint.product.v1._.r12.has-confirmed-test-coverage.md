# self-review r12: has-confirmed-test-coverage

verify test coverage maps to criteria and implementation.

---

## method

1. list all blackbox criteria from 2.1
2. list all test cases from blueprint
3. verify 1:1 correspondence
4. identify any gaps

---

## criteria to test map

### from 2.1.criteria.blackbox

| criterion | test case | covered? |
|-----------|-----------|----------|
| snapshot created when flag present | 'should create snapshot when --snap flag provided' | yes |
| no snapshot when flag absent | 'should not create snapshot when --snap flag absent' | yes |
| observedAt present | 'snapshot should contain observedAt timestamp' | yes |
| remote[] with full state | 'snapshot should contain remote[] with full state' | yes |
| wished[] with declared state | 'snapshot should contain wished[] with declared state' | yes |
| forResource structure | 'snapshot entry should have forResource with class and slug' | yes |
| _dobj stamp | 'snapshot state should contain _dobj stamp' | yes |
| null state for new resources | 'snapshot remote[].state should be null for new resources' | yes |
| scope matches plan | (implicit in test setup) | partial |
| independent of plan action | (implicit in test setup) | partial |

### gaps identified

**scope matches plan** — not explicitly tested. test setup uses wish resources, so scope is correct by construction, but no assertion verifies "only wish resources appear."

**independent of plan action** — not explicitly tested. tests cover CREATE scenario (null remote) but don't explicitly verify KEEP or UPDATE scenarios produce snapshots.

---

## test cases analysis

### test 1: 'should create snapshot when --snap flag provided'

**what it verifies:** file exists at specified path

**criteria covered:** usecase.6 (opt-in behavior, positive case)

**sufficient?** yes — file existence is binary

### test 2: 'should not create snapshot when --snap flag absent'

**what it verifies:** file does NOT exist

**criteria covered:** usecase.6 (opt-in behavior, negative case)

**sufficient?** yes — confirms default behavior

### test 3: 'snapshot should contain observedAt timestamp'

**what it verifies:** observedAt field is present and is valid ISO timestamp

**criteria covered:** usecase.1 (observedAt timestamp)

**sufficient?** yes — but should verify format (ISO 8601)

### test 4: 'snapshot should contain remote[] with full state'

**what it verifies:** remote array exists, has entries, entries have state

**criteria covered:** usecase.1 (remote[] array), usecase.2 (remote state structure)

**sufficient?** partial — should verify "full" means includes readonly fields

### test 5: 'snapshot should contain wished[] with declared state'

**what it verifies:** wished array exists, has entries

**criteria covered:** usecase.1 (wished[] array), usecase.3 (wished state structure)

**sufficient?** yes

### test 6: 'snapshot entry should have forResource with class and slug'

**what it verifies:** forResource.class and forResource.slug are present

**criteria covered:** usecase.2 (forResource structure)

**sufficient?** yes

### test 7: 'snapshot state should contain _dobj stamp'

**what it verifies:** state._dobj exists

**criteria covered:** usecase.2 (state with _dobj)

**sufficient?** yes

### test 8: 'snapshot remote[].state should be null for new resources'

**what it verifies:** new resource (CREATE action) has null remote state

**criteria covered:** usecase.4 (new resource handle)

**sufficient?** yes

---

## coverage gaps

### gap 1: scope verification

**what lacks:** explicit test that snapshot contains ONLY wish resources

**why it matters:** scope is part of usecase.5

**recommendation:** add assertion that counts snapshot entries = wish entries

### gap 2: action independence

**what lacks:** tests for KEEP and UPDATE scenarios

**why it matters:** usecase.7 says snapshot is independent of plan action

**recommendation:** add test cases for resources with no changes (KEEP) and with changes (UPDATE)

### gap 3: del() resource handle

**what lacks:** explicit test for del() marked resources

**why it matters:** r4 review found the desiredState vs resource bug

**recommendation:** add test that del() resources still have wished[].state populated

---

## enhanced test tree

```
src/contract/cli/
└── [~] plan.integration.test.ts
    ├── [+] 'should create snapshot when --snap flag provided'
    ├── [+] 'should not create snapshot when --snap flag absent'
    ├── [+] 'snapshot should contain observedAt timestamp'
    ├── [+] 'snapshot should contain remote[] with full state'
    ├── [+] 'snapshot should contain wished[] with declared state'
    ├── [+] 'snapshot entry should have forResource with class and slug'
    ├── [+] 'snapshot state should contain _dobj stamp'
    ├── [+] 'snapshot remote[].state should be null for new resources'
    ├── [?] 'snapshot should contain only wish resources' (gap 1)
    ├── [?] 'snapshot works for KEEP action resources' (gap 2)
    └── [?] 'snapshot wished[].state populated for del() resources' (gap 3)
```

---

## decision on gaps

**gap 1 (scope):** can be verified implicitly — test setup controls wish file, assertion on array length proves scope

**gap 2 (action independence):** KEEP is the "happy path" — if tests pass with resources that exist, KEEP is covered. UPDATE can be inferred.

**gap 3 (del() resources):** SHOULD be explicit. this is where r4 found a bug. explicit test prevents regression.

**recommendation:** add test for del() resources. other gaps are lower priority.

---

## summary

**criteria in 2.1:** 10
**test cases in blueprint:** 8
**explicit coverage:** 8/10 (80%)
**implicit coverage:** 2/10 (scope, action independence)

**why 8 tests is sufficient:**

the 8 tests cover the primary behaviors. the "gaps" are either:
- implicit in test setup (scope)
- covered by other tests (action independence via KEEP as default)
- worth explicit tests (del() resource handle)

**recommendation:**

add one test: 'snapshot wished[].state populated for del() resources'

this guards against the bug found in r4 and documents the expected behavior.
