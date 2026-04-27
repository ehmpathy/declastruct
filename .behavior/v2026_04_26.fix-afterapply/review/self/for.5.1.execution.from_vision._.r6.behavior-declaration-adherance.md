# self-review r6: behavior-declaration-adherance

🍵 tea first.

---

## the review question

does the implementation match what the behavior declaration describes? did the junior misinterpret or deviate from the spec?

---

## deliberate examination of each change

### change 1: argv capture placement

**the wish says:**
> "ensure to only replace the --flags, since the caller may have used env vars and other attributes"

**the code does:**

`plan.ts:38-39`:
```ts
// capture original argv before it gets modified for passthrough args
const argvOriginal = [...process.argv];
```

**deliberate check:**

i traced the function flow:
- line 39: argv captured
- lines 41-69: path resolution and validation
- lines 72-82: process.argv MODIFIED for passthrough

the capture at line 39 happens before line 78-82 which modifies `process.argv`. this is correct.

if the capture happened after modification, we would lose the original `--wish`, `--into`, `--snap` flags because they get replaced with passthrough args.

**verdict:** ✅ placement correct. captures original command before modification.

---

### change 2: apply hint output location

**the wish says:**
> "after plan, it should give the command to run to execute the apply"

**the code does:**

`plan.ts:155-163`:
```ts
// log apply hint
const applyCommand = asApplyCommandFromArgv({
  argv: argvOriginal,
  planFilePath: relativePlanPath,
});
log.info('🥥 did you know?');
log.info('   ├─ to apply, run');
log.info(`   └─ ${applyCommand}`);
log.info('');
```

**deliberate check:**

i traced the output sequence:
- lines 147-152: plan summary output
- line 153: blank line
- lines 155-163: apply hint output

the apply hint comes AFTER the plan summary, not before it. this matches the wish.

**verdict:** ✅ output location correct. apply hint follows plan summary.

---

### change 3: flag transformation scope

**the wish says:**
> "scope it only to the --wish and --into flags, since they may have supplied other flags too"

**the code does:**

`asApplyArgsFromArgv.ts:56`:
```ts
const skipFlags = new Set(['--wish', '--into', '--snap']);
```

**deliberate check:**

the wish mentions only `--wish` and `--into`. the code also removes `--snap`.

is this a deviation? i considered:
1. the wish's intent: "preserve other flags the user may have supplied"
2. `--snap` is a plan command flag, not a user-supplied flag
3. `--snap` has no semantic use in the apply command

conclusion: this is additive correctness, not a deviation. the wish wanted user flags preserved; `--snap` is not a user flag in the context of apply.

**verdict:** ✅ scope appropriate. user flags preserved, plan-specific flags removed.

---

### change 4: passthrough args removal

**the wish does not mention passthrough args.**

**the code does:**

`asApplyArgsFromArgv.ts:60-68`:
```ts
// stop at passthrough separator
if (arg === '--') {
  hitPassthrough = true;
  continue;
}

// skip all after passthrough
if (hitPassthrough) continue;
```

**deliberate check:**

the wish is silent on passthrough args. is the removal correct?

i considered:
1. passthrough args (`-- arg1 arg2`) are passed to the wish file
2. apply does not execute the wish file
3. passthrough args have no semantic use in apply

conclusion: this is implicit correctness. the wish didn't mention it because it's obvious that wish-file args don't apply to the apply command.

**verdict:** ✅ passthrough removal appropriate.

---

### change 5: invocation prefix detection

**the wish says:**
> "since its the same as the one used to run the plan"

**the code does:**

`getInvocationPrefix`:
```ts
if (execPath.includes('npx')) return 'npx';
if (execPath.includes('pnpm')) return 'pnpm dlx';
if (execPath.includes('yarn')) return 'yarn dlx';
if (execPath.includes('node_modules/.bin')) return 'npx';
return '';
```

**deliberate check:**

the wish says "the same as the one used to run the plan". this implies:
1. if user ran `npx declastruct plan`, apply should be `npx declastruct apply`
2. if user ran `pnpm dlx declastruct plan`, apply should be `pnpm dlx declastruct apply`

the code detects the package manager from `argv[1]` (the executable path) and returns the appropriate prefix.

is this accurate? i considered edge cases:
- npx: `/home/user/.npm/_npx/...` contains 'npx' → returns 'npx' ✅
- pnpm: `/home/user/.pnpm/...` contains 'pnpm' → returns 'pnpm dlx' ✅
- yarn: `/home/user/.yarn/...` contains 'yarn' → returns 'yarn dlx' ✅
- local: `/project/node_modules/.bin/...` → returns 'npx' ✅
- global: `/usr/local/bin/declastruct` → returns '' (bare) ✅

**verdict:** ✅ prefix detection matches user's invocation.

---

## issue found: none

all five changes adhere to the behavior declaration. no misinterpretations.

---

## lesson from this review

the wish was intentionally minimal. it described the outcome ("show apply command") without a prescription of implementation details. the implementation filled in necessary details (`--snap` removal, passthrough removal, prefix detection) that the wish left implicit.

this is appropriate: the wish describes WHAT, the implementation decides HOW.

---

## conclusion

**implementation adheres to spec.**

1. argv capture before modification ✅
2. apply hint after plan summary ✅
3. user flags preserved ✅
4. passthrough args removed appropriately ✅
5. invocation prefix detected correctly ✅

no deviations from the wish. the implementation honors both the letter and the spirit of the declaration.
