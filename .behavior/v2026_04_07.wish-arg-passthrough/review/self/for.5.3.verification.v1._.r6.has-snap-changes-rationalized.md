# self-review: has-snap-changes-rationalized

## summary

one new snapshot file added for arg passthrough feature tests. all changes are intended.

## snapshot file changes

```bash
$ git status --porcelain src/contract/cli/__snapshots__/
?? src/contract/cli/__snapshots__/
```

**status:** untracked (new file)

## file: invoke.acceptance.test.ts.snap

### change type

**added** — new file for arg passthrough acceptance tests

### what was added

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

### was this change intended?

**yes.** snapshots were added intentionally to capture:
1. new help text format with `[-- <wish-args>]`
2. new error guidance with hint message

### rationale

| snapshot | rationale |
|----------|-----------|
| plan --help | captures new syntax `[-- <wish-args>]` for discoverability |
| plan --unknown | captures new hint message that guides users to use `--` |

### checks for common regressions

| concern | status |
|---------|--------|
| output format degraded | n/a (new file) |
| error messages less helpful | n/a (new, more helpful than before) |
| timestamps or ids leaked | ✓ checked — no dynamic content |
| extra output added unintentionally | ✓ checked — only expected output |

## checklist

- [x] every snap change has per-file rationale
- [x] no bulk updates without review
- [x] no regressions accepted
- [x] no flaky content (timestamps, ids) in snapshots

## why this holds

1. **only one snap file** — invoke.acceptance.test.ts.snap
2. **change type is "added"** — new file, not modification
3. **both snapshots are intended** — part of feature design
4. **no dynamic content** — snapshots are stable

## conclusion

all snapshot changes are intentional and justified. new file adds coverage for arg passthrough contract outputs.
