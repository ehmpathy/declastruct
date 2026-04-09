# consistent-conventions self-review: --snap implementation

## checklist

for each name choice in the code, asked:
- what name conventions does the codebase use?
- do we use a different namespace, prefix, or suffix pattern?
- do we introduce new terms when extant terms exist?
- does our structure match extant patterns?

---

## review by component

### 1. domain object name: DeclastructSnapshot

**extant convention (src/domain.objects/*.ts):**
```
DeclastructPlan.ts:37      → export class DeclastructPlan
DeclastructChange.ts:91    → export class DeclastructChange
DeclastructProvider.ts:43  → export class DeclastructProvider
DeclastructDao.ts:135      → export class DeclastructDao
```

**new name:** `DeclastructSnapshot.ts:59 → export class DeclastructSnapshot`

**why it holds:** follows the `Declastruct*` prefix convention. all 5 domain objects now share this prefix:
- DeclastructPlan, DeclastructChange, DeclastructProvider, DeclastructDao (extant)
- DeclastructSnapshot (new)

---

### 2. domain object name: DeclastructSnapshotEntry

**extant convention (container/entry relationship):**
```
DeclastructPlan.ts:34   → changes: DeclastructChange[];
                           ^^^^^^^^                 ^^^^^
                           container                entry
```

**new name:**
```
DeclastructSnapshot.ts:51 → remote: DeclastructSnapshotEntry[];
DeclastructSnapshot.ts:56 → wished: DeclastructSnapshotEntry[];
                             ^^^^^^                      ^^^^^
                             container                   entry
```

**why it holds:** follows the pattern where a container has `*Entry` items:
- DeclastructPlan contains DeclastructChange entries
- DeclastructSnapshot contains DeclastructSnapshotEntry entries

the `Entry` suffix communicates "this is a single item within a collection".

---

### 3. CLI option: --snap

**extant convention (invoke.ts):**
- `--wish <file>` - 4 chars, noun
- `--into <file>` - 4 chars, preposition (describes destination)
- `--plan <file>` - 4 chars, noun

**new option:** `--snap <file>` - 4 chars, noun (short for snapshot)

**why it holds:** follows the short, lowercase name convention. 4 characters like other options. obvious intent (snap = snapshot).

---

### 4. parameter name: snapFilePath

**extant convention (plan.ts):**
- `wishFilePath`
- `planFilePath`

**new name:** `snapFilePath`

**why it holds:** follows the `*FilePath` suffix pattern for file path parameters. consistent with extant names.

---

### 5. variable names: resolvedSnapPath, relativeSnapPath

**extant convention (plan.ts):**
- `resolvedWishPath`, `resolvedPlanPath`
- `relativeWishPath`, `relativePlanPath`

**new names:** `resolvedSnapPath`, `relativeSnapPath`

**why it holds:** follows the `resolved*Path` and `relative*Path` patterns. consistent with how wish and plan paths are named.

---

### 6. log output format

**extant convention (plan.ts:51-52):**
```
   wish: ${relativeWishPath}
   plan: ${relativePlanPath}
```

**new output (plan.ts:53):**
```
   snap: ${relativeSnapPath}
```

**why it holds:** follows the same indentation and format. uses the same short noun pattern (wish, plan, snap).

---

### 7. property names in snapshot

**extant convention in DeclastructChange (lines 49-88):**
```ts
forResource: {
  class: string;   // line 53
  slug: string;    // line 58
};
state: {
  desired: TResource | null;   // line 75
  remote: TResource | null;    // line 80
  difference: string | null;   // line 85
};
```

**new names in DeclastructSnapshotEntry (lines 13-31):**
```ts
forResource: {
  class: string;   // line 17
  slug: string;    // line 22
};
state: Record<string, any> | null;  // line 31
```

**why it holds:**
1. `forResource: { class, slug }` — exact structural match with DeclastructChange
2. `state` — same property name as DeclastructChange.state
3. `observedAt` — follows `*At` timestamp convention (like `createdAt` in DeclastructPlan:20)
4. `remote[]` / `wished[]` — clear domain terms that connect to CLI vocabulary

**alternative considered:** could have named arrays `remoteEntries[]` / `wishedEntries[]` but the shorter `remote[]` / `wished[]` is clearer and matches how DeclastructPlan uses `changes[]` not `changeEntries[]`.

---

### 8. array names: snapshotRemote, snapshotWished

**extant convention in planChanges.ts:**
- `changes` array for plan changes

**new names:** `snapshotRemote`, `snapshotWished`

**why it holds:** prefixed with `snapshot` to clearly indicate purpose. the suffix `Remote` and `Wished` match the property names in the final snapshot object (`snapshot.remote`, `snapshot.wished`).

---

## summary

**divergences from extant conventions:** 0

all new names follow extant patterns:
1. `Declastruct*` prefix for domain objects
2. `*FilePath` suffix for file path parameters
3. `resolved*Path` and `relative*Path` for path variants
4. Short, lowercase CLI option names
5. `*At` suffix for timestamps
6. `forResource: { class, slug }` structure matches DeclastructChange exactly
7. Log output format matches extant style

no new terms were introduced where extant terms exist. all names are consistent with codebase conventions.
