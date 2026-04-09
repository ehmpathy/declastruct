# self-review: has-consistent-mechanisms (round 8)

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/3.3.1.blueprint.product.v1.i1.md`

---

## search for related codepaths

### search 1: arg capture patterns in src/

```bash
grep -r "allowUnknownOption|process\.argv" src/
# result: no matches
```

**found:** no extant arg capture or process.argv manipulation in codebase.

### search 2: arg parse patterns in src/

```bash
grep -r "parseArgs|command\.args" src/
# result: no matches
```

**found:** no extant use of node's parseArgs or commander's command.args.

### search 3: extant fixture patterns

```bash
ls src/.test/assets/*.ts
```

**found:** 4 fixtures with consistent pattern:

| fixture | exports |
|---------|---------|
| wish.fixture.ts | getResources(), getProviders() |
| wish-with-del.fixture.ts | getResources(), getProviders() |
| wish-for-del.fixture.ts | getResources(), getProviders() |
| wish-with-auth.fixture.ts | getResources(), getProviders() |

### search 4: extant invoke.ts patterns

read invoke.ts to understand extant command patterns:

```typescript
// extant pattern in invoke.ts
program
  .command('plan')
  .description('Generate a change plan from a wish file')
  .requiredOption('--wish <file>', 'Path to wish file')
  .requiredOption('--into <file>', 'Path to output plan file')
  .action(async (options) => {
    await executePlanCommand({
      wishFilePath: options.wish,
      planFilePath: options.into,
    });
  });
```

**found:** commands use `.description()`, `.requiredOption()`, `.option()`, `.action()`. no use of `.allowUnknownOption()` or `.usage()`.

---

## mechanism-by-mechanism assessment

### mechanism 1: `.allowUnknownOption()`

**what it does:** tells commander to capture unknown flags instead of error.

**extant pattern?** no

**codebase search:** `grep -r "allowUnknownOption" src/` → no matches

**why this holds:** declastruct commands have not needed to capture unknown flags. plan and apply have fixed option sets. passthrough args is the first feature that requires unknown flag capture.

**verdict:** required, no duplication.

---

### mechanism 2: `.usage()` for help text

**what it does:** customizes the usage line in help output.

**extant pattern?** no

**codebase search:** `grep -r "\.usage\(" src/` → no matches

**why this holds:** extant commands rely on commander's auto-generated usage. plan command needs custom usage to show `[-- <wish-args>]` for discoverability (usecase.4).

**verdict:** required, no duplication.

---

### mechanism 3: `command.args` access

**what it does:** accesses captured unknown flags from commander.

**extant pattern?** no

**codebase search:** `grep -r "command\.args" src/` → no matches

**why this holds:** extant action handlers receive `(options)` only. blueprint changes handler to receive `(options, command)` to access `command.args`. this is commander's documented API for unknown flags.

**verdict:** required, no duplication.

---

### mechanism 4: `passthroughArgs` parameter

**what it does:** passes captured args from invoke to plan command.

**extant pattern?** no

**review of plan.ts signature:**
```typescript
// extant
export const executePlanCommand = async ({
  wishFilePath,
  planFilePath,
}: { wishFilePath: string; planFilePath: string; })

// blueprint adds
passthroughArgs?: string[]
```

**why this holds:** executePlanCommand has two parameters (paths). no extant mechanism passes additional args. new parameter is required for the feature.

**verdict:** required, no duplication.

---

### mechanism 5: `process.argv` injection

**what it does:** replaces process.argv before wish file import.

**extant pattern?** no

**codebase search:** `grep -r "process\.argv" src/` → no matches

**why this holds:** no extant code manipulates process.argv. vision specifies this approach: "declastruct replaces process.argv with captured unknowns".

**alternative considered:** pass args as parameter to getResources(). vision rejected this: "wish files parse args themselves via standard node patterns."

**verdict:** required, no duplication.

---

### mechanism 6: `wish-with-args.fixture.ts`

**what it does:** test fixture that parses process.argv.

**extant pattern?** fixtures export getResources() and getProviders().

**consistency check:**

| fixture | getResources | getProviders | additional |
|---------|--------------|--------------|------------|
| wish.fixture.ts | yes | yes | none |
| wish-with-del.fixture.ts | yes | yes | resources with del support |
| wish-with-auth.fixture.ts | yes | yes | provider with auth |
| wish-with-args.fixture.ts | yes | yes | parseArgs inside getResources |

**why this holds:** new fixture follows extant name convention (`wish-with-*.fixture.ts`) and export pattern. adds parseArgs inside getResources() which is the pattern specified in vision.

**verdict:** consistent with extant pattern, no duplication.

---

## potential reuse opportunities

| could we reuse... | answer | search |
|-------------------|--------|--------|
| extant arg capture? | no | no matches for allowUnknownOption |
| extant process.argv code? | no | no matches for process.argv |
| extant fixture with args? | no | no extant fixtures parse process.argv |
| commander utilities? | n/a | we use commander's native API |
| extant options pattern? | yes | consistent with requiredOption/option pattern |

**one reuse identified:** the blueprint reuses commander's extant option pattern. not a new abstraction.

---

## summary

**mechanisms reviewed:** 6
**duplications found:** 0
**reuse opportunities:** 1 (reuses commander pattern)
**inconsistencies:** 0

| mechanism | status |
|-----------|--------|
| allowUnknownOption | required, no extant equivalent |
| .usage() | required, no extant usage |
| command.args | required, commander native API |
| passthroughArgs param | required, extends extant signature |
| process.argv injection | required, no extant manipulation |
| wish-with-args fixture | consistent with extant fixture pattern |

**the blueprint introduces no duplicate mechanisms. all new mechanisms are required for the feature.**

