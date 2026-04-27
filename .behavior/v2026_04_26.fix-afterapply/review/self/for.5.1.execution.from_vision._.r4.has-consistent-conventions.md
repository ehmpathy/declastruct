# self-review r4: has-consistent-conventions

🍵 tea first.

---

## the review question

do we diverge from extant name conventions and patterns?

---

## issue found and fixed

### 🔧 `transformArgsForApply` → `asApplyArgsFromArgv`

**observation:** `transform*` is not an extant prefix pattern in this codebase.

**extant patterns found:**
```
export const as*        → transformers (asIndentedLines, asIsoTimestamp)
export const get*       → retrieval (getDisplayableDiff, getDaoByResource)
export const compute*   → computations (computeChange)
export const extract*   → extraction (extractResourcesFromPlan)
```

**fix applied:**
```diff
- const transformArgsForApply = (input: {...}): string[] =>
+ const asApplyArgsFromArgv = (input: {...}): string[] =>
```

**verification:** all 10 unit tests pass after rename.

---

## non-issues confirmed

### 1. `asApplyCommandFromArgv` - ✅ follows `as*`

follows extant `as*` transformer pattern.

### 2. `getInvocationPrefix` - ✅ follows `get*`

follows extant `get*` retrieval pattern. returns a derived value.

### 3. output format - ✅ follows tree structure

```ts
log.info('🥥 did you know?');
log.info('   ├─ to apply, run');
log.info(`   └─ ${applyCommand}`);
```

matches extant output patterns in plan.ts and apply.ts.

### 4. file name `asApplyCommandFromArgv.ts` - ✅ follows `as*.ts`

matches extant transformer file names.

---

## lesson learned

**search extant patterns before you name.** when I wrote `transformArgsForApply`, I used a verb-noun pattern that felt natural. but I should have first searched for extant function name prefixes in the codebase.

the search `grep "export const" src/ | head -50` would have shown me:
- `as*` is the standard for transformers
- `get*` is the standard for retrieval
- `transform*` is not used anywhere

had I searched first, I would have named it `asApplyArgsFromArgv` from the start.

---

## conclusion

**fixed divergence.** renamed `transformArgsForApply` to `asApplyArgsFromArgv` to follow extant `as*` convention. all other names and patterns are consistent with codebase.
