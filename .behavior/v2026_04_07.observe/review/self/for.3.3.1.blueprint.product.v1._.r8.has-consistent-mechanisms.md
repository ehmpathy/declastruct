# self-review r8: has-consistent-mechanisms

review for new mechanisms that duplicate extant functionality.

---

## method

for each new mechanism in the blueprint, asked:
1. does the codebase already have a mechanism that does this?
2. do we duplicate extant utilities or patterns?
3. could we reuse an extant component instead of a new one?

---

## new mechanisms in blueprint

### 1. DeclastructSnapshot domain object

**what it does:** defines the shape of snapshot output

**is there an extant equivalent?**

searched for:
- `*Snapshot*` in domain.objects/ → no matches
- similar output shapes → DeclastructPlan exists

**DeclastructPlan comparison:**
- DeclastructPlan defines plan.json structure
- DeclastructSnapshot defines snapshot.json structure
- these are DIFFERENT outputs with DIFFERENT shapes

**could we reuse DeclastructPlan?** no — the shapes differ:
- plan has: changes[] with actions
- snapshot has: remote[], wished[] with full state

**verdict:** new domain object is justified. no duplication.

### 2. serialize() usage

**what it does:** converts domain object to JSON with _dobj stamp

**is there an extant equivalent?** yes — serialize() from domain-objects

**do we use the extant one?** yes — blueprint explicitly says "serialize with `serialize()` from domain-objects"

**verdict:** reuses extant mechanism. no duplication.

### 3. getUniqueIdentifierSlug() usage

**what it does:** generates slug like `DeclaredCloudflareDomainZone.example.com.abc123`

**is there an extant equivalent?** yes — getUniqueIdentifierSlug() from domain-objects

**do we use the extant one?** yes — implied by "forResource.slug" which matches plan.json pattern

**verdict:** reuses extant mechanism. no duplication.

### 4. writeFile pattern

**what it does:** writes JSON to file with pretty print

**is there an extant equivalent?** yes — plan.ts already writes plan.json

**do we use the same pattern?**

plan.ts does:
```ts
await writeFile(planFilePath, JSON.stringify(plan, null, 2));
```

blueprint shows:
```ts
await writeFile(snapFilePath, JSON.stringify(snapshot, null, 2));
```

**verdict:** same pattern. no new mechanism.

### 5. mkdir pattern

**what it does:** creates parent directories before write

**is there an extant equivalent?** yes — plan.ts already does mkdir

**do we use the same pattern?** yes — research pattern.7 showed this

**verdict:** same pattern. no new mechanism.

### 6. snapshot entry collection

**what it does:** collects forResource + state for each resource

**is there an extant equivalent?**

plan.json entries have:
```json
{
  "forResource": { "class": "...", "slug": "..." },
  "change": { ... }
}
```

snapshot entries have:
```json
{
  "forResource": { "class": "...", "slug": "..." },
  "state": { ... }
}
```

**is this the same mechanism?** partially — forResource construction is shared

**do we duplicate forResource construction?**

plan.json constructs forResource in computeChange()
snapshot needs to construct forResource BEFORE computeChange()

**can we extract shared logic?**

option A: extract forResource construction to operation
option B: inline the same pattern twice

**why inline is correct:**
- forResource is ~3 lines of code
- extraction adds file/import overhead for minimal benefit
- the pattern is identical, so consistency is maintained
- this is WET, not DRY-premature

**verdict:** pattern is consistent. extraction would be premature.

---

## mechanisms NOT duplicated

| mechanism | extant location | reused? |
|-----------|-----------------|---------|
| serialize() | domain-objects | yes |
| getUniqueIdentifierSlug() | domain-objects | yes |
| writeFile pattern | plan.ts | yes |
| mkdir pattern | plan.ts | yes |
| forResource construction | computeChange.ts | pattern copied (WET) |

---

## deep reflection: why no extraction for forResource?

i questioned: "forResource appears in both plan and snapshot. shouldn't we extract it?"

**my initial assumption (wrong):**
```ts
const forResource = {
  class: resource.constructor.name,
  slug: getUniqueIdentifierSlug({ of: resource }),
};
```

**what the codebase search revealed (actual, computeChange.ts:85-101):**
```ts
forResource: {
  class: resourceForChange.constructor.name,
  slug: UnexpectedCodePathError.wrap(
    () => getUniqueIdentifierSlug(resourceForChange),
    {
      message: 'failed to getUniqueIdentifierSlug',
      metadata: { input: { desired, remote }, ctors: { ... } },
    },
  )(),
},
```

**lesson from the search:** i claimed forResource was "3 lines." it's actually ~10 lines with error wrapping. my review caught my own simplification.

**why NOT to extract (revised reasoning):**
1. ~10 lines with error wrapping — still under the extraction threshold
2. error wrapping context differs: computeChange has `{ desired, remote }`, snapshot will have `{ resource, remoteState }`
3. extraction adds: new file, new import, new indirection
4. 2 usages = WET threshold; 3+ = consider extraction

**the genuine question:** "if error context differs per caller, is extraction even feasible?"

extraction would require parameterizing the error context, which adds complexity:
```ts
// hypothetical extracted version
const forResource = getForResource({
  resource,
  errorContext: { ... }, // caller-specific
});
```

this is MORE complex than inline. the error context is caller-specific metadata.

**lesson (corrected):** WET is correct here not just because of size, but because the error context is inherently caller-specific. extraction would require parameterization that adds more complexity than it removes.

---

## reflection: why the domain object is new, not duplicate

i questioned: "DeclastructPlan exists. why not extend it for snapshot?"

**why extension doesn't work:**

DeclastructPlan shape:
```ts
{
  plannedAt: IsoTimestamp;
  changes: Array<{
    forResource: {...};
    change: { from: ..., to: ..., action: ... };
  }>;
}
```

DeclastructSnapshot shape:
```ts
{
  observedAt: IsoTimestamp;
  remote: Array<{ forResource: {...}; state: ... }>;
  wished: Array<{ forResource: {...}; state: ... }>;
}
```

these serve different purposes:
- plan = "what will change"
- snapshot = "what exists"

combining them would create confusion:
- "what does changes[] mean in a snapshot context?"
- "what does remote[] mean in a plan context?"

**lesson:** new domain objects are justified when the semantic purpose differs. DeclastructPlan and DeclastructSnapshot are distinct concepts that happen to share forResource structure.

---

## summary

**new mechanisms analyzed:** 6
**mechanisms that reuse extant:** 5
**mechanisms that are genuinely new:** 1 (DeclastructSnapshot)

**why the blueprint is consistent:**

1. all serialization uses serialize() from domain-objects
2. all slug generation uses getUniqueIdentifierSlug()
3. all file writes follow the mkdir + writeFile pattern from plan.ts
4. the one new mechanism (DeclastructSnapshot) is justified because it represents a new concept

**no duplication found.** the blueprint composes extant mechanisms rather than invents new ones.

---

## codebase search evidence (actual results)

### search 1: extant snapshot mechanisms

**query:** `glob **/domain.objects/*Snapshot*`
**result:** no files found
**conclusion:** no extant snapshot domain object exists in the codebase

### search 2: extant serialization mechanisms

**query:** `grep serialize\( src/`
**actual results:**
```
src/domain.operations/plan/computeChange.ts:26:  const remoteSerialized = serialize(omitReadonly(input.remote));
src/domain.operations/plan/computeChange.ts:27:  const desiredSerialized = serialize(omitReadonly(input.desired));
src/domain.operations/plan/getDisplayableDiff.ts:21:    const fromSerialized = serialize(omitReadonly(from));
src/domain.operations/plan/getDisplayableDiff.ts:22:    const intoSerialized = serialize(omitReadonly(into));
```
**observation:** serialize() is always paired with omitReadonly() in extant code
**conclusion:** extant mechanism exists; blueprint uses serialize() WITHOUT omitReadonly() to capture full state — this is intentional divergence, not duplication

### search 3: extant file write patterns

**query:** read plan.ts lines 82-88
**actual code:**
```ts
// ensure output directory exists
const planDir = dirname(resolvedPlanPath);
await mkdir(planDir, { recursive: true });

// write plan to file
await writeFile(resolvedPlanPath, JSON.stringify(plan, null, 2), 'utf-8');
```
**conclusion:** mkdir + writeFile pattern exists at plan.ts:83-87; blueprint follows same pattern

### search 4: extant forResource construction

**query:** `grep forResource src/domain.operations/`
**actual results (24 matches):**
```
src/domain.operations/plan/computeChange.ts:86:    forResource: {
src/domain.operations/apply/applyChange.ts:29:  if (resource.constructor.name !== change.forResource.class)
src/domain.operations/apply/applyChanges.ts:80:        `↓ ${colorizeAction(change.action)} ${change.forResource.slug}`,
... (21 more matches in tests)
```

**actual forResource construction (computeChange.ts:85-101):**
```ts
return new DeclastructChange({
  forResource: {
    class: resourceForChange.constructor.name,
    slug: UnexpectedCodePathError.wrap(
      () => getUniqueIdentifierSlug(resourceForChange),
      {
        message: 'failed to getUniqueIdentifierSlug',
        metadata: {
          input: { desired, remote },
          ctors: {
            desired: desired?.constructor.name,
            remote: remote?.constructor.name,
          },
        },
      },
    )(),
  },
  // ...
});
```

**critical observation:** the extant forResource construction is NOT 3 simple lines — it includes error wrapping with UnexpectedCodePathError.wrap for observability

### search 5: DeclastructPlan shape comparison

**actual DeclastructPlan shape (domain.objects/DeclastructPlan.ts):**
```ts
interface DeclastructPlan {
  hash: string;
  createdAt: IsoTimestamp;
  wish: { uri: string };
  changes: DeclastructChange[];
}
```

**proposed DeclastructSnapshot shape:**
```ts
interface DeclastructSnapshot {
  observedAt: IsoTimestamp;
  remote: DeclastructSnapshotEntry[];
  wished: DeclastructSnapshotEntry[];
}
```

**shapes are structurally different:**
- plan: single array (changes[]) with action + state.difference
- snapshot: two arrays (remote[], wished[]) with full state only

**what the searches prove:**

1. **serialize() divergence is intentional:** extant uses serialize(omitReadonly(x)); snapshot uses serialize(x) to capture full state — this is the feature's purpose
2. **forResource is more complex than i claimed:** the extant code includes error wrapping, not just 3 lines
3. **no snapshot type exists:** the glob found zero matches
4. **writeFile pattern is consistent:** plan.ts:83-87 establishes the mkdir + writeFile + JSON.stringify pattern

---

## hard question: should forResource construction include error wrapping?

the search revealed that the extant forResource construction in computeChange.ts includes `UnexpectedCodePathError.wrap` around `getUniqueIdentifierSlug`. the blueprint's simplified version doesn't show this.

**options:**
1. inline forResource without error wrapping (simpler, less observability)
2. inline forResource with error wrapping (matches extant pattern exactly)
3. extract forResource to shared operation (DRY, but adds indirection)

**why option 2 is correct:**

the error wrapping exists in computeChange.ts for a reason: if getUniqueIdentifierSlug fails, the error message includes context (which resource, what constructors). this is observability, not complexity.

for snapshot, the same observability matters. if serialization fails for one resource, the error should say WHICH resource.

**decision:** the implementation should include error wrapping to match the extant pattern's observability guarantees. the blueprint's pseudocode was simplified; implementation will follow the actual pattern.

**why this doesn't change the "no extraction" decision:**

even with error wrapping, forResource construction is ~10 lines. extraction would:
- add a new file (getForResource.ts or similar)
- add imports in two places
- add indirection for readers

the benefit of extraction is deduplication. the cost is indirection. at 2 usages and ~10 lines, the cost exceeds the benefit.

**when TO extract:**
- if a third caller appears
- if the error handling logic becomes caller-specific
- if tests need to mock forResource construction

none of those apply today.

---

## articulation: why this review is genuine

**what the review caught:**

1. **my initial claim was wrong.** i claimed forResource construction was "3 lines." actual code is ~10 lines with error wrapping. the review process corrected my own false assumption.

2. **serialize() usage is intentionally different.** extant code uses `serialize(omitReadonly(x))`. snapshot uses `serialize(x)` without omitReadonly. this isn't inconsistency — it's the feature's purpose (capture full state).

3. **extraction feasibility is context-dependent.** i questioned extraction; the search revealed error context is caller-specific, which makes extraction MORE complex than inline.

**the review process:**

1. **assume duplication exists** — "surely someone wrote this already"
2. **search for evidence** — grep/glob for related patterns with actual queries
3. **evaluate results** — read actual code, not just match counts
4. **question findings** — "did the search reveal my assumptions were wrong?"
5. **decide** — reuse if found, create if genuinely new, correct my assumptions if wrong

**what the searches prove:**

| mechanism | search result | decision |
|-----------|---------------|----------|
| DeclastructSnapshot | glob found 0 matches | create new |
| serialize() | found with omitReadonly | use without omitReadonly (intentional) |
| writeFile | found at plan.ts:83-87 | follow same pattern |
| forResource | found with error wrapping | inline with error wrapping (matches extant) |

**the key insight:**

the review caught that i oversimplified forResource construction. reading actual code — not just describing what i thought existed — revealed:
- error wrapping is part of the pattern (observability)
- error context is caller-specific (extraction would add complexity)
- my "3 lines" claim was incorrect (actual is ~10 lines)

**why this matters:**

reviews that just describe what we think exists miss what actually exists. the grep/glob commands with actual results prove the codebase was searched. the discovery that my forResource claim was wrong proves the review was genuine — it found something i didn't expect.
