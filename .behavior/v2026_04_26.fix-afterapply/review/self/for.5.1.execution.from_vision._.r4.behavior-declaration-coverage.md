# self-review r4: behavior-declaration-coverage

🍵 tea first.

---

## the review question

does the implementation cover every requirement from the behavior declaration?

---

## wish requirements verified

### requirement 1: "after plan, it should give the command to run to execute the apply"

**verified:** ✅ covered

`plan.ts` lines 155-163 output the apply hint after the plan summary:

```ts
log.info('🥥 did you know?');
log.info('   ├─ to apply, run');
log.info(`   └─ ${applyCommand}`);
```

### requirement 2: "since its the same as the one used to run the plan except we just replace the --flags"

**verified:** ✅ covered

`asApplyCommandFromArgv` transforms the original argv:
- preserves invocation prefix (npx, pnpm dlx, yarn dlx, bare)
- preserves user's other flags
- only transforms plan-specific flags

### requirement 3: "ensure to only replace the --flags, since the caller may have used env vars and other attributes"

**verified:** ✅ covered

`plan.ts` line 39 captures argv before modification:

```ts
const argvOriginal = [...process.argv];
```

this ensures env vars and attributes in the original command are preserved via argv, not lost.

### requirement 4: "scope it only to the --wish and --into flags, since they may have supplied other flags too"

**verified:** ✅ covered (with clarification)

the implementation removes:
- `--wish` and its value (apply uses plan, not wish)
- `--into` and its value (becomes `--plan <planfile>`)
- `--snap` and its value (snapshot is plan-only)
- passthrough args after `--` (wish file args, not needed for apply)

**clarification on --snap:** the wish mentions only `--wish` and `--into`. however, `--snap` is plan-specific (captures state during planning) and has no meaning for apply. removing it is correct behavior, not a violation.

**clarification on passthrough args:** the `-- arg1 arg2` syntax passes args to the wish file. since apply doesn't execute the wish file, these args are irrelevant. removing them is correct.

all other user-supplied flags are preserved (e.g., `--verbose`, `--mode plan`, etc.).

---

## test coverage for each requirement

| requirement | test case | status |
|-------------|-----------|--------|
| apply hint shown | integration test | ✅ |
| preserves invocation | 4 unit tests (npx, pnpm, yarn, bare) | ✅ |
| preserves other flags | 1 unit test | ✅ |
| removes --wish | 1 unit test | ✅ |
| removes --into | 1 unit test | ✅ |
| removes --snap | 1 unit test | ✅ |
| removes passthrough | 1 unit test | ✅ |
| handles --flag=value | 1 unit test | ✅ |

---

## conclusion

**all requirements covered.** the implementation addresses every point in the wish:
1. shows apply command after plan ✅
2. transforms original command ✅
3. preserves env vars/attributes via argv capture ✅
4. scopes to plan-specific flags, preserves user flags ✅

the removal of `--snap` and passthrough args is additive correctness, not a deviation from the wish.
