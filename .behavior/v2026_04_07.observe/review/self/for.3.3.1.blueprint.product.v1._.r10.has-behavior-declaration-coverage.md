# self-review r10: has-behavior-declaration-coverage

review for coverage of the behavior declaration.

---

## method

for each requirement in vision and criteria:
1. does the blueprint address it?
2. is the implementation sequence complete?
3. are tests declared for the requirement?

---

## vision requirements checklist

### requirement 1: --snap flag on plan command

**vision says:**
> `npx declastruct plan --wish resources.ts --into plan.json --snap snapshot.json`

**blueprint addresses:**
- invoke.ts: add `--snap <file>` option (filediff tree)
- codepath tree: `[+] --snap <file>` under plan command

**verdict:** covered.

### requirement 2: observedAt timestamp

**vision says:**
> "observedAt": "2026-04-07T15:00:00.000Z"

**blueprint addresses:**
- DeclastructSnapshot interface: `observedAt: IsoTimestamp`

**verdict:** covered.

### requirement 3: remote[] array with full state

**vision says:**
```json
"remote": [{
  "forResource": { "class": "...", "slug": "..." },
  "state": { "_dobj": "...", "id": "...", ... }
}]
```

**blueprint addresses:**
- DeclastructSnapshot: `remote: DeclastructSnapshotEntry[]`
- DeclastructSnapshotEntry: `forResource` + `state`
- planChanges: `serialize(remoteState)` for state

**verdict:** covered.

### requirement 4: wished[] array with declared state

**vision says:**
```json
"wished": [{
  "forResource": { "class": "...", "slug": "..." },
  "state": { "_dobj": "...", ... }
}]
```

**blueprint addresses:**
- DeclastructSnapshot: `wished: DeclastructSnapshotEntry[]`
- planChanges: `serialize(resource)` for state (note: resource, not desiredState)

**verdict:** covered.

### requirement 5: _dobj stamp in serialized state

**vision says:**
> `"_dobj": "DeclaredCloudflareDomainZone"`

**blueprint addresses:**
- uses `serialize()` from domain-objects
- serialize() stamps `_dobj` automatically

**verdict:** covered implicitly (serialize() behavior).

### requirement 6: forResource with class and slug

**vision says:**
```json
"forResource": {
  "class": "DeclaredCloudflareDomainZone",
  "slug": "DeclaredCloudflareDomainZone.example.com.abc123"
}
```

**blueprint addresses:**
- DeclastructSnapshotEntry: `forResource: { class: string; slug: string }`
- codepath: uses `getUniqueIdentifierSlug()` for slug

**verdict:** covered.

### requirement 7: state is null for new resources

**vision says:**
> remote[].state is null for resources that don't exist remotely yet

**blueprint addresses:**
- DeclastructSnapshotEntry: `state: Record<string, any> | null`
- codepath: `serialize(remoteState)` where remoteState may be null

**verdict:** covered.

---

## criteria requirements checklist

### usecase.1: snapshot full state

| criterion | blueprint coverage |
|-----------|-------------------|
| snapshot.json is created | plan.ts writes file if --snap provided |
| contains observedAt | DeclastructSnapshot.observedAt |
| contains remote[] | DeclastructSnapshot.remote |
| contains wished[] | DeclastructSnapshot.wished |

**verdict:** all covered.

### usecase.2: remote state structure

| criterion | blueprint coverage |
|-----------|-------------------|
| forResource.class | DeclastructSnapshotEntry.forResource.class |
| forResource.slug | DeclastructSnapshotEntry.forResource.slug |
| state contains full serialized instance | serialize() without omitReadonly |
| state contains _dobj | serialize() stamps _dobj |

**verdict:** all covered.

### usecase.3: wished state structure

| criterion | blueprint coverage |
|-----------|-------------------|
| forResource.class | same as remote |
| forResource.slug | same as remote |
| state contains full serialized instance | serialize(resource) |
| state contains _dobj | serialize() stamps _dobj |

**verdict:** all covered.

### usecase.4: new resource (no remote state)

| criterion | blueprint coverage |
|-----------|-------------------|
| remote[] contains entry | yes, for all resources in wish |
| forResource identifies resource | yes |
| state is null | yes, `state: ... \| null` |
| wished[] contains declared state | yes |

**verdict:** all covered.

### usecase.5: snapshot scope matches plan

| criterion | blueprint coverage |
|-----------|-------------------|
| only resources in wish included | yes, iterates over wish resources only |
| resources not in wish excluded | yes, does not look up remote-only resources |

**verdict:** covered.

### usecase.6: opt-in behavior

| criterion | blueprint coverage |
|-----------|-------------------|
| no snapshot without --snap | plan.ts: "if --snap provided" |
| snapshot created at specified path | plan.ts: writes to snapFilePath |

**verdict:** covered.

### usecase.7: snapshot independent of plan outcome

| criterion | blueprint coverage |
|-----------|-------------------|
| captures state for KEEP resources | yes, snapshot collected before computeChange |
| captures state for CREATE/UPDATE/DESTROY | yes, same path |

**verdict:** covered.

---

## gaps found

### gap check 1: del() resources

**question:** is wished[].state populated for del() resources?

**analysis:**
- del() resources have `desiredState = null` (the computed desired state)
- but the user DECLARED a resource (with del() wrapper)
- the blueprint says: "use resource (not desiredState) for wished[]"

**verdict:** covered by blueprint note: `serialize(resource)` not `serialize(desiredState)`.

### gap check 2: snapshot file write pattern

**question:** does blueprint show mkdir + writeFile pattern?

**analysis:**
- filediff tree shows `[~] plan.ts # handle snapFilePath, write snapshot`
- research stone showed the mkdir + writeFile pattern
- implementation sequence: "write snapshot to file if path provided"

**verdict:** implicitly covered; implementation will follow plan.ts pattern.

### gap check 3: test coverage for criteria

**question:** does every criterion have a test?

| criterion | test in blueprint |
|-----------|-------------------|
| snapshot created | 'should create snapshot when --snap flag provided' |
| no snapshot without flag | 'should not create snapshot when --snap flag absent' |
| observedAt present | 'snapshot should contain observedAt timestamp' |
| remote[] present | 'snapshot should contain remote[] with full state' |
| wished[] present | 'snapshot should contain wished[] with declared state' |
| forResource structure | 'snapshot entry should have forResource with class and slug' |
| _dobj stamp | 'snapshot state should contain _dobj stamp' |
| null state for new | 'snapshot remote[].state should be null for new resources' |
| del() resources | 'snapshot wished[].state populated for del() resources' |

**verdict:** all criteria have test coverage in blueprint.

---

## hard question: did the junior skip or forget any part of the spec?

the guide warns: "a junior touched this pr... they may have omitted requirements or left features unimplemented."

### question 1: is the hash field present in DeclastructSnapshot?

**observation:** DeclastructPlan has a `hash` field for validation on apply.

**should DeclastructSnapshot have a hash?**

the vision does not mention a hash. the wish does not mention verification.

snapshots are for debug and audit — not for apply. there is no "apply snapshot" command.

**verdict:** hash is NOT required. the blueprint correctly omits it.

### question 2: is the wish.uri field present in DeclastructSnapshot?

**observation:** DeclastructPlan has a `wish: { uri: string }` field.

**should DeclastructSnapshot reference the wish file?**

the vision shows the output shape:
```json
{
  "observedAt": "...",
  "remote": [...],
  "wished": [...]
}
```

no `wish` field is mentioned. the wish file path is implicit (you ran the command with `--wish`).

**verdict:** wish.uri is NOT required. the blueprint correctly omits it.

### question 3: is the implementation sequence complete?

**blueprint sequence:**
1. create DeclastructSnapshot domain object
2. update planChanges to collect snapshot entries
3. update plan.ts to handle snapshot
4. update invoke.ts to add --snap flag
5. add integration tests

**missing step check:**
- does sequence mention error wrapping for getUniqueIdentifierSlug? → NO (implementation detail)
- does sequence mention mkdir before write? → NO (implicit in "write snapshot to file")

**are these gaps?**

these are implementation details, not requirements. the blueprint provides the "what", implementation provides the "how". the research stone documents the mkdir pattern; the review r8 identified error wrapping.

**verdict:** sequence is complete at the specification level.

### question 4: does the test tree cover all criteria?

**criteria → test mapping:**

| criteria usecase | test coverage |
|------------------|---------------|
| 1. snapshot full state | 4 tests (created, observedAt, remote[], wished[]) |
| 2. remote state structure | 3 tests (forResource, state, _dobj) |
| 3. wished state structure | same tests as remote |
| 4. new resource | 1 test (null state) |
| 5. snapshot scope | implicit in test setup |
| 6. opt-in behavior | 2 tests (with/without flag) |
| 7. independent of plan outcome | implicit (KEEP resources included) |

**missing test check:**
- usecase 5 (scope matches plan) has no explicit test
- usecase 7 (independent of outcome) has no explicit test

**are these gaps?**

usecase 5 is implicit: tests use a wish file with specific resources; if snapshot included unexpected resources, assertions would fail.

usecase 7 is implicit: the "should create snapshot when --snap flag provided" test runs with some KEEP resources (no changes needed); if snapshot failed for KEEP, test would fail.

**verdict:** implicit coverage is acceptable. explicit tests would be nice-to-have, not required.

---

## deep reflection: what would a real gap look like?

i questioned: "am i rubber-stamping, or am i actually checking?"

**example of a real gap (hypothetical):**

if the criteria said:
> "snapshot should include the original wish file hash for validation"

and the blueprint had no hash field — that would be a gap.

**what i checked:**
1. vision says observedAt → blueprint has observedAt ✓
2. vision says remote[] → blueprint has remote[] ✓
3. vision says wished[] → blueprint has wished[] ✓
4. vision says forResource.class → blueprint has forResource.class ✓
5. vision says forResource.slug → blueprint has forResource.slug ✓
6. vision says state with _dobj → blueprint uses serialize() which stamps _dobj ✓
7. vision says null state for new → blueprint has `state: ... | null` ✓
8. criteria says opt-in → blueprint checks "if --snap provided" ✓
9. criteria says scope matches plan → blueprint iterates wish resources only ✓

**what i found:**
- NO gaps in required functionality
- two implicit test coverages (usecase 5, 7) that are acceptable

---

## articulation: why coverage is complete

i questioned each vision requirement and each criterion:

1. **vision requirements:** 7 requirements, all traced to blueprint elements
2. **criteria usecases:** 7 usecases, all addressed in domain objects and codepaths
3. **gap checks:** 4 hard questions examined
4. **potential missing features:** hash and wish.uri examined and confirmed NOT required

**why the blueprint is complete:**

the vision describes what the output should look like. every field is present:
- `observedAt` ✓
- `remote[]` with `forResource` and `state` ✓
- `wished[]` with `forResource` and `state` ✓
- `state` contains `_dobj` (via serialize()) ✓
- `state` can be null for new resources ✓

the criteria describe the behavior. every usecase is addressed:
- positive cases (snapshot created) ✓
- negative cases (no snapshot without flag) ✓
- edge cases (new resource, del() resource) ✓
- scope and independence (implicit in implementation) ✓

every requirement maps to blueprint elements. the junior did not skip any part of the spec.
