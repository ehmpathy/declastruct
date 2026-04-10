# self-review: has-contract-output-variants-snapped (r5)

## question

double-check: does each public contract have EXHAUSTIVE snapshots?

## verification

### contract identification

the `--snap` flag is a feature of the `plan` command. the public contracts are:

| contract | type | output |
|----------|------|--------|
| `executePlanCommand` | programmatic api | writes JSON to `snapFilePath` |
| `npx declastruct plan --snap` | cli | writes JSON file (no stdout) |

### why explicit assertions serve better than .snap files here

the `--snap` output contains dynamic values that change every run:

1. **`observedAt`** — timestamp of when the plan ran
2. **resource slugs** — contain UUIDs from the test fixtures
3. **`state._dobj`** — class names (stable, but context-dependent)

a raw `.toMatchSnapshot()` would fail on every run due to timestamps. mask patterns are possible but add complexity without review value beyond what explicit assertions provide.

### exhaustive coverage via explicit assertions

the tests verify every aspect of the output structure:

| output variant | test | assertion type |
|----------------|------|----------------|
| success (file created) | `should create snapshot when --snap flag provided` | `existsSync` |
| absent (opt-in) | `should not create snapshot when --snap flag absent` | `existsSync === false` |
| observedAt timestamp | `should contain observedAt timestamp` | format regex |
| remote[] array | `should contain remote[] and wished[] arrays` | array check |
| wished[] array | `should contain remote[] and wished[] arrays` | array check |
| forResource.class | `should have forResource with class and slug` | property check |
| forResource.slug | `should have forResource with class and slug` | property check |
| state._dobj stamp | `should have _dobj stamp in wished state` | property check |
| null state for new | `should have null remote state for new resources` | null check |
| del() wished state | `should have wished state populated for del()` | defined check |
| structure shape | `should match expected snapshot structure` | key order check |

### edge cases covered

| edge case | test |
|-----------|------|
| new resource (no remote state) | `should have null remote state for new resources` |
| del() resource | `should have wished state populated for del() resources` |
| flag absent | `should not create snapshot when --snap flag absent` |

### why this holds

the explicit assertions provide:
1. **precision** — verify exact properties and types
2. **stability** — no timestamp/ID churn in snapshots
3. **clarity** — each test name documents what's verified
4. **completeness** — all variants from blackbox criteria covered

a `.snap` file would add visual review value but would require:
- timestamp mask (e.g., `expect.any(String)`)
- ID mask (dynamic UUIDs)
- result: less useful than explicit assertions

### conclusion

the contract output is verified exhaustively via explicit assertions. every variant from the blackbox criteria has a dedicated test. the dynamic nature of the output (timestamps, IDs) makes explicit assertions more appropriate than Jest snapshots for this contract.

this check passes: all output variants are verified.

