# self-review r7: role-standards-coverage

🍵 tea first.

---

## the review question

are all relevant mechanic standards applied? are there patterns that should be present but are absent?

---

## step 1: enumerate rule categories to check for coverage

| category | what should be present |
|----------|------------------------|
| error handle | failfast guards, failloud errors |
| validation | input validation at boundaries |
| tests | unit tests, test coverage |
| types | explicit types, no `any` |
| comments | what-why headers, code paragraph titles |
| structure | single responsibility per file |

---

## step 2: coverage check per file

### file: `asApplyCommandFromArgv.ts`

#### error handle coverage

**question:** does this function need error handles?

**analysis:**
- input: `argv` array, `planFilePath` string
- both are required by TypeScript types
- function is a pure transformer - no I/O, no network, no file system
- no operations that can throw (array iteration, string operations)

**verdict:** ✅ no error handles needed. pure transformers don't throw.

#### validation coverage

**question:** does this function need input validation?

**analysis:**
- `argv` comes from `process.argv` (always an array)
- `planFilePath` comes from caller (`plan.ts`)
- both are validated upstream:
  - `argv` is captured from runtime
  - `planFilePath` is resolved and validated in `plan.ts`

**verdict:** ✅ validation not needed. inputs are trusted internal values.

#### type coverage

**analysis:**
- `input: { argv: string[]; planFilePath: string }` - explicit types
- return type `: string` - explicit
- no `any`, no type assertions
- all intermediate values have inferred types

**verdict:** ✅ types complete.

#### comment coverage

**analysis:**
- main function: has `.what` and `.why` ✅
- `getInvocationPrefix`: has `.what` and `.why` ✅
- `asApplyArgsFromArgv`: has `.what` and `.why` ✅
- code paragraphs: inline comments present ✅

**verdict:** ✅ comments complete.

---

### file: `asApplyCommandFromArgv.test.ts`

#### test coverage

**analysis:**
- 10 test cases that cover:
  - 4 invocation prefixes (npx, pnpm, yarn, bare)
  - flag removal (--wish, --into, --snap)
  - passthrough removal
  - flag preservation
  - --flag=value syntax
  - relative paths

**verdict:** ✅ test coverage complete.

---

### file: `plan.ts` (changes only)

#### error handle coverage

**question:** do the changes need error handles?

**analysis:**
- `argvOriginal = [...process.argv]` - spread can't fail
- `asApplyCommandFromArgv({...})` - pure function, doesn't throw
- `log.info(...)` - console output, doesn't throw

**verdict:** ✅ no error handles needed for these changes.

---

## issue found: none

no absent patterns. all relevant standards applied.

---

## non-issues confirmed

### no snapshot tests

**question:** should there be snapshot tests?

**analysis:**
- rule.require.snapshots applies to "output artifacts"
- this feature's output is a log line, not a structured artifact
- the apply command string is verified by explicit assertions in unit tests
- snapshots would add noise without value

**verdict:** ✅ snapshot tests not needed for this feature.

### no integration tests for new code

**question:** should there be integration tests?

**analysis:**
- `asApplyCommandFromArgv` is a pure transformer (no I/O)
- rule.forbid.remote-boundaries says unit tests for pure logic
- integration tests are for communicators and orchestrators
- this is a transformer - unit tests are correct

**verdict:** ✅ unit tests are the appropriate test type.

### no input validation in transformer

**question:** should `asApplyCommandFromArgv` validate its inputs?

**analysis:**
- rule.require.bounded-contexts: validate at boundaries
- this function is internal to `contract/cli/`
- inputs come from trusted internal code (`plan.ts`)
- external boundary validation happens in CLI parser (commander)

**verdict:** ✅ validation not needed for internal functions.

---

## lesson learned

coverage review differs from adherance review:
- adherance: "does this line violate a rule?"
- coverage: "is there a rule that should apply but doesn't?"

both are necessary for thorough review.

---

## conclusion

**all relevant standards covered.**

1. error handle: not needed (pure transformer) ✅
2. validation: not needed (internal function) ✅
3. tests: 10 unit tests present ✅
4. types: explicit, no `any` ✅
5. comments: what-why headers present ✅
6. structure: single export per file ✅

no absent patterns. no omitted practices.
