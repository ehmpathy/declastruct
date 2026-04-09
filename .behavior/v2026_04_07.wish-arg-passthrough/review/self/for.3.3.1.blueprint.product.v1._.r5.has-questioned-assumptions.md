# self-review: has-questioned-assumptions (round 5)

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/3.3.1.blueprint.product.v1.i1.md`

---

## issue found

### the hidden assumption

**assumption:** "process.argv injection before `await import()` ensures the wish file sees the correct args."

**the flaw:** top-level code in a module executes only once — when the module is first imported. if the module is imported again (from cache), top-level code does not re-run.

**specific problem in blueprint:**

the original fixture had parseArgs at top-level:

```typescript
// runs ONCE at import time — cached forever
const { values } = parseArgs({ args: process.argv.slice(2), ... });

export const getResources = async () => {
  // uses cached values from first import
  const suffix = values.env === 'prod' ? '-production' : '-test';
  ...
};
```

**what goes wrong:**

1. test 1 calls executePlanCommand with `--env test`
2. process.argv is set to `['node', 'entry', '--env', 'test']`
3. wish file is imported — parseArgs runs with test, `values.env = 'test'`
4. test 2 calls executePlanCommand with `--env prod`
5. process.argv is set to `['node', 'entry', '--env', 'prod']`
6. wish file import returns cached module — parseArgs does NOT re-run
7. `values.env` is still `'test'` — WRONG

---

## fix applied

**moved parseArgs inside getResources():**

```typescript
export const getResources = async () => {
  // runs on EACH call — reads current process.argv
  const { values } = parseArgs({ args: process.argv.slice(2), ... });

  const suffix = values.env === 'prod' ? '-production' : '-test';
  ...
};
```

**why this fixes the issue:**

1. test 1 calls executePlanCommand with `--env test`
2. process.argv is set to `['node', 'entry', '--env', 'test']`
3. wish file is imported
4. getResources() runs — parseArgs sees `--env test` — correct
5. test 2 calls executePlanCommand with `--env prod`
6. process.argv is set to `['node', 'entry', '--env', 'prod']`
7. wish file import returns cached module
8. getResources() runs — parseArgs sees `--env prod` — CORRECT

**the key insight:** put state-dependent logic inside exported functions, not at module top-level. top-level is for static setup; functions are for dynamic behavior.

---

## git diff of fix

```diff
-const { values } = parseArgs({
-  args: process.argv.slice(2),
-  options: {
-    env: { type: 'string', default: 'test' },
-  },
-  strict: false,  // allow unknown flags
-});
-
 export const getResources = async (): Promise<DomainEntity<any>[]> => {
+  // parse args inside function so each call sees current process.argv
+  // (avoids module cache issues when imported multiple times with different args)
+  const { values } = parseArgs({
+    args: process.argv.slice(2),
+    options: {
+      env: { type: 'string', default: 'test' },
+    },
+    strict: false,  // allow unknown flags
+  });
+
   const suffix = values.env === 'prod' ? '-production' : '-test';
```

---

## other assumptions verified (no issues)

### commander.js command.args

**assumption:** `command.args` contains captured unknown flags when `allowUnknownOption()` is used.

**evidence:** commander.js documentation explicitly states this behavior.

**verdict:** documented behavior, not an assumption.

---

### process.argv is mutable

**assumption:** a mutation to `process.argv` before import affects what the imported module sees.

**evidence:** `process.argv` is a regular mutable array in node.js. assignment replaces the reference.

**verdict:** documented node.js behavior, not an assumption.

---

### argv convention [0] = node, [1] = entry

**assumption:** parsers expect `process.argv[0]` to be the node executable and `[1]` to be the entry point.

**evidence:** node.js documentation states this convention. `process.argv.slice(2)` is the idiomatic way to get user args.

**verdict:** documented convention, not an assumption.

---

## summary

**issue found:** 1 (module cache breaks test scenarios with top-level parseArgs)

**fix applied:** moved parseArgs from top-level to inside getResources()

**lesson for future:** never put process.argv-dependent logic at module top-level when the module may be imported multiple times with different args. put it in functions.
