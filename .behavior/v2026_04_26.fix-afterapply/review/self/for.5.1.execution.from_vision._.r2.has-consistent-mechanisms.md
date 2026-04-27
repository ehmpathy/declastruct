# self-review r2: has-consistent-mechanisms

🍵 tea first.

---

## the review question

did we create new mechanisms that duplicate extant functionality?

---

## codebase search

### searched for argv utilities
```bash
grep -r "argv|process\.argv" src/
```
found 13 files. reviewed each:
- most are test files or the plan/apply commands themselves
- no extant utility for argv transformation into commands

### searched for command build utilities
```bash
grep -r "transform|build.*command|apply.*command" src/
```
found only my new code. no extant mechanism for command construction.

### searched for prefix detection
```bash
grep -r "prefix|npx|pnpm|yarn" src/
```
found 4 files:
- my new code (transformer + tests)
- `asIndentedLines.ts` - unrelated (indents text)
- `invoke.acceptance.test.ts` - uses npx in tests

no extant mechanism for invocation prefix detection.

---

## mechanisms reviewed

| new mechanism | extant equivalent? | verdict |
|---------------|-------------------|---------|
| `asApplyCommandFromArgv` | none found | ✅ new, needed |
| `getInvocationPrefix` (internal) | none found | ✅ new, needed |
| `transformArgsForApply` (internal) | none found | ✅ new, needed |

---

## why no duplicates

this is the first feature that needs to:
1. detect how user invoked the CLI (npx vs pnpm vs yarn vs bare)
2. transform one command into another command
3. manipulate argv to remove/replace flags

prior code either:
- uses `commander` to parse argv (different purpose)
- reads `process.argv` for passthrough args (different purpose)

no extant utility does what `asApplyCommandFromArgv` does.

---

## conclusion

no duplicate mechanisms. the transformer is novel functionality that doesn't exist elsewhere in the codebase.
