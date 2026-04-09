# self-review: has-questioned-requirements

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/1.vision.md`

---

## requirement 1: `--` separator syntax

**who said?** the wish file explicitly requests this syntax.

**evidence?** well-established pattern in npm, docker, yarn. users already know it.

**if we didn't?** users continue with env vars or wrapper scripts (current workaround).

**scope?** appropriate — minimal syntax for arg passthrough.

**simpler way?** no. this is already the simplest CLI pattern for args to forward.

**verdict: holds.** the `--` separator is the right choice.

---

## requirement 2: three contract options (A, B, C)

**who said?** i proposed all three in the vision.

**evidence?** the wish mentions two approaches:
- "args after -- are passed to getProviders() and getResources() as second parameter" (option A)
- "or appended to process.argv before import of the wish file" (option B)
- "alternative: declastruct could parse known flags like --env and set them as environment variables" (option C)

**if we didn't present all three?** we'd need to pick one upfront without tradeoff exploration.

**scope?** possibly over-engineered. the wish already leans toward option B or C.

**simpler way?** yes — recommend option B as primary, note option C as future enhancement.

**verdict: adjust.** the vision should recommend a primary approach rather than present three equal options. option B (process.argv injection) is most node-idiomatic and avoids the duplication problem noted in "what is awkward?"

**fix applied:** none yet — flagged for wisher decision. the vision already asks this as a question, so the options are correctly framed as questions that need input.

---

## requirement 3: both getResources and getProviders receive args

**who said?** the wish mentions both explicitly.

**evidence?** both may need env-specific configuration (credentials, endpoints).

**if we didn't?** one function would need to export state for the other (awkward state-share).

**scope?** appropriate if we choose option A. unnecessary with option B or C (global state).

**simpler way?** option B makes args globally available via process.argv, which dissolves this requirement.

**verdict: conditional.** this requirement only applies to option A. if we choose option B or C, it dissolves.

---

## requirement 4: apply command supports `--` args

**who said?** i proposed this in the vision's day-in-the-life example.

**evidence?** the wish doesn't mention apply explicitly, only plan.

**if we didn't?** apply would use only the plan file state (simpler, more predictable).

**scope?** potentially over-scoped. the wish focuses on plan.

**simpler way?** yes — apply could ignore `--` args entirely and use plan's captured state.

**verdict: question.** this is correctly flagged as an open question in the vision. the plan/apply arg mismatch section highlights the risk.

---

## requirement 5: pit of success edgecases

**who said?** i added these based on defensive design principles.

**evidence?** standard CLI behavior for unknown flags.

**if we didn't?** users might hit unclear errors on edge cases.

**scope?** appropriate — these are minimal safety checks.

**verdict: holds.** edgecase treatment is correctly scoped.

---

## summary

| requirement | status | action |
|------------|--------|--------|
| `--` separator | holds | none |
| three options (A,B,C) | holds but recommend | wisher decides; vision correctly asks |
| args to both functions | conditional | depends on option choice |
| apply supports args | question | vision correctly flags uncertainty |
| pit of success | holds | none |

**overall:** the vision is correctly scoped. it presents options rather than premature commitment, and flags the right questions for the wisher. no changes needed before review.
