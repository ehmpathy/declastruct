# self-review r2: has-pruned-backcompat

🍵 tea first.

---

## the review question

did we add backwards compatibility that wasn't explicitly requested?

---

## line-by-line review of changes

### plan.ts changes

**line 18: new import**
```ts
import { asApplyCommandFromArgv } from './asApplyCommandFromArgv';
```
- verdict: additive, no compat concern

**line 39: argv capture**
```ts
const argvOriginal = [...process.argv];
```
- this captures argv BEFORE passthrough injection (lines 78-82)
- passthrough injection still happens exactly as before
- verdict: read-only operation, no behavior change

**lines 155-163: apply hint output**
```ts
const applyCommand = asApplyCommandFromArgv({...});
log.info('🥥 did you know?');
log.info('   ├─ to apply, run');
log.info(`   └─ ${applyCommand}`);
log.info('');
```
- this is the core feature requested by the wisher
- verdict: explicitly requested, not invented compat

---

## could this break scripts?

**question:** could the new output break scripts that parse plan stdout?

**analysis:**
1. prior output: summary block ends with blank line
2. new output: appended AFTER the blank line
3. scripts that parse "🌊 declastruct plan" summary block: unaffected
4. scripts that expect ONLY prior output: would now see extra lines

**verdict:** not a backwards compat concern we invented

the wisher explicitly requested this output change. the wish says:
> "after plan, it should give the command to run to execute the apply"

this is the requested feature, not a compat shim we added "to be safe."

---

## items reviewed for invented compat

| item | invented compat? | verdict |
|------|------------------|---------|
| argv capture | no | needed for feature |
| apply hint output | no | explicitly requested |
| preserve npx prefix | no | explicitly in vision |
| preserve pnpm/yarn prefix | no | explicitly in vision |
| preserve other flags | no | explicitly requested by wisher |

---

## conclusion

no invented backwards compatibility. all changes implement explicit requirements:
- the wisher asked for apply hint output
- the vision specifies what to preserve (prefix, flags)
- we add only what was requested

the output change IS visible, but it's the requested feature, not a compat concern.
