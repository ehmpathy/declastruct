# self-review r1: has-research-traceability

verify research recommendations are leveraged or explicitly omitted.

---

## prod code research (3.1.3...prod...v1.i1.md)

### pattern.1: cli argument parse [EXTEND]

**research said:** commander pattern with `.requiredOption()` and `.option()` for plan command args.

**blueprint reflects:** codepath tree shows `[+] --snap <file>` under invoke.ts plan command, alongside extant `--wish` and `--into`. the EXTEND action is appropriate — we add one optional flag to extant structure.

**why it holds:** the research identified the exact insertion point (line 17-18 in invoke.ts). the blueprint prescribes `.option('--snap <file>', ...)` which follows the extant pattern exactly. no new patterns introduced.

### pattern.2: plan command execution [EXTEND]

**research said:** `executePlanCommand` accepts `{ wishFilePath, planFilePath }`, orchestrates the flow, writes output with `writeFile`.

**blueprint reflects:** plan.ts section shows `[~] accept snapFilePath parameter` and `[+] write snapshot.json if --snap provided`. the function signature extends to accept optional `snapFilePath`.

**why it holds:** the research showed the extant signature and write pattern. the blueprint adds one parameter and one conditional write — minimal change, maximal leverage of extant structure.

### pattern.3: planChanges orchestration [EXTEND]

**research said:** `remoteState` available at line 54-57 BEFORE `computeChange` applies `omitReadonly`. this is the key insight — the data exists, it's just not exposed.

**blueprint reflects:** codepath tree shows `[+] collect snapshot entry` with `[←] serialize(remote)` and `[←] serialize(desired)` BEFORE the `[○] computeChange` step. return signature changes to `{ plan, snapshot }`.

**why it holds:** the research pinpointed exactly where in the flow the full state exists. the blueprint prescribes capture at that exact point. the tuple return is the minimal change to expose this data to callers.

### pattern.4: computeChange with omitReadonly [REUSE]

**research said:** `computeChange` applies `omitReadonly()` at lines 104-105, which is WHY the snapshot feature exists — plan.json loses readonly fields.

**blueprint reflects:** the rationale is implicit in the design — snapshot captures state BEFORE computeChange runs. the codepath tree shows `[○] computeChange` AFTER snapshot collection.

**why it holds:** the knowledge of WHERE data is lost informed WHERE to capture it. the research validated the fundamental need for --snap.

### pattern.5: DeclastructChange structure [REUSE]

**research said:** `forResource: { class, slug }` structure used in DeclastructChange.

**blueprint reflects:** DeclastructSnapshotEntry uses identical `forResource: { class: string; slug: string }` structure.

**why it holds:** consistency with extant domain vocabulary. users familiar with plan.json will recognize the structure. no new concepts to learn.

### pattern.6: serialize and getUniqueIdentifierSlug [REUSE]

**research said:** `serialize()` produces deterministic JSON with `_dobj` stamp. `getUniqueIdentifierSlug()` generates unique slug.

**blueprint reflects:** codepath tree shows `[←] serialize(remote)` and `[←] serialize(desired)`. DeclastructSnapshotEntry shows `state: Record<string, any>` which holds serialized output.

**why it holds:** these are the canonical ways to turn domain objects into JSON in this codebase. the blueprint leverages them rather than invents new serialization.

### pattern.7: file output [REUSE]

**research said:** `writeFile` with `JSON.stringify(_, null, 2)` and `mkdir` for parent directories.

**blueprint reflects:** plan.ts section shows `[+] write snapshot.json` which will use the same pattern.

**why it holds:** identical pattern for identical need (write JSON to file). no reason to deviate.

### pattern.8: timestamp generation [REUSE]

**research said:** `asIsoTimestamp(new Date())` used for `createdAt` in planChanges.

**blueprint reflects:** DeclastructSnapshot interface has `observedAt: IsoTimestamp` as first field.

**why it holds:** same need (timestamp), same solution (asIsoTimestamp). the name differs (`observedAt` vs `createdAt`) to reflect semantic difference — this is when we observed, not when we created.

---

## test code research (3.1.3...test...v1.i1.md)

### pattern.1: integration test structure [REUSE]

**research said:** `describe('executePlanCommand', () => { ... it('should...', async () => { ... }) })`

**blueprint reflects:** test tree shows same structure with 8 new test cases under plan.integration.test.ts.

**why it holds:** extant test file, extant pattern. we add cases, not new patterns.

### pattern.2: temp dir generation [REUSE]

**research said:** `genTempDir()` creates isolated test artifacts with UUID.

**blueprint reflects:** implied — new tests will use same fixture infrastructure.

**why it holds:** tests need isolated output paths. the pattern exists and works.

### pattern.3: file existence verification [REUSE]

**research said:** `existsSync(planFilePath)` checks output was created.

**blueprint reflects:** test case `'should create snapshot when --snap flag provided'` implies same check.

**why it holds:** same assertion need, same assertion pattern.

### pattern.4: output file content verification [REUSE]

**research said:** `readFile` + `JSON.parse` + `expect(plan.hash).toBeDefined()` pattern.

**blueprint reflects:** test cases verify `observedAt`, `remote[]`, `wished[]`, `forResource`, `state`, `_dobj`.

**why it holds:** tests need to verify structure. the pattern for read and assert on JSON output is extant and proven.

### pattern.5: negative test cases [REUSE]

**research said:** tests for error conditions (absent file, invalid exports).

**blueprint reflects:** test case `'should not create snapshot when --snap flag absent'` — negative case for opt-in behavior.

**why it holds:** opt-in flag must NOT create output when absent. this is the primary negative case.

### pattern.6: DemoResource fixture [REUSE]

**research said:** `DemoResource` enables test without real providers.

**blueprint reflects:** implied — same fixtures for snapshot tests.

**why it holds:** we test snapshot output, not provider behavior. DemoResource isolates the test.

### pattern.7: state change verification [REUSE]

**research said:** tests verify different actions (CREATE, KEEP, DESTROY) and null/non-null states.

**blueprint reflects:** test case `'snapshot remote[].state should be null for new resources'` — tests null state edge case.

**why it holds:** snapshot must handle null remote state (resource doesn't exist yet). research showed how extant tests handle this.

---

## summary

| research | recommendations | leveraged | omitted | gap |
|----------|-----------------|-----------|---------|-----|
| prod code | 8 | 8 | 0 | none |
| test code | 7 | 7 | 0 | none |

**reflection:** the research phase identified extant patterns that the blueprint leverages directly. no new patterns were invented — the feature slots into extant structure. this is a sign of good research: it found the seams where new functionality fits naturally.

the key insight from research was pattern.3 (planChanges) — knowledge that `remoteState` exists before `omitReadonly` is applied. this pinpointed the exact intervention point. all else follows from leverage of extant infrastructure.
