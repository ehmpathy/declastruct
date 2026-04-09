# self-review: has-questioned-deletables (round 3)

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/3.3.1.blueprint.product.v1.i1.md`

---

## issue found and fixed

### issue: unnecessary process.argv restoration

**what i found:** the blueprint included code to save and restore process.argv around the wish import:

```typescript
const originalArgv = process.argv;  // save
process.argv = [...passthroughArgs];
const wish = await import(resolvedWishPath);
process.argv = originalArgv;  // restore
```

**why this was wrong:**
1. no code after import uses process.argv
2. planChanges() uses resources, providers — not argv
3. write plan file — does not use argv
4. this was "defensive optimization" for hypothetical future need
5. the guide says: delete before you optimize

**the deletion test:**
- if we delete restoration, what breaks? no component breaks.
- planChanges() receives resources and providers — it does not read process.argv
- the plan file write uses resolvedPlanPath — it does not read process.argv
- provider hooks use the provider objects — they do not read process.argv

**the traceability test:**
- vision: does not mention restoration
- criteria: does not mention restoration
- blueprint marked it as "optional safety" — optional means deletable

**the fix i applied:**
removed from blueprint `3.3.1.blueprint.product.v1.i1.md`:
- the `originalArgv` variable declaration
- the restoration line `process.argv = originalArgv`
- the "optional safety" comment

**before:**
```typescript
const originalArgv = process.argv;  // <-- ADD: save original
process.argv = [process.argv[0]!, process.argv[1]!, ...passthroughArgs];
const wish = await import(resolvedWishPath);
process.argv = originalArgv;  // <-- ADD: restore
```

**after:**
```typescript
process.argv = [process.argv[0]!, process.argv[1]!, ...passthroughArgs];
const wish = await import(resolvedWishPath);
```

**lesson learned:** "optional" in a blueprint is a red flag. if it is optional, it probably should be deleted. the deletion imperative means: if no requirement demands it, remove it.

---

## why all other components cannot be deleted

### component 1: allowUnknownOption()

**deletion test:** without this, commander throws an error when user passes `--env prod`.

**traceability:** vision says "commander captures unknown flags via `allowUnknownOption()`"

**verdict:** required. cannot delete.

---

### component 2: .usage() help text

**deletion test:** without this, `--help` lacks documentation for passthrough args.

**traceability:** criteria usecase.4 says "help output shows [-- <wish-args>] in usage"

**verdict:** required. cannot delete.

---

### component 3: command.args capture

**deletion test:** without this, we have no way to get the captured unknown flags.

**traceability:** vision says "capture args after known options" — `command.args` is how commander exposes these.

**verdict:** required. cannot delete.

---

### component 4: passthroughArgs parameter

**deletion test:** without this, executePlanCommand cannot receive the args from invoke.

**traceability:** necessary to pass data between invoke.ts and plan.ts.

**verdict:** required. cannot delete.

---

### component 5: process.argv injection

**deletion test:** without this, the wish file sees the original argv with declastruct flags mixed in.

**traceability:** vision says "declastruct replaces process.argv with captured unknowns"

**verdict:** required. cannot delete.

---

### component 6: wish-with-args.fixture.ts

**deletion test:** without this, we have no way to verify that args reach process.argv in tests.

**traceability:** criteria usecase.1 says "wish file sees --env prod in process.argv" — we need a fixture that observes argv to test this.

**verdict:** required. cannot delete.

---

## summary

**issue found:** 1 (process.argv restoration)
**fix applied:** removed from blueprint
**components verified:** 6 required components cannot be deleted

the blueprint is now minimal — no optimization of components that should not exist.
