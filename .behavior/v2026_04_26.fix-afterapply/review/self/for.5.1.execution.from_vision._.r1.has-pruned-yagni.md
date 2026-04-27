# self-review r1: has-pruned-yagni

🍵 tea first.

---

## component review

### asApplyCommandFromArgv.ts

| component | requested in vision? | minimum viable? | verdict |
|-----------|---------------------|-----------------|---------|
| plan → apply transform | yes (contract inputs) | yes | ✅ |
| remove --wish | yes (contract inputs) | yes | ✅ |
| --into → --plan | yes (contract inputs) | yes | ✅ |
| remove --snap | yes (contract inputs) | yes | ✅ |
| remove passthrough args | yes (contract inputs) | yes | ✅ |
| preserve npx prefix | yes (what we preserve) | yes | ✅ |
| preserve pnpm dlx prefix | yes (what we preserve) | yes | ✅ |
| preserve yarn dlx prefix | yes (what we preserve) | yes | ✅ |
| preserve bare invocation | yes (what we preserve) | yes | ✅ |
| preserve other flags | yes (what we preserve) | yes | ✅ |
| --flag=value syntax | not explicit, but necessary | yes | ✅ |

---

## potential extras reviewed

### 1. `getInvocationPrefix` helper function

**question:** could this be inlined?
**verdict:** ✅ non-issue

the helper is extracted for readability, not reuse. it keeps the main function body scannable. no abstraction added for "future flexibility" — just code organization.

### 2. `transformArgsForApply` helper function

**question:** could this be inlined?
**verdict:** ✅ non-issue

same as above. extracted for readability. the main function reads as narrative: get prefix, transform args, join.

### 3. --flag=value syntax support

**question:** was this requested?
**verdict:** ✅ non-issue

not explicit in vision, but necessary for correctness. users can invoke with `--wish=foo.ts`. without this, the hint would incorrectly include the wish path.

### 4. local node_modules/.bin detection

**question:** was this requested?
**verdict:** ✅ non-issue

falls under "preserve invocation prefix" in vision. users who invoke via local install (`./node_modules/.bin/declastruct`) should get a valid command back.

---

## non-issues: why they hold

all components implement explicit requirements from the vision:
- contract inputs/outputs section defines transformations
- "what we preserve" section defines prefix and flag preservation
- edge cases section confirms yarn/pnpm support

---

## conclusion

no YAGNI detected. all components serve explicit requirements. no abstraction for future flexibility. no features added "while we're here."
