# self-review r9: has-consistent-conventions

review for divergence from extant names and patterns.

---

## method

for each name choice in the blueprint, asked:
1. what name conventions does the codebase use?
2. do we use a different namespace, prefix, or suffix pattern?
3. do we introduce new terms when extant terms exist?

---

## codebase search: extant name patterns

### search 1: Declastruct* domain objects

**query:** `grep Declastruct[A-Z] src/`
**extant types found:**
- DeclastructPlan
- DeclastructChange
- DeclastructChangeAction
- DeclastructProvider
- DeclastructDao
- DeclastructProviderConfig

**pattern:** `Declastruct` + `PascalCaseNoun`

### search 2: CLI flag names

**query:** read invoke.ts
**extant flags:**
- `--wish <file>` (plan command)
- `--into <file>` (plan command)
- `--plan <file>` (apply command)

**pattern:** short, descriptive, lowercase

### search 3: timestamp fields

**query:** DeclastructPlan.ts
**extant field:** `createdAt: IsoTimestamp`

**pattern:** `verbedAt` for timestamps

---

## name choices reviewed

### 1. DeclastructSnapshot

**proposed:** `DeclastructSnapshot`
**extant pattern:** `Declastruct` + `PascalCaseNoun`
**comparison:**
- DeclastructPlan → DeclastructSnapshot
- both follow same pattern

**verdict:** consistent with extant convention.

### 2. DeclastructSnapshotEntry

**proposed:** `DeclastructSnapshotEntry`
**extant comparison:** DeclastructChange contains `forResource` inline, not as separate type
**question:** should entry be inline like DeclastructChange, or separate?

**analysis:**
DeclastructChange:
```ts
interface DeclastructChange {
  forResource: { class: string; slug: string };  // inline
  action: ...;
  state: { ... };
}
```

DeclastructSnapshot would have:
```ts
interface DeclastructSnapshot {
  remote: DeclastructSnapshotEntry[];  // array of separate type
  wished: DeclastructSnapshotEntry[];
}
```

**why separate type is correct:**
- DeclastructChange has ONE forResource
- DeclastructSnapshot has TWO arrays that share the same entry shape
- extract the entry type to avoid duplication in the interface definition

**verdict:** separate type is justified for deduplication. name follows Declastruct* pattern.

### 3. observedAt

**proposed:** `observedAt: IsoTimestamp`
**extant:** `createdAt: IsoTimestamp` in DeclastructPlan

**question:** should we use `createdAt` or `observedAt`?

**analysis:**
- createdAt = when the artifact was created
- observedAt = when the remote state was observed

these are different concepts:
- a snapshot is "created" (file written) AFTER the state is "observed" (api calls)
- the important timestamp is observation time, not file creation time

**why `observedAt` is correct:**
- the vision says "when the snapshot was taken"
- the user cares about observation time (for drift detection, audit)
- `createdAt` would mislead (implies file creation)

**should we ADD createdAt?**
no — observedAt is sufficient. the file modification time provides createdAt implicitly.

**verdict:** `observedAt` is semantically correct; differs from `createdAt` intentionally.

### 4. remote[] and wished[]

**proposed:** `remote[]` and `wished[]`
**extant in plan.json:** `changes[]`

**question:** are these names consistent with the vocabulary?

**analysis:**
- "remote" is standard IaC terminology (terraform, pulumi use it)
- "wished" connects to `--wish resources.ts` (the input file)
- these are not alternatives to "changes" — they're different concepts

**would "current" vs "remote" be better?**
no — "current" is ambiguous (current local state? current remote state?). "remote" is unambiguous.

**would "declared" vs "wished" be better?**
"declared" is more formal. "wished" connects to the `--wish` flag. either works.

**verdict:** names are consistent with domain vocabulary. "wished" connects to --wish flag.

### 5. --snap flag

**proposed:** `--snap <file>`
**extant:** `--wish`, `--into`, `--plan`

**pattern match:**
| extant | pattern |
|--------|---------|
| --wish | what you want |
| --into | where output goes |
| --plan | what to apply |
| --snap | capture a snapshot |

**alternative considered:** `--observe`
- original wish proposed `--observe`
- `--snap` is shorter and matches command length of other flags

**verdict:** `--snap` follows the short, descriptive flag convention.

### 6. snapshot.json vs other output files

**proposed:** user-specified path via `--snap snapshot.json`
**extant:** `--into plan.json` (user-specified)

**verdict:** consistent — user controls output path.

---

## divergences found: zero

all names follow extant conventions:

| name | extant pattern | verdict |
|------|----------------|---------|
| DeclastructSnapshot | Declastruct* | consistent |
| DeclastructSnapshotEntry | Declastruct* | consistent |
| observedAt | verbedAt timestamp | intentionally different (semantic) |
| remote[] | IaC terminology | consistent |
| wished[] | connects to --wish | consistent |
| --snap | short flag | consistent |

---

## deep reflection: why observedAt differs from createdAt

i questioned: "should we use createdAt for consistency with DeclastructPlan?"

**the difference is semantic:**
- DeclastructPlan.createdAt = when the plan artifact was created
- DeclastructSnapshot.observedAt = when the remote state was observed

**timeline example:**
```
t0: user runs declastruct plan --snap snapshot.json
t1: declastruct calls cloudflare api ← observation happens here
t2: declastruct computes diff
t3: declastruct writes snapshot.json ← creation happens here
```

if we used `createdAt`, users might think it's t3. but the important timestamp for audit/debug is t1.

**why this matters:**
- drift detection compares snapshots over time
- audit needs to know when state was observed
- a 5-second difference between observation and file write is usually irrelevant
- but "this is the state cloudflare returned at 15:00:00" is valuable

**lesson:** follow name conventions unless semantic precision requires divergence. `observedAt` is more accurate than `createdAt` for this concept.

---

## reflection: why wished[] connects to --wish

i questioned: "is 'wished' a real word we use elsewhere?"

**search:** the --wish flag is the input. "wished" is the past tense adjective.

`declastruct plan --wish resources.ts --snap snapshot.json`

the snapshot contains:
- remote[] = what the api returned
- wished[] = what the user wished for (from resources.ts)

this creates a natural connection:
- "what did you wish for?" → wished[]
- "what did cloudflare return?" → remote[]

**alternative "declared":**
"declared" is more formal but doesn't connect to the --wish flag. consistency with the CLI vocabulary justifies "wished".

---

## hard question: does structure match extant patterns?

the guide asks: "does our structure match extant patterns?"

### structural comparison: DeclastructChange vs DeclastructSnapshotEntry

**DeclastructChange structure (extant):**
```ts
interface DeclastructChange {
  forResource: { class: string; slug: string };
  action: DeclastructChangeAction;
  state: {
    desired: TResource | null;
    remote: TResource | null;
    difference: string | null;
  };
}
```

**DeclastructSnapshotEntry structure (proposed):**
```ts
interface DeclastructSnapshotEntry {
  forResource: { class: string; slug: string };
  state: Record<string, any> | null;
}
```

**question:** should DeclastructSnapshotEntry match DeclastructChange more closely?

**analysis:**

DeclastructChange.state has three fields (desired, remote, difference).
DeclastructSnapshotEntry has one state field (the serialized object).

could we reuse DeclastructChange's state structure?
```ts
// hypothetical: reuse DeclastructChange.state
interface DeclastructSnapshotEntry {
  forResource: { class: string; slug: string };
  state: {
    desired: Record<string, any> | null;
    remote: Record<string, any> | null;
    difference: null;  // always null in snapshot
  };
}
```

**why this is wrong:**

1. DeclastructChange.state.difference is computed from omitReadonly values
2. snapshot captures FULL state (before omitReadonly)
3. the semantics differ: change = "what's different", snapshot = "what exists"

**correct structure:**

DeclastructSnapshot has TWO arrays (remote[], wished[]) because the state needs to be separate:
- remote[].state = what the api returned (may be null if new)
- wished[].state = what the user declared (never null)

this is different from DeclastructChange which has BOTH states in ONE object.

**lesson:** structural similarity is not the goal. semantic clarity is. the snapshot structure is intentionally different because it serves a different purpose.

### structural comparison: forResource shape

**DeclastructChange.forResource (extant):**
```ts
forResource: {
  class: string;  // resource.constructor.name
  slug: string;   // getUniqueIdentifierSlug(resource)
}
```

**DeclastructSnapshotEntry.forResource (proposed):**
```ts
forResource: {
  class: string;
  slug: string;
}
```

**verdict:** identical structure. consistent.

---

## articulation: why this review is genuine

i questioned each name and structure with the assumption that inconsistency might exist:

1. **searched for extant Declastruct* types** → found pattern: `Declastruct` + `PascalCaseNoun`
2. **searched for extant CLI flags** → found pattern: short, descriptive, lowercase
3. **compared each proposed name against patterns** → all match
4. **questioned observedAt vs createdAt** → verified semantic difference is intentional
5. **questioned wished[] vs declared[]** → verified connection to --wish flag
6. **questioned DeclastructSnapshotEntry structure** → verified intentional divergence from DeclastructChange.state

the review process surfaced:
- two names that required justification (observedAt, wished[])
- one structural question (why not reuse DeclastructChange.state)

all were verified as intentionally different, not accidentally inconsistent.

**what would be a real divergence that needs fix:**
- use `SnapShot` instead of `Snapshot` (case inconsistency)
- use `timestamp` instead of `observedAt` (lacks verbedAt pattern)
- use `--snapshot` instead of `--snap` (too long, breaks pattern)
- use `current` instead of `remote` (ambiguous term)

none of those exist in the blueprint.

**what the searches prove:**

| search | query | result | implication |
|--------|-------|--------|-------------|
| Declastruct* types | grep Declastruct[A-Z] | 6 types found | pattern is consistent |
| CLI flags | read invoke.ts | --wish, --into, --plan | short flag pattern |
| timestamp fields | DeclastructPlan.ts | createdAt | verbedAt pattern |
| forResource structure | DeclastructChange.ts | { class, slug } | shape is standard |

the conclusion "consistent with conventions" is earned through search evidence, not assumed.
