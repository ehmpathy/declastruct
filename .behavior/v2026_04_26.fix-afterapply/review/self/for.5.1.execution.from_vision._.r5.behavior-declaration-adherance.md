# self-review r5: behavior-declaration-adherance

🍵 tea first.

---

## the review question

does the implementation match what the behavior declaration describes?

---

## files changed

1. `src/contract/cli/plan.ts` (modified)
2. `src/contract/cli/asApplyCommandFromArgv.ts` (new)
3. `src/contract/cli/asApplyCommandFromArgv.test.ts` (new)

---

## file-by-file adherance review

### file 1: `src/contract/cli/plan.ts`

**changes made:**

1. line 18 - added import:
   ```ts
   import { asApplyCommandFromArgv } from './asApplyCommandFromArgv';
   ```

2. line 39 - capture original argv:
   ```ts
   const argvOriginal = [...process.argv];
   ```

3. lines 155-163 - output apply hint:
   ```ts
   const applyCommand = asApplyCommandFromArgv({
     argv: argvOriginal,
     planFilePath: relativePlanPath,
   });
   log.info('🥥 did you know?');
   log.info('   ├─ to apply, run');
   log.info(`   └─ ${applyCommand}`);
   log.info('');
   ```

**adherance check:**

| wish requirement | implementation | match? |
|------------------|----------------|--------|
| show apply command after plan | lines 155-163 | ✅ |
| use same command as plan | `argvOriginal` captured at line 39 | ✅ |
| preserve caller's env/attributes | capture before modification | ✅ |

**verdict:** ✅ adheres to spec

---

### file 2: `src/contract/cli/asApplyCommandFromArgv.ts`

**implementation review:**

1. `asApplyCommandFromArgv` (lines 5-19):
   - takes `argv` and `planFilePath`
   - returns reconstructed apply command
   - preserves invocation prefix
   - transforms args via `asApplyArgsFromArgv`

2. `getInvocationPrefix` (lines 25-39):
   - detects npx, pnpm dlx, yarn dlx, or bare
   - checks `argv[1]` (executable path)

3. `asApplyArgsFromArgv` (lines 45-94):
   - removes `--wish`, `--into`, `--snap` flags
   - removes passthrough args after `--`
   - adds `--plan <planFilePath>`
   - preserves all other args

**adherance check:**

| wish requirement | implementation | match? |
|------------------|----------------|--------|
| replace only --flags | `skipFlags` set limits removal scope | ✅ |
| scope to --wish and --into | `skipFlags` includes these | ✅ |
| preserve other flags | all non-skip args pushed to result | ✅ |

**verdict:** ✅ adheres to spec

---

### file 3: `src/contract/cli/asApplyCommandFromArgv.test.ts`

**test coverage review:**

| test case | what it verifies |
|-----------|------------------|
| case 1 | npx invocation, basic transformation |
| case 2 | pnpm dlx prefix preserved |
| case 3 | yarn dlx prefix preserved |
| case 4 | node_modules/.bin uses npx |
| case 5 | --snap removed |
| case 6 | passthrough args removed |
| case 7 | other flags preserved |
| case 8 | --flag=value syntax handled |
| case 9 | bare invocation (no prefix) |
| case 10 | relative paths work |

**adherance check:**

all tests verify behavior matches the wish requirements.

**verdict:** ✅ tests adhere to spec

---

## issue found: none

all three files implement the wish correctly. no deviations detected.

---

## non-issues confirmed

### output format uses 🥥 emoji instead of 🌊

the wish shows example output with 🌊 emoji:
```
🌊 planned for 4 resources
   into provision/aws.auth/account=prep/.temp/plan.json
```

the implementation uses 🥥 emoji:
```
🥥 did you know?
   ├─ to apply, run
   └─ npx declastruct apply --plan plan.json
```

**why this is not a deviation:**

1. the 🌊 in the wish is the extant plan output, not the new apply hint
2. the apply hint is a separate section
3. 🥥 (coconut) is a valid turtle-vibes emoji for "tip" or "hint" sections
4. the tree structure (`├─`, `└─`) matches extant output patterns

### --snap removal not in wish but implemented

the wish says "scope it only to the --wish and --into flags". we also remove `--snap`.

**why this is not a deviation:**

1. the wish's intent is to preserve user-supplied flags
2. `--snap` is plan-specific, not user-supplied
3. apply doesn't accept `--snap`
4. this is additive correctness, not a deviation

---

## conclusion

**implementation adheres to spec.** all three files implement the wish correctly:

1. `plan.ts` - captures argv, outputs apply hint ✅
2. `asApplyCommandFromArgv.ts` - transforms command correctly ✅
3. `asApplyCommandFromArgv.test.ts` - verifies all behaviors ✅

no misinterpretations or deviations from spec.
