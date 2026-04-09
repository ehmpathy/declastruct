# self-review r7: has-pruned-dependencies

minimize external dependencies. question each import.

---

## method

for each dependency the blueprint relies on, asked:
1. is this dependency already in the codebase?
2. can we achieve the same with standard library?
3. does the dependency do one job well or is it bloat?

---

## dependencies analyzed

### 1. serialize() from domain-objects

**what it does:** converts domain object instance to JSON-safe shape with `_dobj` stamp.

**already in codebase?** yes — domain-objects is a core dependency of declastruct.

**can we achieve with standard library?** partially — JSON.stringify works, but we'd lose:
- `_dobj` class identification
- consistent shape across domain objects
- integration with domain-objects ecosystem

**why we keep it:**
- already used throughout codebase (plan.json uses it)
- stamps `_dobj` which is part of our contract
- no new dependency, just use of extant one

**verdict:** no new dependency. use extant serialize().

### 2. getUniqueIdentifierSlug() from domain-objects

**what it does:** generates slug like `DeclaredCloudflareDomainZone.example.com.abc123`.

**already in codebase?** yes — used in plan.json output.

**can we achieve with standard library?** yes, but inconsistently:
- we'd duplicate the slug format logic
- risk of drift between plan.json slugs and snapshot slugs

**why we keep it:**
- already used for plan.json
- ensures slug format consistency
- no new dependency

**verdict:** no new dependency. use extant function.

### 3. writeFile from fs/promises

**what it does:** writes content to file.

**already in codebase?** yes — plan.ts already uses it for plan.json.

**can we achieve with standard library?** it IS standard library.

**verdict:** standard library, already used. no change.

### 4. mkdir from fs/promises

**what it does:** creates directories.

**already in codebase?** yes — plan.ts already uses it.

**verdict:** standard library, already used. no change.

### 5. IsoTimestamp from type-fns or similar

**what it does:** type for ISO timestamp strings.

**already in codebase?** yes — type-fns is extant dependency.

**can we achieve without?** yes — use `string`, but we lose type precision.

**why we keep it:**
- type precision helps catch errors
- already used in codebase
- no runtime cost, just type annotation

**verdict:** no new dependency. use extant type.

---

## dependencies NOT introduced

| potential dep | why not added |
|---------------|---------------|
| date-fns | `new Date().toJSON()` is enough |
| lodash | no complex transforms needed |
| yup/zod | no runtime validation needed for snapshot |
| uuid | no new IDs generated |

---

## hard question: do we need a snapshot library?

i questioned whether snapshot generation should use a dedicated library:

**options:**
- use a serialization library (superjson, devalue)
- use domain-objects serialize() (current plan)

**why serialize() is correct:**
- it's what plan.json uses
- it stamps `_dobj` consistently
- it handles nested domain objects
- no new dependency

**lesson:** the best dependency is one already in your dependency tree. we reuse domain-objects methods that declastruct already depends on.

---

## summary

**dependencies used:** 5
**new dependencies added:** 0
**dependencies from standard library:** 2 (fs/promises writeFile, mkdir)
**dependencies already in codebase:** 3 (serialize, getUniqueIdentifierSlug, IsoTimestamp)

**why zero new dependencies:**

the snapshot feature uses the same serialization and file-write patterns as plan.json. we do not invent new infrastructure — we reuse extant infrastructure in a new context.

**principle applied:**

new features should compose from extant blocks. if you need a new dependency for a feature this small, question whether you understand the extant codebase.
