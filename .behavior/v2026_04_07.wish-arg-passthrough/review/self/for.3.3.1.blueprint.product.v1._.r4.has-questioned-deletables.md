# self-review: has-questioned-deletables (round 4)

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

**the fix i applied:**
- removed the `originalArgv` variable
- removed the restoration line
- blueprint now shows only the injection:

```typescript
process.argv = [...passthroughArgs];
const wish = await import(resolvedWishPath);
```

**git diff of fix:**
```diff
-  const originalArgv = process.argv;  // <-- ADD: save original
   process.argv = [process.argv[0]!, process.argv[1]!, ...passthroughArgs];  // <-- ADD: inject

   // import wish file (now sees passthroughArgs in process.argv)
   const wish = await import(resolvedWishPath);
-
-  // restore original argv (optional safety)
-  process.argv = originalArgv;  // <-- ADD: restore
```

---

## why all other components hold

### allowUnknownOption()
- required: commander throws without it
- cannot delete

### .usage() help text
- required: criteria usecase.4 demands it
- cannot delete

### command.args capture
- required: only way to get captured unknowns
- cannot delete

### passthroughArgs parameter
- required: how invoke passes args to plan
- cannot delete

### process.argv injection
- required: core mechanism of the feature
- cannot delete

### wish-with-args.fixture.ts
- required: tests need a fixture that observes process.argv
- cannot delete

---

## summary

found 1 issue: unnecessary restoration code.
fixed by: removed from blueprint.
verified: all other components trace to requirements.
