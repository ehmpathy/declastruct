# self-review r3: has-consistent-conventions

🍵 tea first.

---

## the review question

do we diverge from extant name conventions and patterns?

---

## extant conventions examined

### file name conventions

| pattern | examples | my code |
|---------|----------|---------|
| `as*.ts` for transformers | `asIndentedLines.ts`, `asIsoTimestamp.ts` | `asApplyCommandFromArgv.ts` ✅ |
| `execute*Command` for CLI | `executePlanCommand`, `executeApplyCommand` | (not applicable) |
| `.test.ts` for unit tests | `*.test.ts` | `asApplyCommandFromArgv.test.ts` ✅ |

**verdict:** ✅ file names follow extant conventions.

### function name conventions

| pattern | examples | my code |
|---------|----------|---------|
| `as*` for transformers | `asIndentedLines`, `asIsoTimestamp` | `asApplyCommandFromArgv` ✅ |
| `get*` for pure retrieval | `getGitRepoRoot` | `getInvocationPrefix` ✅ |
| `transform*` for mutations | N/A in codebase | `transformArgsForApply` ⚠️ |

**issue found:** `transform*` prefix is not extant in codebase. but:
- it's an internal function (not exported)
- it's a helper within the transformer module
- alternatives like `asApplyArgsFromPlanArgs` would be verbose

**verdict:** ✅ acceptable. internal helper, follows verb-noun pattern.

### variable name conventions

| pattern | examples | my code |
|---------|----------|---------|
| `relative*Path` for paths | `relativePlanPath`, `relativeWishPath` | `relativePlanPath` (in caller) ✅ |
| `resolved*Path` for absolute | `resolvedPlanPath`, `resolvedWishPath` | (not applicable) |
| `argv*` for args | `passthroughArgs`, `cliContext.passthrough.argv` | `argvOriginal` ✅ |

**verdict:** ✅ variable names follow extant conventions.

### output format conventions

| pattern | extant | my code |
|---------|--------|---------|
| emoji header | `🌊 declastruct plan` | `🥥 did you know?` ✅ |
| tree structure | `├─`, `└─` | same ✅ |
| indent | 3 spaces | same ✅ |

**verdict:** ✅ output format follows extant conventions.

---

## potential divergence reviewed

### 1. `transform*` prefix

**observation:** codebase doesn't have other `transform*` functions.
**justification:** it's an internal helper (not exported). `as*` is for public transformers.
**alternative:** could rename to `_asApplyArgsFromPlanArgs` but more verbose.
**verdict:** ✅ acceptable divergence. internal helper, not exposed.

### 2. `argvOriginal` name

**observation:** codebase uses `passthrough.argv` for passthrough args.
**justification:** `argvOriginal` means "original process.argv before modification". it's a different concept than `passthrough.argv`.
**verdict:** ✅ not divergent. different concept, appropriate name.

---

## conclusion

**consistent with conventions.** minor note: `transformArgsForApply` uses a prefix not extant elsewhere, but it's an internal helper. all public interfaces (`asApplyCommandFromArgv`) follow extant `as*` pattern.
