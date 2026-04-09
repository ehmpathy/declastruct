# self-review r5: has-pruned-yagni

review for extras that were not prescribed.

YAGNI = "you ain't gonna need it"

---

## method

for each blueprint component, asked:
1. was this explicitly requested in vision or criteria?
2. is this the minimum viable implementation?
3. did we add abstraction "for future flexibility"?
4. did we add features "while we're here"?
5. did we optimize before it was needed?

---

## component review

### 1. DeclastructSnapshot domain object

**explicitly requested?** yes — vision defines output shape with observedAt, remote[], wished[]

**minimum viable?** questioned — could this be a plain TypeScript type?

**analysis:**
- a plain type would work: `type DeclastructSnapshot = { ... }`
- domain object adds: explicit file, importable reference, pattern consistency
- domain object does NOT add: runtime validation, DomainEntity features, methods

**YAGNI check:** is the domain object "for future flexibility"?
- no — it follows extant pattern (DeclastructPlan is a domain object)
- the file exists to declare the interface, not to enable future features
- if we used a plain type, we'd still need a file to export it

**verdict:** no YAGNI violation. domain object is pattern compliance, not future preparation.

### 2. DeclastructSnapshotEntry interface

**explicitly requested?** yes — vision shows entry shape with forResource and state

**minimum viable?** yes — two fields, no methods, no optional properties

**YAGNI check:**
- could we inline this in DeclastructSnapshot?
- no — used twice (remote[] and wished[])
- extraction is DRY, not YAGNI

**verdict:** no YAGNI violation.

### 3. --snap flag

**explicitly requested?** yes — vision primary request

**minimum viable?** yes — one optional flag, no configuration

**YAGNI check:**
- no --snap-format flag
- no --snap-include / --snap-exclude flags
- no --snap-pretty / --snap-compact flags

**verdict:** no YAGNI violation. flag is minimal.

### 4. planChanges changes

**explicitly requested?** yes — need to expose snapshot data

**minimum viable?** yes — two additions:
- collect snapshot entry in loop
- return { plan, snapshot } tuple

**YAGNI check:**
- no snapshot filter options
- no snapshot transformation layer
- no observer pattern for extensibility

**verdict:** no YAGNI violation.

### 5. plan.ts changes

**explicitly requested?** yes — need to write snapshot file

**minimum viable?** yes — one conditional write

**YAGNI check:**
- no pluggable output formatters
- no snapshot validators
- no post-write hooks

**verdict:** no YAGNI violation.

### 6. invoke.ts changes

**explicitly requested?** yes — need to accept flag

**minimum viable?** yes — one `.option()` call

**YAGNI check:** as minimal as possible

**verdict:** no YAGNI violation.

### 7. test cases (8)

**explicitly requested?** each maps to a criterion

**minimum viable?** one test per behavior

**YAGNI check:**
- no property-based tests
- no fuzz tests
- no performance benchmarks
- no multi-resource stress tests

**verdict:** no YAGNI violation. tests cover criteria, no excess.

---

## YAGNI patterns NOT present

| pattern | description | present? |
|---------|-------------|----------|
| abstraction layer | "for future formats" | no |
| configuration | "for future customization" | no |
| plugin system | "for future extensibility" | no |
| validation layer | "for future strictness" | no |
| event hooks | "for future observers" | no |
| version field | "for future schema changes" | no |

---

## hard questions

### "do we NEED a domain object file?"

i genuinely questioned this. the vision prescribes an OUTPUT SHAPE, not a domain object. could we define the type inline in plan.ts?

**i tried this mentally:**
```ts
// in plan.ts
const snapshot = {
  observedAt: asIsoTimestamp(new Date()),
  remote: remoteEntries,
  wished: wishedEntries,
};
await writeFile(snapPath, JSON.stringify(snapshot, null, 2));
```

this would WORK. no separate file needed.

**why i kept the domain object:**
1. DeclastructPlan is a domain object in a file
2. DeclastructSnapshot should match that pattern
3. if someone wants to import the type elsewhere, they can
4. the cost is one file with ~15 lines

the domain object is not YAGNI if the pattern already exists. it would be YAGNI if we were the first to do it.

### "do we NEED 8 test cases?"

8 feels like a lot for one flag. could we verify with 3?
- test 1: flag present → file created with correct structure
- test 2: flag absent → no file
- test 3: null remote state → state is null

**why i kept 8:**
- each test case maps to ONE criterion from 2.1
- to merge tests reduces failure signal precision
- if test 1 fails, which structure element is wrong?

8 tests is not YAGNI if each traces to a requirement. it would be YAGNI if we added "stress test with 1000 resources" without anyone asking.

### "do we NEED forResource wrapper?"

the slug already contains the class name. we could simplify to:
```ts
{ slug: string; state: ... }
```

**why i kept forResource:**
- plan.json uses forResource
- users expect consistency
- to extract class from slug is decode-friction

forResource is not YAGNI — it's consistency. it would be YAGNI if we added forResource.version or forResource.metadata "for future use".

---

## summary

**components reviewed:** 7
**YAGNI violations found:** 0

**why zero YAGNI:**

the blueprint was written AFTER the vision was locked. each component traces to a vision requirement or pattern compliance. there are no "while we're here" additions.

the temptation for YAGNI would appear as:
- "let's add --snap-format=yaml while we're here" — not in blueprint
- "let's add a SnapshotWriter interface for future formats" — not in blueprint
- "let's add a version field for future schema changes" — not in blueprint

none of these appear. the blueprint implements exactly what was requested.

**lesson:**

the has-questioned-deletables review (r3) already pruned excess. YAGNI review confirms: what remains is minimal and requested.
