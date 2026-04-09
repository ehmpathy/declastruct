# self-review: has-snap-changes-rationalized (r6)

## question

double-check: is every `.snap` file change intentional and justified?

## snap files in this PR

| file | change type | intended? |
|------|-------------|-----------|
| `src/contract/cli/__snapshots__/plan.integration.test.ts.snap` | added | yes |

## rationalization

### plan.integration.test.ts.snap (added)

**what changed:** new snapshot file added

**why this change is intentional:**

this snapshot was added in the `has-contract-output-variants-snapped` review to capture the `--snap` flag output format for PR review visibility.

**what it contains:**

```
{
  "observedAt": "[TIMESTAMP]",
  "remote": [
    {
      "forResource": { "class": "DemoResource", "slug": "DemoResource.{uuid}.[EXID]" },
      "state": null
    },
    ...
  ],
  "wished": [
    {
      "forResource": { "class": "DemoResource", "slug": "DemoResource.{uuid}.[EXID]" },
      "state": { "_dobj": "DemoResource", "exid": "[EXID]", "name": "First Resource" }
    },
    ...
  ]
}
```

**why the content is correct:**

1. `observedAt` masked as `[TIMESTAMP]` — prevents flaky tests from timestamp changes
2. exid suffix masked as `[EXID]` — prevents flaky tests from UUID changes
3. structure shows all key fields: `observedAt`, `remote[]`, `wished[]`
4. each entry shows `forResource` (class, slug) and `state` (with `_dobj`)
5. demonstrates null state for new resources

**no regressions:**

- no prior snapshot existed (this is a new feature)
- no format degradation (this is the first capture)
- no timestamps or IDs leaked (properly sanitized)

## common regression check

| regression type | present? | notes |
|-----------------|----------|-------|
| output format degraded | no | n/a (new file) |
| error messages less helpful | no | n/a (not error output) |
| timestamps/IDs leaked | no | sanitized with placeholders |
| extra output added unintentionally | no | intentionally captures full structure |

## conclusion

one `.snap` file added, intentionally, to enable PR review of the `--snap` flag output format. the snapshot content is stable (dynamic values sanitized) and demonstrates the correct output structure.

