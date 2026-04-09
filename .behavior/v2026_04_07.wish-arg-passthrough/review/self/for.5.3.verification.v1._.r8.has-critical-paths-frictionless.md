# self-review: has-critical-paths-frictionless (r8)

## deeper reflection

paused. re-read the guide. no repros artifact exists (route skipped 3.2 distill phase).

critical paths are defined in vision.md day-in-the-life section. walked through each path in the code.

## path 1: plan with passthrough args

### the journey

```bash
npx declastruct plan --wish resources.ts --into plan.json -- --env prod
```

walked through the code:

1. **invoke.ts:45** — `command.args` captures `['--env', 'prod']` (commander handles `--` separator)
2. **plan.ts:50** — `process.argv = [process.argv[0]!, process.argv[1]!, ...passthroughArgs]` injects args
3. **plan.ts:53** — `const wish = await import(resolvedWishPath)` loads wish file
4. **wish file** — top-level or function-level `parseArgs()` sees `['--env', 'prod']`

### friction check

| potential friction | status |
|-------------------|--------|
| args not passed | verified: `command.args` receives all args after `--` |
| process.argv overwritten | safe: CLI entry point, no prior args needed |
| wish file module cache | handled: fixture parses inside function, not top-level |
| parseArgs strictness | documented: use `strict: false` to allow unknown flags |

**verdict:** no friction. standard pattern, tested, works.

## path 2: help discoverability

### the journey

```bash
npx declastruct plan --help
```

walked through:

1. **invoke.ts:27** — `.usage('--wish <file> --into <file> [-- <wish-args>]')` sets usage line
2. **commander** — renders usage in help output

### friction check

| potential friction | status |
|-------------------|--------|
| syntax not shown | fixed: `.usage()` adds `[-- <wish-args>]` |
| unclear what wish-args means | acceptable: follows npm scripts convention |

**verdict:** no friction. user sees syntax in help, knows the pattern from npm.

## path 3: unknown option guidance

### the journey

```bash
npx declastruct plan --wish resources.ts --into plan.json --env prod
# note: absent `--` separator
```

walked through:

1. **commander** — detects `--env` as unknown option
2. **invoke.ts:32-36** — `.configureOutput({ writeErr: ... })` intercepts error
3. **invoke.ts:35-36** — extracts flag, prints hint

### friction check

| potential friction | status |
|-------------------|--------|
| silent passthrough of typos | prevented: commander catches unknown options |
| unhelpful error | fixed: hint shows exact correct syntax |
| user confused | mitigated: hint includes the flag they typed |

**verdict:** no friction. error is caught, hint is clear. user knows what to do.

## path 4: apply ignores args

### the journey

```bash
npx declastruct apply --plan plan.json -- --env prod
# args ignored — apply uses plan state
```

walked through:

1. **invoke.ts:62** — `.allowExcessArguments(true)` allows args but ignores them
2. **apply.ts** — no `passthroughArgs` parameter, uses plan file state only

### friction check

| potential friction | status |
|-------------------|--------|
| user expects args to affect apply | by design: plan/apply contract honored |
| no warn about ignored args | acceptable: silent ignore is standard CLI pattern |

**verdict:** no friction. expected behavior, documented in vision.

## stress test: am i just checklist-driven?

Q: did i actually walk through the code?
A: yes. cited specific lines in invoke.ts and plan.ts.

Q: did i check for friction?
A: yes. each path has friction table with status.

Q: what friction did i find?
A: none. the paths are clean. the one "gotcha" (parseArgs strictness) is documented in the fixture.

Q: what would break this?
A: if commander changes `command.args` behavior. if process.argv injection stops. both are tested.

## why this holds

1. **walked the code** — traced each path through invoke.ts → plan.ts → wish file
2. **friction checked** — each path has explicit friction table
3. **edge cases handled** — unknown options get hints, apply ignores args by design
4. **convention followed** — `--` separator is standard (npm, docker, make)

## conclusion

critical paths are frictionless. walked through each path in the code, verified no friction points. implementation follows conventions, errors guide users, tests confirm behavior.

