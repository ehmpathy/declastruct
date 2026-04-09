# self-review r2: has-questioned-assumptions

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/1.vision.md`

---

## assumptions questioned

### 1. "users resort to" means workarounds are painful

- **what do we assume?** that env vars and wrapper scripts are suboptimal workarounds
- **evidence?** the wisher wrote "resort to" which implies reluctance
- **if opposite were true?** env vars work fine and this feature is unnecessary
- **did wisher say this?** yes, "resort to" implies pain
- **exceptions?** some users may prefer env vars for ci/cd simplicity
- **verdict:** holds — wisher's word choice indicates real pain

### 2. the `--` separator is universally understood

- **what do we assume?** users will recognize `--` as arg separator
- **evidence?** npm, docker, yarn all use this pattern
- **if opposite were true?** new cli users might be confused
- **did wisher say this?** yes, wisher explicitly used `--` in example
- **exceptions?** windows cmd users less familiar with `--`
- **verdict:** holds — standard convention, discoverability noted as con

### 3. three options are needed

- **what do we assume?** presenting A, B, C helps decision-make
- **evidence?** wisher mentioned both explicit param (A) and process.argv (B) and env vars (C)
- **if opposite were true?** just pick one and ship it
- **did wisher say this?** yes, wisher gave multiple approaches
- **exceptions?** analysis paralysis risk
- **verdict:** holds — wisher explicitly uncertain, vision correctly asks for input

### 4. aws s3bucket is a good example

- **what do we assume?** aws examples are relatable
- **evidence?** aws is common cloud provider
- **if opposite were true?** non-aws users might feel excluded
- **did wisher say this?** no, wisher's example was generic
- **exceptions?** declastruct is provider-agnostic
- **verdict:** questionable — could use more generic example
- **no fix:** examples are illustrative, not prescriptive

### 5. day-in-the-life scenario is representative

- **what do we assume?** the aws developer + ci/cd story is typical
- **evidence?** ci/cd is common use case
- **if opposite were true?** users might run declastruct ad-hoc, not in pipelines
- **did wisher say this?** no, wisher didn't describe workflow
- **exceptions?** single-env users, local-only usage
- **verdict:** questionable — story assumes ci/cd context
- **no fix:** story is illustrative, not limiting

### 6. sdk usage is secondary

- **what do we assume?** cli is primary interface
- **evidence?** all wish examples show cli
- **if opposite were true?** programmatic callers need explicit args mechanism
- **did wisher say this?** no — wisher only showed cli
- **exceptions?** jest tests, library integrations
- **verdict:** gap found — added question #6 about sdk usage

### 7. apply command scope is undecided

- **what do we assume?** the vision presents apply-args as question
- **evidence?** vision already flags this uncertainty
- **if opposite were true?** we could just say "apply ignores args"
- **did wisher say this?** no, wisher only mentioned plan
- **exceptions?** users who want different credentials at apply time
- **verdict:** correctly uncertain — flagged as question

### 8. backwards compatibility is assumed

- **what do we assume?** wish files without args should work
- **evidence?** standard library practice
- **if opposite were true?** break all wish files
- **did wisher say this?** no
- **exceptions?** major version bump could allow breaks
- **verdict:** holds — backwards compat is baseline expectation

---

## summary

| assumption | verdict | action |
|------------|---------|--------|
| "resort to" = pain | holds | none |
| `--` is understood | holds | none |
| three options needed | holds | none |
| aws example | questionable | no fix (illustrative) |
| ci/cd day-in-life | questionable | no fix (illustrative) |
| sdk is secondary | gap | added question #6 |
| apply scope undecided | correct | none |
| backwards compat | holds | none |

**fixes applied:**
- added question #6: "how do programmatic callers pass args?"
- added note to option B: "must inject before import"
- added to pit of success: "`--` separator stripped"
- clarified empty args is `[]` not undefined
- added note about proper parsers

**result:** all assumptions now surfaced and addressed.
