# self-review: has-ergonomics-validated (r9)

## deeper reflection

paused. re-read vision.md line by line. no repros artifact exists (route skipped 3.2 distill phase).

the vision is the ergonomics source. every input/output described there must match implementation.

## vision contract: process.argv injection

### vision says (lines 56-68)

> **how it works:**
> 1. commander parses known flags (`--wish`, `--into`)
> 2. args after `--` separator are captured as positional args
> 3. declastruct replaces process.argv with captured args
> 4. wish file is imported — top-level `parseArgs()` sees the injected args
>
> **typo safety:** unknown flags (without `--`) trigger an error with a helpful hint:
> ```
> error: unknown option '--env'
> hint: to pass args to your wish file, use: -- --env
> ```

### implementation delivers (invoke.ts + plan.ts)

step 1: `requiredOption('--wish <file>')` + `requiredOption('--into <file>')` — commander parses known flags

step 2: `const passthroughArgs = command.args` (invoke.ts:45) — args after `--` captured

step 3: `process.argv = [process.argv[0]!, process.argv[1]!, ...passthroughArgs]` (plan.ts:50) — replaces process.argv

step 4: `const wish = await import(resolvedWishPath)` (plan.ts:53) — imports after injection

typo safety: `.configureOutput({ writeErr: ... })` (invoke.ts:29-40) intercepts unknown options, adds hint

**ergonomics match?** yes. all four steps + typo safety implemented exactly as vision described.

## vision contract: help discoverability

### vision says (line 180)

> declastruct should show `[-- <wish-args>]` in its help output for discoverability. example: `npx declastruct plan --wish <file> --into <file> [-- <wish-args>]`

### implementation delivers (invoke.ts:27)

```typescript
.usage('--wish <file> --into <file> [-- <wish-args>]')
```

snapshot confirms:
```
Usage: declastruct plan --wish <file> --into <file> [-- <wish-args>]
```

**ergonomics match?** yes. exact format as vision specified.

## vision contract: apply ignores args

### vision says (lines 178, 206)

> apply should NOT support `--` args. reason: the plan file captures complete resource state at plan time.
>
> **mitigation**: apply ignores `--` args entirely (uses plan's captured state). this is the decided behavior.

### implementation delivers (invoke.ts:62)

```typescript
.allowExcessArguments(true) // ignore passthrough args - apply uses plan's captured state
```

apply.ts has no `passthroughArgs` parameter — it uses plan file state only.

**ergonomics match?** yes. apply silently ignores args as vision specified.

## vision contract: wish file parseArgs pattern

### vision says (lines 72-89)

```typescript
// resources.ts — no declastruct-specific API needed
import { parseArgs } from 'util';

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    env: { type: 'string', default: 'test' },
    verbose: { type: 'boolean', default: false },
  },
});
```

### implementation delivers (wish-with-args.fixture.ts)

```typescript
const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    env: { type: 'string', default: 'test' },
  },
  strict: false, // allow unknown flags
});
```

**ergonomics match?** yes. fixture demonstrates exact pattern from vision. added `strict: false` for flexibility with unknown flags.

## stress test: did i find any drift?

| element | vision | implementation | drift? |
|---------|--------|----------------|--------|
| input syntax | `-- --env prod` | `command.args` captures | no |
| argv injection | step 3: replaces | plan.ts:50 | no |
| error format | `error: unknown option...` | snapshot matches | no |
| hint format | `hint: to pass args...` | snapshot matches | no |
| help text | `[-- <wish-args>]` | invoke.ts:27 | no |
| apply behavior | ignores args | no `passthroughArgs` | no |
| parseArgs pattern | `.slice(2)` | fixture uses same | no |

**zero drift detected.**

## why this holds

1. **walked vision line by line** — quoted each contract section
2. **matched to implementation** — cited exact file:line for each element
3. **confirmed via snapshots** — error and help outputs frozen in tests
4. **no drift found** — every vision element implemented as specified

## conclusion

ergonomics validated. implementation matches vision exactly. no drift between planned and actual input/output.

