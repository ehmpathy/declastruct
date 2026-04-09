# self-review: has-fixed-all-gaps (r11)

## question

final buttonup check: did you FIX every gap you found, or just detect it?

## verification reviews scanned

i reviewed all 10 prior self-reviews for this stone:

| review | slug | gaps found? |
|--------|------|-------------|
| r1 | has-behavior-coverage | no gaps |
| r2 | has-zero-test-skips | no gaps |
| r3 | has-all-tests-passed | no gaps |
| r4 | has-preserved-test-intentions | no gaps |
| r5 | has-journey-tests-from-repros | no gaps (n/a - no repros) |
| r6 | has-contract-output-variants-snapped | **GAP FOUND** |
| r7 | has-snap-changes-rationalized | no gaps |
| r8 | has-critical-paths-frictionless | no gaps |
| r9 | has-ergonomics-validated | no gaps |
| r10 | has-play-test-convention | no gaps |

---

## gap found and fixed

### r6: has-contract-output-variants-snapped

**gap detected:**
the `--snap` flag output lacked a Jest `.snap` file. tests verified structure via explicit assertions, but PR reviewers could not see the actual output format without test execution.

**why this was a gap:**
the guide says: "snapshots enable vibecheck in prs — reviewers see actual output without execute." without a `.snap` file, reviewers had to:
1. clone the repo
2. run the tests
3. inspect temp directory
4. find the output file

this is friction that blocks effective PR review.

**fix applied:**

1. **wrote the test** — added `should produce snapshot output that matches expected format` to `plan.integration.test.ts`

2. **ran the test** — executed `RESNAP=true npm run test:integration`

3. **verified the snapshot** — confirmed `.snap` file was generated

**citation 1: test file added**

file: `src/contract/cli/plan.integration.test.ts`

the test sanitizes dynamic values (timestamps, UUIDs) and calls `toMatchSnapshot()`:

```typescript
it('should produce snapshot output that matches expected format', async () => {
  // setup temp dir and paths
  await executePlanCommand({ wishFilePath, planFilePath, snapFilePath });

  const snapJson = await readFile(snapFilePath, 'utf-8');
  const snapshot = JSON.parse(snapJson);

  const sanitized = {
    observedAt: '[TIMESTAMP]',
    remote: snapshot.remote.map((entry) => ({
      forResource: {
        class: entry.forResource.class,
        slug: entry.forResource.slug.replace(/\.[^.]+$/, '.[EXID]'),
      },
      state: entry.state ? { _dobj: entry.state._dobj, exid: '[EXID]', name: entry.state.name } : null,
    })),
    wished: snapshot.wished.map((entry) => ({
      forResource: {
        class: entry.forResource.class,
        slug: entry.forResource.slug.replace(/\.[^.]+$/, '.[EXID]'),
      },
      state: entry.state ? { _dobj: entry.state._dobj, exid: '[EXID]', name: entry.state.name } : null,
    })),
  };

  expect(sanitized).toMatchSnapshot();
});
```

**citation 2: snapshot file generated**

file: `src/contract/cli/__snapshots__/plan.integration.test.ts.snap`

content shows the output format:

```
exports[`executePlanCommand --snap flag should produce snapshot output that matches expected format 1`] = `
{
  "observedAt": "[TIMESTAMP]",
  "remote": [
    {
      "forResource": {
        "class": "DemoResource",
        "slug": "DemoResource.e0b6f399-5040-4aa7-af2b-a388979a72aa.[EXID]",
      },
      "state": null,
    },
    ...
  ],
  "wished": [
    {
      "forResource": {
        "class": "DemoResource",
        "slug": "DemoResource.e0b6f399-5040-4aa7-af2b-a388979a72aa.[EXID]",
      },
      "state": {
        "_dobj": "DemoResource",
        "exid": "[EXID]",
        "name": "First Resource",
      },
    },
    ...
  ],
}
`;
```

**citation 3: test execution**

```sh
$ RESNAP=true npm run test:integration -- src/contract/cli/plan.integration.test.ts

 PASS  src/contract/cli/plan.integration.test.ts
  executePlanCommand
    --snap flag
      ✓ should produce snapshot output that matches expected format

 › 1 snapshot written.
Tests: 18 passed, 18 total
```

**verification complete:**
- gap detected: absent Jest snapshot
- gap fixed: test written + snapshot generated
- proof: citations 1, 2, 3 above

---

## completeness check

| check | status |
|-------|--------|
| any "TODO" items? | no |
| any "LATER" items? | no |
| any incomplete coverage? | no |
| any skipped tests? | no |
| any deferred fixes? | no |

---

## additional gap found during final verification

when i ran the final test verification, i discovered the snapshot sanitization was incomplete:

**gap detected:**
the slug contains a UUID in the middle that was not sanitized:
`DemoResource.{uuid}.{exid}` → only `{exid}` was masked as `[EXID]`

**gap fixed:**
1. updated test to also mask the UUID: `DemoResource.[UUID].[EXID]`
2. updated snapshot file to match new sanitization

**citation:**

```typescript
// added to plan.integration.test.ts
const sanitizeSlug = (slug: string) =>
  slug
    .replace(/\.[0-9a-f-]{36}\./i, '.[UUID].') // mask uuid in middle
    .replace(/\.[^.]+$/, '.[EXID]'); // mask exid suffix
```

---

## final verification

ran all tests to confirm all pass:

```sh
$ npm run test:integration -- src/contract/cli/plan.integration.test.ts

PASS src/contract/cli/plan.integration.test.ts
Tests:       18 passed, 18 total
Snapshots:   1 passed, 1 total
```

all 18 tests pass. no skips. no failures. no deferrals.

---

## what i learned

the r6 review caught a real gap that i had rationalized away. my original thought was "explicit assertions are sufficient." the review guide challenged that assumption.

the fix was straightforward:
1. add snapshot test with sanitized dynamic values
2. run `RESNAP=true` to generate
3. verify snapshot content

**key insight:** the self-review process works. it caught a gap i would have shipped without it.

---

## conclusion

one gap found (r6). one gap fixed. zero deferrals.

| gap | status | proof |
|-----|--------|-------|
| absent Jest snapshot for --snap output | **FIXED** | `.snap` file generated, test passes |

ready for peer review.

