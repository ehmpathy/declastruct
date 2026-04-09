# behavior-declaration-adherance self-review: --snap implementation

## checklist

for each file changed in this PR, checked against the behavior declaration:
- does the implementation match what the vision describes?
- does the implementation satisfy the criteria correctly?
- does the implementation follow the blueprint accurately?

---

## review: DeclastructSnapshot.ts adherance

### blueprint specified:
```ts
interface DeclastructSnapshot {
  observedAt: IsoTimestamp;
  remote: DeclastructSnapshotEntry[];
  wished: DeclastructSnapshotEntry[];
}

interface DeclastructSnapshotEntry {
  forResource: { class: string; slug: string; };
  state: Record<string, any> | null;
}
```

### implementation (DeclastructSnapshot.ts):

| blueprint | implemented | line | adheres? |
|-----------|-------------|------|----------|
| observedAt: IsoTimestamp | observedAt: IsoTimestamp | 46 | yes |
| remote: DeclastructSnapshotEntry[] | remote: DeclastructSnapshotEntry[] | 51 | yes |
| wished: DeclastructSnapshotEntry[] | wished: DeclastructSnapshotEntry[] | 56 | yes |
| forResource.class: string | forResource.class: string | 17 | yes |
| forResource.slug: string | forResource.slug: string | 22 | yes |
| state: Record<string, any> \| null | state: Record<string, any> \| null | 31 | yes |

**why it holds:** the interface structure is identical to the blueprint. the `nested` declaration (line 63-66) was added per domain-objects library requirements — not in blueprint but necessary for array hydration.

---

## review: invoke.ts adherance

### blueprint specified:
```
add `.option('--snap <file>', ...)`
pass to executePlanCommand
```

### implementation (invoke.ts):

| blueprint | implemented | line | adheres? |
|-----------|-------------|------|----------|
| .option('--snap <file>', ...) | .option('--snap <file>', 'Path to output snapshot file') | 27 | yes |
| pass to executePlanCommand | snapFilePath: options.snap ?? null | 33 | yes |

**why it holds:** the CLI option is added exactly as specified. the `?? null` ensures snapFilePath is null when --snap is not provided, which matches the nullable type in plan.ts.

---

## review: plan.ts adherance

### blueprint specified:
```
accept `snapFilePath` parameter
write snapshot to file if path provided
```

### implementation (plan.ts):

| blueprint | implemented | line | adheres? |
|-----------|-------------|------|----------|
| accept snapFilePath parameter | snapFilePath: string \| null | 27 | yes |
| write snapshot if path provided | if (resolvedSnapPath) { ... writeFile(...) } | 99-107 | yes |

**why it holds:** the parameter is typed as `string | null` which correctly represents the optional nature. the conditional write at lines 99-107 only writes when resolvedSnapPath is truthy.

---

## review: planChanges.ts adherance

### blueprint specified:
```
- collect snapshot entries BEFORE omitReadonly
- serialize with serialize() from domain-objects
- use resource (not desiredState) for wished[]
- return { plan, snapshot } tuple
```

### implementation verification:

**requirement 1: collect BEFORE omitReadonly**

code flow verified line by line:
```
line 68-71:  remoteState = await dao.get.one.byUnique(resource, providerContext)
line 78:     desiredState = isMarkedForDeletion(resource) ? null : resource
line 80:     // comment: "collect snapshot entry BEFORE omitReadonly"
line 94-99:  snapshotRemote.push(new DeclastructSnapshotEntry({ ... }))
line 100-105: snapshotWished.push(new DeclastructSnapshotEntry({ ... }))
line 108:    computed = computeChange({ desired, remote })  <-- omitReadonly happens here
```

why it adheres: snapshot collection (94-105) happens 3 lines BEFORE computeChange (108). the comment at line 80 documents this intent.

**requirement 2: serialize with serialize() from domain-objects**

code verified:
```ts
// planChanges.ts line 4:
import { type DomainEntity, getUniqueIdentifierSlug, serialize } from 'domain-objects';

// planChanges.ts line 97:
state: remoteState ? JSON.parse(serialize(remoteState)) : null,

// planChanges.ts line 103:
state: JSON.parse(serialize(resource)),
```

why it adheres: `serialize` is imported from `domain-objects` and used for both remote and wished state.

**requirement 3: use resource (not desiredState) for wished[]**

code verified:
```ts
// planChanges.ts line 78:
const desiredState = isMarkedForDeletion(resource) ? null : resource;

// planChanges.ts line 103:
state: JSON.parse(serialize(resource)),  // uses `resource`, NOT `desiredState`
```

why it adheres: line 103 explicitly uses `resource` (the declared resource from the wish file), not `desiredState` (which would be null for del() resources). this ensures del() resources have their full state in wished[].

**requirement 4: return { plan, snapshot } tuple**

code verified:
```ts
// planChanges.ts line 38:
): Promise<{ plan: DeclastructPlan; snapshot: DeclastructSnapshot }> => {

// planChanges.ts line 166:
return { plan, snapshot };
```

why it adheres: return type and return statement both match the specified tuple shape.

---

## review: plan.integration.test.ts adherance

### blueprint specified 9 tests:

| test | implemented | line | adheres? |
|------|-------------|------|----------|
| should create snapshot when --snap flag provided | yes | 291-300 | yes |
| should not create snapshot when --snap flag absent | yes | 302-315 | yes |
| should contain observedAt timestamp in snapshot | yes | 317-330 | yes |
| should contain remote[] with full state | covered by line 332-346 | 332 | yes |
| should contain wished[] with declared state | covered by line 332-346 | 332 | yes |
| should have forResource with class and slug | yes | 348-371 | yes |
| should contain _dobj stamp | yes | 373-387 | yes |
| should have null remote state for new resources | yes | 389-405 | yes |
| should have wished state populated for del() resources | yes | 407-453 | yes |
| (bonus) snapshot structure matches expected format | yes | 455-479 | bonus |

**why it holds:** all 9 specified tests are implemented, plus 1 additional structure test. the test names match the blueprint's test descriptions closely.

---

## deviations found

### deviation 1: nested declaration in DeclastructSnapshot

**blueprint:** did not specify `public static nested`

**implementation:** added `public static nested = { remote: DeclastructSnapshotEntry, wished: DeclastructSnapshotEntry }`

**why it holds:** this is required by domain-objects library for proper nested array hydration. without it, `new DeclastructSnapshot(JSON.parse(snapJson))` would not instantiate the nested entries as DeclastructSnapshotEntry instances. this is a necessary addition, not a deviation.

### deviation 2: console.info for snap path

**blueprint:** did not specify log output for snap path

**implementation:** plan.ts:53 and 118 log `   snap: ${relativeSnapPath}`

**why it holds:** this follows the extant pattern for wish and plan paths. it's an ergonomic addition that helps users know where their snapshot was written. the vision mentioned "snapshot.json shows all that declastruct observed" — log output helps users find it.

---

## potential issues questioned

### question 1: does observedAt capture the right moment?

**concern:** should observedAt be when observation *started* or *ended*?

**verified in planChanges.ts:**
```ts
// line 50 - timestamp captured BEFORE the for loop starts
const observedAt = asIsoTimestamp(new Date());

// lines 56-138 - for loop iterates resources and makes API calls
for (const resource of input.resources) { ... }
```

**why it adheres:** observedAt is captured at line 50, before any API calls. this matches the vision which says "observedAt should reflect when observation began". if it were captured after, it would be less accurate for lengthy plans.

### question 2: does JSON.parse(serialize(...)) produce the correct shape?

**concern:** is this the right way to get state with _dobj stamp?

**verified:**
- `serialize()` from domain-objects returns a JSON string with _dobj metadata
- `JSON.parse()` converts it back to a plain object
- the result is `Record<string, any>` which matches DeclastructSnapshotEntry.state type

**why it adheres:** this is the same pattern used in computeChange.ts and getDisplayableDiff.ts. the _dobj stamp comes from serialize(), and JSON.parse() preserves it.

### question 3: could OMIT actions cause snapshot/plan mismatch?

**concern:** if computeChange returns null (OMIT), the change isn't added to plan. does snapshot still include it?

**verified in planChanges.ts:**
```ts
// lines 94-105: snapshot entry added for every resource
snapshotRemote.push(new DeclastructSnapshotEntry({ ... }));
snapshotWished.push(new DeclastructSnapshotEntry({ ... }));

// lines 108-111: computeChange called
const computed = computeChange({ ... });

// lines 114-120: if OMIT, change is not added to plan
if (!computed) {
  context.log.info(`   └─ decision ${colorizeAction(DeclastructChangeAction.OMIT)}`);
  return null;
}
```

**why it adheres:** snapshot entries are added (lines 94-105) BEFORE the OMIT check (line 114). this means snapshot captures ALL resources, even those that get OMIT in the plan. this is correct per the vision - snapshot shows "what declastruct observed", not just what it plans to change.

---

## summary

**deviations from spec:** 0 material deviations
**ergonomic additions:** 2 (nested declaration, log output)
**potential issues questioned:** 3 (all verified as non-issues)

the implementation adheres to the behavior declaration. the two additions are either required (nested) or follow extant patterns (log output). all potential issues were questioned and verified as correct behavior.
