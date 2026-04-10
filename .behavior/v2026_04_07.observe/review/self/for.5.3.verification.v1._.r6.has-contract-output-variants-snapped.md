# self-review: has-contract-output-variants-snapped (r6)

## question

double-check: does each public contract have EXHAUSTIVE snapshots?

## issue found

the `--snap` flag output lacked a Jest `.snap` file. the tests verified structure via explicit assertions, but PR reviewers could not see the actual output format without tests run.

**this violated the principle:** "snapshots enable vibecheck in prs — reviewers see actual output without execute"

## fix applied

added test: `should produce snapshot output that matches expected format`

this test:
1. runs `executePlanCommand` with `--snap` flag
2. sanitizes dynamic values (timestamps, exids) for stable snapshots
3. calls `toMatchSnapshot()` to generate `.snap` file

generated snapshot file:
```
src/contract/cli/__snapshots__/plan.integration.test.ts.snap
```

## verification

ran tests to generate snapshot:

```
$ RESNAP=true npm run test:integration -- src/contract/cli/plan.integration.test.ts

 › 1 snapshot written.
Tests: 18 passed, 18 total
```

## snapshot content

the generated `.snap` file shows the output format clearly:

```json
{
  "observedAt": "[TIMESTAMP]",
  "remote": [
    {
      "forResource": {
        "class": "DemoResource",
        "slug": "DemoResource.{uuid}.[EXID]"
      },
      "state": null
    }
  ],
  "wished": [
    {
      "forResource": {
        "class": "DemoResource",
        "slug": "DemoResource.{uuid}.[EXID]"
      },
      "state": {
        "_dobj": "DemoResource",
        "exid": "[EXID]",
        "name": "First Resource"
      }
    }
  ]
}
```

## checklist per contract

| variant | snapped? | location |
|---------|----------|----------|
| success (file created) | ✓ | `.snap` file shows full structure |
| opt-in absent | ✓ | explicit assertion (no file created) |
| observedAt format | ✓ | `.snap` shows `[TIMESTAMP]` placeholder |
| remote[] structure | ✓ | `.snap` shows array with entries |
| wished[] structure | ✓ | `.snap` shows array with entries |
| null state for new | ✓ | `.snap` shows `"state": null` |
| _dobj stamp | ✓ | `.snap` shows `"_dobj": "DemoResource"` |

## what i learned

i initially rationalized why snapshots weren't needed: "dynamic values make raw snapshots less useful." this was the wrong mindset.

the guide warned: "if you find yourself about to say 'this variant isn't worth a snapshot' — stop."

i was doing exactly that. the rationalization was a sign i needed to look deeper.

the fix was straightforward once i committed to it:
1. sanitize dynamic values with placeholders
2. call `toMatchSnapshot()`
3. run with `RESNAP=true` to generate

**lesson for next time:** when tempted to skip a snapshot, that's the signal to add one. the rationalization is the red flag.

## why this matters

snapshots serve two purposes i undervalued:

1. **pr review visibility** — reviewers see output shape without clone + run
2. **drift detection** — output changes surface in diffs over time

without the snapshot, a reviewer would need to:
- clone the repo
- run the tests
- inspect the temp directory
- find the snapshot.json file

with the snapshot, they open the PR and see the format immediately.

## conclusion

issue found and fixed. the contract now has a Jest snapshot that enables PR review of the output format. reviewers can see exactly what `--snap` produces without test execution.

**key insight:** the instinct to skip a snapshot is the signal to add one.

