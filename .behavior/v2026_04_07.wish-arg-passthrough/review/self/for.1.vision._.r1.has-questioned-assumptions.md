# self-review: has-questioned-assumptions

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/1.vision.md`

---

## assumption 1: users want multi-environment support

**what do we assume?** that the primary usecase is environment selection (`--env test/prod`).

**evidence?** the wish uses `--env test` as the example.

**if the opposite were true?** users might want other flags entirely — verbose mode, filtered resources, custom config.

**did the wisher say this?** yes, explicitly: `--env test --verbose` in the wish example.

**verdict: holds.** the wish explicitly shows this usecase.

---

## assumption 2: process.argv injection is acceptable

**what do we assume?** that mutation of process.argv before import is safe and expected behavior.

**evidence?** this is standard node.js practice (many CLI tools do this).

**if the opposite were true?** some tools or tests might depend on process.argv state. mutation could cause side effects.

**did the wisher say this?** yes, explicitly: "or appended to process.argv before import."

**exceptions?** jest tests that check process.argv. workaround: document that test runners may need special setup.

**verdict: holds with caveat.** the approach is valid; document edge cases.

---

## assumption 3: both plan and apply need args

**what do we assume?** that apply command should also support `--` passthrough.

**evidence?** none from the wish. the wish only shows plan command.

**if the opposite were true?** apply could use only plan state — simpler, no mismatch risk.

**did the wisher say this?** no. the wish says "pass custom args to wish files" with only plan as example.

**verdict: incorrect assumption.** i extended scope beyond the wish. the vision should question whether apply needs this, not assume it does.

**fix applied:** the vision already flags this as an open question ("should apply also support `--` args?"). no change needed, but noted as an assumption to validate.

---

## assumption 4: args should be raw string arrays

**what do we assume?** that declastruct passes unparsed strings, user handles parse logic.

**evidence?** the wish shows option A (explicit parameter) with raw array.

**if the opposite were true?** declastruct could parse known flags (option C) and provide structured data.

**did the wisher say this?** yes to raw strings (option A). also yes to option C as "simpler for common cases."

**verdict: wisher is uncertain.** both approaches are valid per the wish. vision correctly presents both.

---

## assumption 5: backwards compatibility matters

**what do we assume?** that wish files without args param should continue to work.

**evidence?** standard library design practice. also, break changes = bad.

**if the opposite were true?** all wish files would need update after this feature ships.

**did the wisher say this?** not explicitly.

**verdict: valid assumption.** backwards compatibility is a baseline expectation for library features.

---

## assumption 6: the `--` separator requires no configuration

**what do we assume?** that `--` is always the separator, with no option to customize.

**evidence?** universal convention in CLI tools.

**if the opposite were true?** users might want a different separator (e.g., `:::` or `--wish-args`).

**did the wisher say this?** the wish shows `--` but doesn't say it must be `--`.

**verdict: reasonable default.** no evidence users need alternatives. customization would add complexity without clear benefit.

---

## summary

| assumption | source | verdict |
|------------|--------|---------|
| multi-env usecase | wish | holds |
| process.argv mutation | wish | holds with caveat |
| apply needs args | junior inference | question (already flagged) |
| raw string arrays | wish | wisher uncertain |
| backwards compat | practice | valid |
| `--` is always separator | convention | reasonable default |

**overall:** most assumptions are grounded in the wish or standard practice. the apply-command assumption was correctly flagged as an open question in the vision.
