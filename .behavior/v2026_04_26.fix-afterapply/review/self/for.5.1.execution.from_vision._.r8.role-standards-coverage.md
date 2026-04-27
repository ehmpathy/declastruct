# self-review r8: role-standards-coverage

🍵 tea first.

---

## the review question

are there patterns that should be present but are absent? did the junior forget best practices?

---

## step 1: enumerate ALL rule categories

i will check every category, not just the obvious ones:

| category | briefs path | check |
|----------|-------------|-------|
| error handle | `pitofsuccess.errors/` | failfast, failloud |
| procedures | `evolvable.procedures/` | arrow-only, input-context, hooks |
| narrative | `readable.narrative/` | no else, early returns |
| comments | `readable.comments/` | what-why headers |
| domain objects | `evolvable.domain.objects/` | immutable refs |
| repo structure | `evolvable.repo.structure/` | directional deps |
| lang terms | `lang.terms/` | treestruct, ubiqlang |
| lang tones | `lang.tones/` | lowercase, nature emojis |
| tests | `code.test/` | given-when-then, coverage |

---

## step 2: deliberate coverage check

### category: error handle

**rule.require.failfast** - should there be guard clauses?

examined `asApplyArgsFromArgv`:
```ts
const asApplyArgsFromArgv = (input: {
  argv: string[];
  planFilePath: string;
}): string[] => {
```

**question:** should we guard against empty argv?

**analysis:**
- `argv` is `process.argv`, which is never empty (always has at least node path)
- `planFilePath` comes from `plan.ts` after validation
- both are internal inputs, not user boundaries
- guard clauses belong at boundaries, not in internal transformers

**verdict:** ✅ guards not needed. internal function with trusted inputs.

---

### category: procedures

**rule.require.hook-wrapper-pattern** - should there be hook wrappers?

**analysis:**
- hook wrappers are for procedures with cross-cut concerns
- `asApplyCommandFromArgv` has no log calls, no metrics, no retries
- it's a pure transformer: input → output
- hook wrappers would add complexity without benefit

**verdict:** ✅ hooks not needed. pure transformer.

---

### category: domain objects

**rule.require.immutable-refs** - should inputs use immutable patterns?

**analysis:**
- inputs are `argv: string[]` and `planFilePath: string`
- we spread `argv` immediately in `plan.ts`: `const argvOriginal = [...process.argv]`
- the transformer receives a copy, not a reference
- `planFilePath` is a string (immutable by nature)

**verdict:** ✅ immutability preserved. inputs are copies or primitives.

---

### category: tests

**rule.require.test-coverage-by-grain** - is test type appropriate for grain?

**analysis:**
- `asApplyCommandFromArgv` is a **transformer** (pure computation)
- rule says transformers get **unit tests**
- we have 10 unit tests in `.test.ts`
- no integration tests needed for transformers

**verdict:** ✅ test type matches grain.

**rule.require.snapshots** - should there be snapshot tests?

**analysis:**
- snapshots are for "output artifacts" like CLI output, codegen, API responses
- this transformer returns a string (not an artifact file)
- the string is sent to console (ephemeral)
- explicit assertions verify the string content

**verdict:** ✅ snapshots not needed. explicit assertions are better here.

---

### category: structure

**rule.require.directional-deps** - do imports flow correctly?

**analysis:**
- `plan.ts` imports from `asApplyCommandFromArgv.ts`
- both are in `contract/cli/`
- same-level imports are allowed
- no upward imports from lower layers

**verdict:** ✅ directional deps respected.

**rule.forbid.barrel-exports** - are there barrel exports?

**analysis:**
- `asApplyCommandFromArgv.ts` exports one function
- no `index.ts` barrel created
- direct import used in `plan.ts`

**verdict:** ✅ no barrel exports.

---

### category: lang terms

**rule.require.treestruct** - do names follow tree structure?

| name | expected pattern | actual | match |
|------|-----------------|--------|-------|
| `asApplyCommandFromArgv` | `as*` for transformer | `as*` | ✅ |
| `getInvocationPrefix` | `get*` for retrieval | `get*` | ✅ |
| `asApplyArgsFromArgv` | `as*` for transformer | `as*` | ✅ |

**verdict:** ✅ names follow treestruct.

---

## step 3: check for omitted practices

| practice | should be present? | is present? |
|----------|-------------------|-------------|
| error guards | no (internal) | n/a |
| input validation | no (internal) | n/a |
| unit tests | yes (transformer) | yes (10 tests) |
| integration tests | no (not I/O) | n/a |
| snapshot tests | no (not artifact) | n/a |
| what-why comments | yes | yes (all 3 functions) |
| hook wrapper | no (pure) | n/a |
| type annotations | yes | yes (all explicit) |

---

## issue found: none

no absent patterns. all appropriate standards present.

---

## lesson from r7 → r8

r7 checked categories but didn't trace specific rules line-by-line. r8 traces each rule to a specific decision. the difference is precision.

---

## conclusion

**full standards coverage achieved.**

every relevant rule category checked:
- error handle: not needed (internal transformer) ✅
- hook wrapper: not needed (pure function) ✅
- immutable refs: preserved via spread ✅
- test type: unit tests match transformer grain ✅
- snapshots: not needed (not artifact) ✅
- directional deps: same-level imports ✅
- treestruct names: as*, get* prefixes ✅

no omitted practices. no forgotten standards.
