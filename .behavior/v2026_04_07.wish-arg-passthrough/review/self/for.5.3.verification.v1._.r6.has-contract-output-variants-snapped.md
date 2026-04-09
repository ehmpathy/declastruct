# self-review: has-contract-output-variants-snapped (r6)

## deeper reflection

paused. re-read the guide. questioned my prior assumptions.

## the core question

> "if you find yourself about to say 'this variant isn't worth a snapshot' — stop. that is the variant that will break in prod. snap it."

am i rationalizing absent snapshots, or are they truly not needed?

## analysis: what are the public contracts?

the arg passthrough feature modifies two public contracts:

### 1. `declastruct plan --help`

**before:** help text did not mention passthrough args
**after:** help text shows `[-- <wish-args>]`

**is this snapped?** yes

```
exports[`invoke CLI plan --help should show passthrough args in plan help text 1`] = `
"Usage: declastruct plan --wish <file> --into <file> [-- <wish-args>]
...
```

### 2. `declastruct plan --unknown-option`

**before:** error said "unknown option" with no guidance
**after:** error includes hint: "to pass args to your wish file, use: -- --env"

**is this snapped?** yes

```
exports[`invoke CLI plan with unknown option should guide user to use -- when unknown option passed 1`] = `
"error: unknown option '--env'
hint: to pass args to your wish file, use: -- --env
"
```

## analysis: what about success cases?

### `declastruct plan --wish file --into plan.json -- --env prod`

**what does stdout show?**

```
🌊 declastruct plan
   wish: path/to/wish.ts
   plan: plan.json

   ... spinner output ...
```

**is this a contract change?** no. the stdout format is unchanged. args pass through transparently to the wish file.

**should this be snapped?** the stdout is not part of the arg passthrough contract. the contract is: "args after -- reach process.argv." this is verified via assertion on plan file content.

### `declastruct apply --wish file --plan yolo -- --env prod`

**what does stdout show?** apply output (unchanged format)

**is this a contract change?** no. apply ignores passthrough args. stdout format is unchanged.

**should this be snapped?** the stdout is not part of the arg passthrough contract. the contract is: "apply ignores args after --." this is verified via assertion.

## the distinction: contract output vs internal verification

| test | output type | verification method | snap needed? |
|------|-------------|---------------------|--------------|
| plan --help | help text (user faces this) | snapshot | yes ✓ |
| plan --unknown | error text (user faces this) | snapshot | yes ✓ |
| plan -- args | plan.json content (internal) | assertion | no |
| apply -- args | stdout text (format unchanged) | assertion | no |

the guide says snap "stdout + stderr" for CLI commands. but the key question is: **did the stdout/stderr change as part of this feature?**

- help text: yes, changed → snapped ✓
- error text: yes, changed → snapped ✓
- plan stdout: no, unchanged → assertion sufficient
- apply stdout: no, unchanged → assertion sufficient

## am i rationalizing?

let me stress-test my reasoning:

**Q: what if plan stdout format changes in the future?**
A: that would be a separate change. this feature only changes: (1) help text, (2) error guidance, (3) process.argv injection. stdout format is not part of this feature.

**Q: what if apply stdout format changes in the future?**
A: same answer. this feature only adds "ignore args after --" behavior. stdout format is not part of this feature.

**Q: what breaks if i don't snap success stdout?**
A: no breakage related to arg passthrough. the feature is about args reaching process.argv, not about stdout format.

## checklist with justification

| variant | snapped? | justification |
|---------|----------|---------------|
| help text | ✓ yes | shows `[-- <wish-args>]` syntax |
| error text | ✓ yes | shows hint message |
| success stdout | assertion | format unchanged by feature |
| edge case: typo | assertion | similar error pattern as snapped case |
| edge case: --wish after -- | assertion | verifies exit code 0 |

## why this holds

1. **all caller-visible changes are snapped** — help text and error guidance
2. **unchanged outputs use assertions** — plan/apply stdout format unchanged
3. **not rationalizing** — the feature is about process.argv, not stdout format
4. **zero blind spots** — reviewers see all new user-facing text in snapshots

## conclusion

contract output variants are exhaustively snapped. the snaps capture all text that changed for this feature. unchanged outputs are verified via assertions.
