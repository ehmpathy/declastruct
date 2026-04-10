# backwards-compat self-review: --snap implementation

## checklist

for each backwards-compat concern in the code, asked:
- did the wisher explicitly say to maintain this compatibility?
- is there evidence this backwards compat is needed?
- or did we assume it "to be safe"?

---

## review by component

### 1. planChanges return type change

**change:**
`Promise<DeclastructPlan>` -> `Promise<{ plan: DeclastructPlan; snapshot: DeclastructSnapshot }>`

**backwards compat concerns:**
- this is an incompatible change for callers
- all callers in this repo were updated to destructure `{ plan }` or `{ plan, snapshot }`

**backwards compat shims added:** none

**verdict:** no shim needed. this is an internal function, not public API. all callers were updated.

---

### 2. executePlanCommand signature

**change:**
added `snapFilePath: string | null` parameter

**backwards compat concerns:**
- parameter is nullable, so callers must pass a value

**backwards compat shims added:** none

**verdict:** no shim needed. this is internal CLI function. all callers pass `snapFilePath: null` or actual path.

---

### 3. CLI --snap flag

**change:**
added optional `--snap <file>` flag to `declastruct plan` command

**backwards compat concerns:**
- none. optional flag, prior commands continue to work

**backwards compat shims added:** none

**verdict:** no backwards compat concern. additive change only.

---

## summary

**backwards compat shims found:** 0

no backwards compatibility shims were added. the changes are either:
1. internal (planChanges, executePlanCommand) - callers in repo were updated
2. additive (--snap flag) - prior behavior unchanged

the wisher did not request backwards compat maintenance, and none was needed since:
- declastruct is not yet 1.0 (v1.7.3 is semver pre-1.0, incompatible changes allowed)
- --snap is purely additive to the CLI
- internal function changes were propagated to all callers
