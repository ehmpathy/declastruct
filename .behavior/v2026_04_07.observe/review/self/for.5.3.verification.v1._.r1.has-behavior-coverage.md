# self-review: has-behavior-coverage

## question

double-check: does the verification checklist show every behavior from wish/vision has a test?

## verification

### behaviors from wish (0.wish.md)

| behavior | test | location |
|----------|------|----------|
| --snap flag outputs full remote and wished state | ✅ | plan.integration.test.ts:333-347 |
| observedAt timestamp at top | ✅ | plan.integration.test.ts:318-331 |
| remote[] contains full serialized state | ✅ | plan.integration.test.ts:333-347 |
| wished[] contains declared state | ✅ | plan.integration.test.ts:333-347 |

### behaviors from vision (1.vision.md)

| behavior | test | location |
|----------|------|----------|
| --snap creates snapshot file | ✅ | plan.integration.test.ts:292-300 |
| snapshot contains observedAt timestamp | ✅ | plan.integration.test.ts:318-331 |
| snapshot contains remote[] with full state | ✅ | plan.integration.test.ts:333-347 |
| snapshot contains wished[] with declared state | ✅ | plan.integration.test.ts:333-347 |
| remote[].state is null for new resources | ✅ | plan.integration.test.ts:390-406 |
| snapshot not created when --snap absent | ✅ | plan.integration.test.ts:303-316 |

### behaviors from blackbox criteria (2.1.criteria.blackbox.md)

| usecase | behavior | test | location |
|---------|----------|------|----------|
| usecase.1 | snapshot file created | ✅ | line 292-300 |
| usecase.1 | observedAt present | ✅ | line 318-331 |
| usecase.1 | remote[] present | ✅ | line 333-347 |
| usecase.1 | wished[] present | ✅ | line 333-347 |
| usecase.2 | forResource.class | ✅ | line 349-372 |
| usecase.2 | forResource.slug | ✅ | line 349-372 |
| usecase.2 | state serialized | ✅ | line 333-347 |
| usecase.2 | _dobj stamp | ✅ | line 374-388 |
| usecase.3 | wished forResource | ✅ | line 367-372 |
| usecase.3 | wished _dobj | ✅ | line 374-388 |
| usecase.4 | null state for new | ✅ | line 390-406 |
| usecase.5 | scope matches plan | ✅ | implicit in all tests |
| usecase.6 | opt-in (no snap) | ✅ | line 303-316 |
| usecase.6 | opt-in (with snap) | ✅ | line 292-300 |
| usecase.7 | del() has wished | ✅ | line 408-454 |

## conclusion

all behaviors from wish, vision, and blackbox criteria are covered by tests in `src/contract/cli/plan.integration.test.ts`. the verification checklist in `5.3.verification.v1.i1.md` accurately reflects this coverage.

no gaps found. no fixes required.
