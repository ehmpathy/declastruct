# self-review r6: has-pruned-backcompat

eliminate backcompat shims. if we need one, question whether the change is correct.

---

## method

for each change to extant code, asked:
1. does this change break extant callers?
2. if yes, can we avoid the break?
3. if no, is a shim justified or should we question the design?

---

## changes analyzed

### 1. planChanges return signature

**change:** returns `{ plan, snapshot }` tuple instead of `plan` directly.

**breaks extant callers?** yes — plan.ts does `const plan = await planChanges(...)`.

**can we avoid the break?** no — we need to return snapshot data alongside plan.

**do we need a shim?**

options:
- shim: make snapshot optional via overload
- shim: add backward-compat wrapper that extracts plan
- no shim: update the single caller

**why no shim:** planChanges has exactly one caller (plan.ts). we control it. the migration is:
```ts
// before
const plan = await planChanges(...);

// after
const { plan, snapshot } = await planChanges(...);
```

this is a one-line change. a shim adds complexity for zero benefit.

**verdict:** no backcompat shim needed. update the caller.

### 2. new --snap flag

**change:** plan command accepts `--snap <file>` option.

**breaks extant callers?** no — optional flags are additive.

**evidence:**
- `declastruct plan --wish resources.ts --into plan.json` still works
- flag is optional, not required
- absence of flag = no snapshot written

**verdict:** purely additive. no break. no shim.

### 3. new snapshot.json file

**change:** when --snap provided, writes additional file.

**breaks extant callers?** no — new output, opt-in.

**evidence:**
- only written if --snap flag provided
- plan.json still written as before
- no change to extant behavior

**verdict:** purely additive. no break. no shim.

---

## backcompat patterns NOT needed

| pattern | description | why not needed |
|---------|-------------|----------------|
| signature overload | support both old and new signatures | one caller, we control it |
| default export | re-export under old name | no rename |
| deprecation notice | warn on old usage | no old usage to warn |
| version check | behave differently based on version | one version, no compat matrix |

---

## hard question: should return change be additive?

i questioned whether planChanges could return snapshot optionally:

```ts
// option A: always return tuple
const { plan, snapshot } = await planChanges(...);

// option B: return plan, optionally populate snapshot ref
const snapshot = {};
const plan = await planChanges(..., { snapshotRef: snapshot });
```

**why option A is correct:**
- the data exists regardless of whether caller wants it
- tuple return is cleaner than ref mutation
- one caller makes migration trivial
- option B adds complexity (ref pattern) for zero benefit

**lesson:** backcompat shims are for public APIs with many callers. internal functions with one caller get direct updates.

---

## summary

**changes analyzed:** 3
**breaks detected:** 1 (planChanges return signature)
**shims needed:** 0

**why zero shims:**

1. the single signature break has one caller we control
2. the migration is one line
3. shims add complexity without benefit for internal changes

**principle applied:**

backcompat shims exist to protect external consumers. when we control all callers, direct migration is simpler and cleaner than shim layers.

**what would require a shim:**

if planChanges were exported from an SDK consumed by external users, we'd need:
- overload signatures
- deprecation notices
- migration period

none of that applies here. internal function, one caller, direct update.

---

## why each item holds (articulated reflection)

### planChanges return signature change — why no shim is correct

i questioned: "did we assume backwards compat is needed 'to be safe'?"

**no.** we explicitly verified:
1. grep for `planChanges` shows exactly one caller: plan.ts
2. plan.ts is in the same repo, same PR will update it
3. there is no public SDK that exports planChanges
4. there is no npm package consumers would break

the question "should we add a shim?" was answered by evidence, not assumption. the evidence is: one caller, we control it, shim adds complexity for zero external benefit.

**what i would do differently if the situation were different:**
- if planChanges were exported from `declastruct` npm package → shim required
- if planChanges had 5+ callers across the repo → consider shim
- if callers were in different repos → shim required

none of those apply.

### new --snap flag — why purely additive is correct

i questioned: "could the new flag break extant scripts?"

**no.** CLI flags are additive by design:
- extant commands: `declastruct plan --wish x --into y`
- new flag is optional, not positional
- absence of flag = previous behavior exactly

the only way this could break is if someone relied on `--snap` NOT being a valid flag (e.g., error detection). that's not a reasonable expectation — CLI flags get added.

### new snapshot.json output — why opt-in is correct

i questioned: "could the new file break extant workflows?"

**no.** the file only exists if `--snap` is provided:
- no file written without flag
- no change to plan.json location or format
- no change to exit codes
- no change to stdout/stderr

workflows that don't use `--snap` see zero changes.

---

## explicit confirmation: no backcompat was requested

the vision says no word about backwards compatibility. the wish says no word about migration. there are no external consumers to protect.

**we did not assume backcompat "to be safe."** we verified it is not needed.

**the principle:** backcompat is a cost, not a virtue. it protects consumers but adds complexity. when there are no consumers to protect, backcompat is pure overhead.
