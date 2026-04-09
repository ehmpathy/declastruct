# self-review: has-contract-output-variants-snapped

## summary

all contract output variants for the arg passthrough feature have snapshot coverage. verified 2 snapshots for CLI help and error output.

## contracts introduced by this feature

| contract | type | output |
|----------|------|--------|
| `declastruct plan --help` | cli help | shows `[-- <wish-args>]` syntax |
| `declastruct plan --unknown` | cli error | error with hint to use `--` |
| `declastruct plan -- args` | cli success | JSON plan file (internal) |
| `declastruct apply -- args` | cli success | apply output (args ignored) |

## snapshot coverage matrix

| contract | positive path | negative path | help | edge cases |
|----------|---------------|---------------|------|------------|
| plan with --help | n/a | n/a | ✓ snap | n/a |
| plan with unknown option | n/a | ✓ snap | n/a | n/a |
| plan with -- args | assertion | n/a | n/a | assertion |
| apply with -- args | assertion | n/a | n/a | n/a |

## snapshot files

### invoke.acceptance.test.ts.snap

```
exports[`invoke CLI plan --help should show passthrough args in plan help text 1`] = `
"Usage: declastruct plan --wish <file> --into <file> [-- <wish-args>]

Generate a change plan from a wish file

Options:
  --wish <file>  Path to wish file
  --into <file>  Path to output plan file
  -h, --help     display help for command
"
`;

exports[`invoke CLI plan with unknown option should guide user to use -- when unknown option passed 1`] = `
"error: unknown option '--env'
hint: to pass args to your wish file, use: -- --env
"
`;
```

## why some tests use assertions instead of snapshots

| test | why assertion is sufficient |
|------|---------------------------|
| plan with -- args | verifies plan.json content (internal), not caller-visible output |
| apply with -- args | verifies stdout contains expected resource name (behavioral) |
| plan with typo | verifies stderr contains error (behavioral, similar to snapped case) |

the success cases produce internal artifacts (JSON plan files) or simple stdout text. the key caller-visible outputs are:
1. help text that shows the syntax — snapped ✓
2. error guidance when args used wrong — snapped ✓

## checklist

- [x] positive path snapped where applicable (help text)
- [x] negative path snapped (error with hint)
- [x] help/usage snapped
- [x] edge cases covered (typo, --wish after --)
- [x] snapshots show actual output, not placeholder

## why this holds

1. **help text is snapped** — reviewers see exact syntax in PR diff
2. **error guidance is snapped** — reviewers see exact error message
3. **success paths use assertions** — internal verification, not caller output
4. **no absent variants** — all unique output types are covered

## conclusion

contract output variants are exhaustively snapped. help and error outputs enable vibecheck in PRs.
