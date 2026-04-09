# self-review r3: has-questioned-deletables

try hard to delete before you optimize.

---

## method

for each feature and component, i asked:
1. does it trace to vision/criteria?
2. if i deleted it and had to add it back, would i?
3. what is the minimal version?

---

## features questioned

### 1. wished[] array — HARD QUESTION

**first instinct:** delete it. the wish file already has the declared state.

**i tried to delete it:**
- user runs `declastruct plan --wish resources.ts --snap snapshot.json`
- snapshot would have only `remote[]`
- user wants to compare remote vs wished
- user would have to... open resources.ts and read TypeScript

**why it doesn't work:**
- resources.ts is TypeScript, not JSON
- the snapshot shows what declastruct UNDERSTOOD after it processed the wish
- serialize() stamps `_dobj` and normalizes the shape
- the wish file might have `new DemoResource({ name: 'foo' })` but the snapshot shows the fully constructed domain object

**verdict:** cannot delete. the wish file is not the same as serialized wished state.

### 2. forResource wrapper — QUESTIONED

**first instinct:** simplify to just `slug`. the class is redundant — slug contains class name.

**i tried to simplify:**
- entry shape becomes `{ slug: string; state: ... }`
- slug is `DeclaredCloudflareDomainZone.example.com.abc123`
- class is extractable from slug prefix

**why i kept the wrapper:**
- plan.json uses `forResource: { class, slug }`
- consistency with plan.json matters more than bytes saved
- users familiar with plan.json expect this shape
- the extraction logic (`slug.split('.')[0]`) is decode-friction we shouldn't impose

**verdict:** keep the wrapper. consistency > compactness.

### 3. DeclastructSnapshot domain object — QUESTIONED

**first instinct:** use a plain TypeScript type. we don't need DomainEntity features.

**i tried to simplify:**
- define `type DeclastructSnapshot = { observedAt: IsoTimestamp; remote: ...; wished: ... }` inline
- put it in plan.ts where it's used

**why i kept the domain object:**
- extant pattern: DeclastructPlan is a domain object in domain.objects/
- new domain concepts get their own files
- rule.require.domain-driven-design prescribes explicit domain objects
- if we need to add validation later, the structure is ready

**verdict:** keep the domain object. the pattern is more important than the 10 lines saved.

### 4. 8 test cases — QUESTIONED

**first instinct:** merge related tests.
- "snapshot created" + "observedAt present" could be one test
- "remote[] present" + "_dobj stamp" could be one test
- "forResource has class" + "forResource has slug" could be one test

**why i kept them separate:**
- each test verifies one behavior
- if "snapshot created + observedAt" test fails, which part failed?
- separate tests give precise failure signals
- rule.require.given-when-then: one then per behavior

**verdict:** keep 8 tests. precision > compactness.

---

## features that CANNOT be deleted

| feature | why cannot delete |
|---------|------------------|
| --snap flag | the entire feature interface |
| observedAt | audit usecase requires temporal anchor |
| remote[] | primary payload — the whole point |
| state with _dobj | enables round-trip reconstruction |

these are non-negotiable. to delete any would eliminate the feature.

---

## components that CANNOT be simplified further

| component | current simplicity | simpler version? |
|-----------|-------------------|-----------------|
| invoke.ts changes | one `.option()` call | no |
| plan.ts changes | one conditional write | no |
| planChanges.ts changes | collect in extant loop | no — data exists here |

---

## deleted items

**none.** but i genuinely tried:

1. tried to delete wished[] — doesn't work (serialized !== source)
2. tried to simplify forResource — breaks consistency with plan.json
3. tried to inline DeclastructSnapshot — violates extant pattern
4. tried to merge test cases — loses failure precision

---

## summary

**questioned hard:** 4 items
**deleted:** 0
**kept with justification:** 4

**why zero deletions is correct:**

the vision is tight. one flag, one output, two arrays. there is no fat to trim.

the components are minimal implementations of required features. each `.ts` file change is one addition. each test case verifies one behavior.

the temptation to over-design would appear as:
- multiple output formats (JSON, YAML) — not in blueprint
- configurable fields (--include, --exclude) — not in blueprint
- verbose mode (--verbose) — not in blueprint
- separate commands (declastruct observe) — not in blueprint

none of these appear. the blueprint implements exactly the vision, with the simplest possible components.
