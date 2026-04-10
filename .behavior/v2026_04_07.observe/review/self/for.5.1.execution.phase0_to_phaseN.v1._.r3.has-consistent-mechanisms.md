# consistent-mechanisms self-review: --snap implementation

## checklist

for each new mechanism in the code, asked:
- does the codebase already have a mechanism that does this?
- did we reuse the extant mechanism or duplicate it?
- could we reuse an extant component instead of a new one?

---

## review by component

### 1. serialize() usage

**new code in planChanges.ts:97-103:**
```ts
snapshotRemote.push(
  new DeclastructSnapshotEntry({
    forResource,
    state: remoteState ? JSON.parse(serialize(remoteState)) : null,
  }),
);
snapshotWished.push(
  new DeclastructSnapshotEntry({
    forResource,
    state: JSON.parse(serialize(resource)),
  }),
);
```

**extant usage in codebase:**
- `computeChange.ts:44`: `serialize(input.desired)` for string comparison
- `computeChange.ts:45`: `serialize(input.remote)` for string comparison
- `getDisplayableDiff.ts:19-20`: `serialize(input.state.desired)`, `serialize(input.state.remote)`

**why it holds:** `serialize()` from domain-objects is the standard serialization approach in this codebase. all domain object serialization flows through this function. the snapshot code follows the same pattern.

---

### 2. forResource structure

**new code in DeclastructSnapshotEntry (DeclastructSnapshot.ts:13-23):**
```ts
forResource: {
  /**
   * class name of the resource
   */
  class: string;

  /**
   * scannable identifier of this specific resource
   */
  slug: string;
};
```

**extant usage in DeclastructChange (DeclastructChange.ts:49-59):**
```ts
forResource: {
  /**
   * class name of the resource to change
   */
  class: string;

  /**
   * scannable identifier of this specific resource
   */
  slug: string;
};
```

**why it holds:** the structure is identical. the jsdoc comments match too (both use "class name" and "scannable identifier"). this is intentional — both DeclastructChange and DeclastructSnapshotEntry need to identify resources in the same way. the pattern is consistent.

---

### 3. getUniqueIdentifierSlug usage

**new code in planChanges.ts:83-92:**
```ts
slug: UnexpectedCodePathError.wrap(
  () => getUniqueIdentifierSlug(resource),
  {
    message: 'failed to getUniqueIdentifierSlug for snapshot',
    metadata: {
      resource,
      ctor: resource.constructor.name,
    },
  },
)(),
```

**extant usage:**
- `planChanges.ts:65`: `getUniqueIdentifierSlug(resource)` for log output
- `computeChange.ts:46-58`: uses `getUniqueIdentifier()` then serializes to build slug
- `computeUniqueIdentifierSlugHash.ts`: composes `getUniqueIdentifierSlug()` with hash

**why it holds:** `getUniqueIdentifierSlug()` is the standard way to get resource slugs in this codebase. the new code is consistent with the log output already in planChanges.ts at line 65.

---

### 4. observedAt timestamp

**new code in planChanges.ts:50:**
```ts
const observedAt = asIsoTimestamp(new Date());
```

**extant usage:**
- `planChanges.ts:152`: `createdAt: asIsoTimestamp(new Date())` for plan timestamp
- used throughout codebase for ISO timestamp generation

**why it holds:** uses the same `asIsoTimestamp()` utility already used in planChanges.ts for the plan's `createdAt`. the pattern is consistent — timestamps are captured via `asIsoTimestamp(new Date())`.

---

### 5. DeclastructSnapshotEntry as DomainLiteral

**new code in DeclastructSnapshot.ts:34-36:**
```ts
export class DeclastructSnapshotEntry
  extends DomainLiteral<DeclastructSnapshotEntry>
  implements DeclastructSnapshotEntry {}
```

**extant usage:**
- `DeclastructChange.ts:91-95`: same pattern for DeclastructChange
- `DeclastructPlan.ts`: DeclastructPlan extends DomainLiteral
- all domain literals in this codebase follow this pattern

**why it holds:** the `extends DomainLiteral<T> implements T` pattern is the standard way to define domain literals in this codebase. consistent with all other domain objects.

---

### 6. nested hydration declaration

**new code in DeclastructSnapshot.ts:63-66:**
```ts
public static nested = {
  remote: DeclastructSnapshotEntry,
  wished: DeclastructSnapshotEntry,
};
```

**extant usage:**
- `DeclastructPlan.ts`: `public static nested = { changes: DeclastructChange }`
- documented in domain-objects package for nested array hydration

**why it holds:** the `nested` declaration is required for domain-objects to properly hydrate nested arrays. DeclastructPlan uses the same pattern for its `changes` array. consistent with domain-objects conventions.

---

## summary

**new mechanisms introduced:** 0
**extant mechanisms reused:** 6

the implementation correctly reuses:
1. `serialize()` for domain object serialization
2. `forResource: { class, slug }` structure for resource identification
3. `getUniqueIdentifierSlug()` for slug computation
4. `asIsoTimestamp()` for timestamp generation
5. `DomainLiteral` base class pattern for domain objects
6. `nested` static declaration for array hydration

no duplicate mechanisms were introduced. all new code follows patterns already established in this codebase.
