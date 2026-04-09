# self-review r8: has-pruned-abstractions

eliminate premature abstractions. inline unless proven necessary.

---

## method

for each abstraction in the blueprint, asked:
1. is this used in more than one place?
2. if not, should it be inline?
3. does the abstraction hide complexity or create it?

---

## abstractions analyzed

### 1. DeclastructSnapshot domain object

**what it is:** a type definition for the snapshot output shape.

**used in more than one place?**
- defined in domain.objects/DeclastructSnapshot.ts
- used in planChanges.ts (return type)
- used in plan.ts (write to file)

**should it be inline?**

i questioned this. could we define the type inline in plan.ts?

```ts
// option A: inline type
const snapshot: {
  observedAt: IsoTimestamp;
  remote: Array<{ forResource: {...}; state: {...} }>;
  wished: Array<{ forResource: {...}; state: {...} }>;
} = { ... };

// option B: domain object
const snapshot: DeclastructSnapshot = { ... };
```

**why domain object is correct:**
- DeclastructPlan is a domain object (extant pattern)
- the type is used in multiple files (planChanges, plan.ts)
- if someone wants to import the type elsewhere, they can
- the abstraction documents intent, not just shape

**verdict:** keep the domain object. it follows extant pattern.

### 2. DeclastructSnapshotEntry interface

**what it is:** the shape of each entry in remote[] and wished[].

**used in more than one place?**
- used in remote[] array
- used in wished[] array

**should it be inline?**

```ts
// option A: inline, repeated
interface DeclastructSnapshot {
  remote: Array<{ forResource: {...}; state: {...} }>;
  wished: Array<{ forResource: {...}; state: {...} }>;
}

// option B: extracted
interface DeclastructSnapshotEntry { forResource: {...}; state: {...}; }
interface DeclastructSnapshot {
  remote: DeclastructSnapshotEntry[];
  wished: DeclastructSnapshotEntry[];
}
```

**why extraction is correct:**
- DRY: the shape is identical for both arrays
- if shape changes, change in one place
- readability: entry shape is named, not repeated

**verdict:** keep the extracted interface. it's DRY, not premature.

### 3. collectSnapshotEntry helper (NOT in blueprint)

**what it is:** a hypothetical function to collect each entry.

**is it in the blueprint?** no — the blueprint shows inline collection in the loop.

**should we add it?**

```ts
// option A: inline (current blueprint)
for (const resource of resources) {
  const remoteEntry = { forResource: {...}, state: serialize(remoteState) };
  const wishedEntry = { forResource: {...}, state: serialize(resource) };
  // ...
}

// option B: helper function
const remoteEntry = collectSnapshotEntry(resource, remoteState);
const wishedEntry = collectSnapshotEntry(resource, resource);
```

**why inline is correct:**
- the collection logic is two lines
- a helper would just move those two lines elsewhere
- no reuse — collection happens once per resource
- helper adds indirection without simplification

**verdict:** no helper needed. inline is clearer.

---

## abstractions NOT added

| potential abstraction | why not added |
|-----------------------|---------------|
| SnapshotWriter class | one write call, no need for class |
| SnapshotCollector | collection is loop-inline, no class needed |
| serializeForSnapshot() | serialize() already does the job |
| SnapshotConfig type | no configuration options exist |

---

## hard question: is the domain object file justified?

i genuinely questioned whether we need a separate file for DeclastructSnapshot.

**the cost:** one file (~20 lines) in domain.objects/

**the benefit:**
- matches DeclastructPlan pattern
- type is importable by external consumers (if they want it)
- documents the snapshot contract explicitly

**the alternative:** define inline in plan.ts

```ts
// in plan.ts
type Snapshot = {
  observedAt: IsoTimestamp;
  remote: Array<{ forResource: { class: string; slug: string }; state: Record<string, any> | null }>;
  wished: Array<{ forResource: { class: string; slug: string }; state: Record<string, any> | null }>;
};
```

**why separate file wins:**
- plan.ts is a CLI handler, not a type definition file
- domain.objects/ is where domain types live
- pattern consistency > line count optimization

**verdict:** keep the separate file. the pattern is worth more than the 20 lines saved.

---

## summary

**abstractions in blueprint:** 2 (DeclastructSnapshot, DeclastructSnapshotEntry)
**abstractions questioned:** 3 (domain object, entry interface, hypothetical helper)
**abstractions removed:** 0
**abstractions NOT added:** 4

**why the abstractions are justified:**

1. **DeclastructSnapshot** — follows extant pattern (DeclastructPlan), used in multiple files
2. **DeclastructSnapshotEntry** — DRY extraction, not premature (used twice in same interface)

**principle applied:**

abstractions should reduce repetition or improve clarity. both abstractions do. a helper function would not — it would just relocate two lines without benefit.
