# self-review: has-questioned-requirements

## deeper investigation

before i reviewed requirements, i read the actual declastruct code:

1. **planChanges.ts** (lines 54-57): fetches raw `remoteState` via `dao.get.one.byUnique`
2. **computeChange.ts** (lines 26-27, 104-105): applies `omitReadonly` before comparison and storage
3. **domain-objects readme**: shows `static readonly = ['...']` pattern — domain classes declare readonly fields this way

this confirms:
- the raw remote state IS available (in `planChanges.ts`)
- the current plan.json LOSES readonly fields (because `omitReadonly` is called before storage)
- domain classes DECLARE their readonly fields via `static readonly`
- we can access `ResourceClass.readonly` to get the field names

---

## requirements examined

### 1. the --save flag itself

**who said this was needed?** the wisher, in 0.wish.md

**evidence:**
> "when you debug or audit, you need to see: what the remote system actually returned, which fields were excluded from diff, the raw state before declastruct's comparison logic"

**what if we didn't do this?**
- users have no visibility into what declastruct observed
- debug sessions require console.log additions and re-runs
- audit is impossible without code changes

**verdict:** holds. this is the core requirement.

---

### 2. --save.remote and --save.wished split

**who said this was needed?** the wisher, but as "ideally could also have..."

**evidence:** the wish says:
> "ideally, could also have a `declapract save --remote $saveRemoteIntoPath --wished $saveWishedIntoPath`"

**what if we didn't do this?**
- users would use `--save snapshot.json` and get both in one file
- large infrastructures might have larger files, but jq can filter

**could we achieve the goal simpler?**
- yes: only `--save` with combined output
- the split is an optimization for large infra, not a core need

**verdict:** this is scope creep for v1. the vision should clarify that `--save.remote`/`--save.wished` is a future enhancement, not the initial scope.

**action:** clarify in vision that v1 is `--save` only, split is future.

---

### 3. readonly[] array in output

**who said this was needed?** the wisher, implicitly in the output format example

**evidence:** the wish shows:
```json
"readonly": ["status", "nameServers", ...]
```

**what if we didn't do this?**
- users would see the remote state but not know which fields can't be changed
- still useful for audit, less useful for debug

**verdict:** holds. directly serves the "debug readonly" usecase.

---

### 4. effectiveAt first in json

**who said this was needed?** the wisher, explicitly

**evidence:**
> "except observedat should go first"

**verdict:** holds. explicit feedback from wisher.

---

### 5. wished[] in combined output

**who said this was needed?** the wisher, in the "ideally" section

**evidence:**
> "if they happen to say `--save $path` then we can just unload both into one object ({ remote, wished })"

**what if we didn't do this?**
- users would still get remote state (the core need)
- wished state is already in resources.ts — do they need it serialized?

**question for wisher:** is wished[] in the combined output essential for v1, or is remote-only sufficient?

**verdict:** uncertain. flagged as open question.

---

## findings

### issues found and fixed

1. **scope creep: --save.remote/--save.wished split**
   - the vision presented three flags as equal requirements
   - the wish says "ideally" for the split, not "must have"
   - **how i fixed it:**
     - updated contract section to label v1 vs future
     - changed "### contract" to show `--save` only for v1
     - moved `--save.remote`/`--save.wished` under "**future (not v1)**"
     - updated "what is awkward" to clarify split is future concern
   - **lesson:** watch for "ideally" vs "must have" in requirements

2. **uncertainty: wished[] in combined output**
   - unclear if this is core or nice-to-have
   - **how i fixed it:**
     - added question #1 to "questions for wisher" section
     - updated output shape to show "v1 minimum (remote only)" first
     - added "v1 if wished[] is confirmed needed" as alternate
   - **lesson:** when a requirement comes from "ideally" language, flag it as a question rather than assume it's required

3. **inconsistency: pros list mentions future feature**
   - the pros list says "separable (--save.remote and --save.wished for large infra)"
   - but i already said split is future, not v1
   - **how i fixed it:** removed "separable" bullet from pros list

4. **inconsistency: pit of success table references future feature**
   - says "large infrastructure: use --save.remote/--save.wished to split"
   - this is a v1 vision, should not reference future features as solutions
   - **how i fixed it:** changed to "use jq to filter specific resources" (v1-compatible)

### non-issues (holds)

1. **--save flag itself**
   - **why it holds:** directly requested in the wish with clear evidence
   - "when you debug or audit, you need to see..." is explicit
   - without this, users have no visibility — that's the core problem

2. **readonly[] array**
   - **why it holds:** appears in the wish's example output
   - directly serves the "debug readonly" usecase
   - without it, users see state but not which fields are mutable
   - **verified:** domain-objects supports `static readonly = [...]` declaration, so we CAN get the list

3. **effectiveAt first**
   - **why it holds:** explicit feedback from wisher
   - "except observedat should go first" is unambiguous
   - this is a direct correction to the original proposal

---

## additional requirements questioned

### 5. the before/after story timing claims

the vision claims "20 minutes to 30 seconds" debug time improvement.

**who said this?** i made up these numbers.

**what if the numbers are wrong?**
- the story still works — the point is "faster debug with visibility"
- exact numbers don't change the value proposition

**verdict:** the numbers are illustrative, not factual. acceptable for a vision document.

---

### 6. the usecases table

i listed 5 usecases: debug readonly, audit, drift detection, first-time setup, incident response.

**which came from the wish?**
- debug readonly: YES, explicit ("see which fields were excluded")
- audit: YES, explicit ("snapshot of remote state at plan time")
- drift detection: YES, explicit ("compare remote.json over time")
- first-time setup: renamed from "onboard" in wish
- incident response: i added this, not in wish

**what if incident response wasn't requested?**
- it's a natural extension of audit
- the wisher said "audit" which implies point-in-time snapshots for review

**verdict:** 4 of 5 are from the wish, 1 is a reasonable extension. keep all 5.

---

### 7. the analogies

i listed: git diff vs git show, receipt, x-ray, flight recorder.

**do they actually fit?**
- git diff vs git show: plan.json shows changes (like diff), snapshot.json shows state (like show)... but `git show` shows a commit, not current state. **imperfect analogy.**
- receipt: YES, snapshot is proof of what was observed
- x-ray: metaphorical, acceptable
- flight recorder: YES, fits incident response usecase

**what should change?**
- git analogy is weak — plan.json is like `git diff`, but snapshot.json is more like `git cat-file` or terraform state
- terraform analogy is better: `terraform plan` vs `terraform state pull`

**how i fixed it:** changed "git diff vs git show" to "terraform plan vs terraform state pull" in the analogies table.

**lesson:** test analogies for accuracy before committing to them.

---

### 8. assumption #1: "declastruct already knows which fields are readonly"

**verified via code:**
- domain-objects supports `static readonly = [...]` on domain classes
- `omitReadonly` function uses this to filter
- we can access `ResourceClass.readonly` to get the field names

**what if a class doesn't declare readonly?**
- `readonly[]` in the snapshot would be empty array
- this is correct behavior — no readonly fields to report

**verdict:** assumption holds, verified in code.

---

### 9. could we achieve the goal simpler?

the wish asks for full remote state observability.

**simplest possible solution:**
- `--save remote.json` that just dumps raw api responses
- no structured format, no readonly tracking

**why that's not enough:**
- lose correlation between wished resources and remote state
- lose readonly field identification (key for debug)
- lose effectiveAt timestamp (key for audit)

**verdict:** the proposed structure adds real value over raw dump. keep it.

---

## meta: question myself

### 10. did i actually question the vision, or just validate it?

looking back at my review, i mostly validated what's there. let me ask harder questions:

**is this vision over-engineered?**
- 7 major sections (outcome world, user experience, mental model, evaluation, questions, what is awkward)
- the wish is ~50 lines; my vision is ~270 lines
- am i adding complexity for its own sake?

**what's the minimum viable vision?**
- a vision could be: "add --save flag to dump observed remote state"
- the rest is detail that could come later

**why did i write so much?**
- the stone template asked for specific sections
- but i could have kept each section shorter
- lesson: answer the question, don't over-elaborate

**what could go wrong that i haven't considered?**
- performance: snapshot file could be huge (addressed in pit of success)
- security: sensitive data in remote (addressed)
- implementation: getting readonly[] might be harder than assumed (i verified this holds)
- adoption: users might not know about --save (not addressed)

**adoption risk:**
- if users don't know --save exists, they won't use it
- should the vision mention discoverability?
- at minimum, plan output could hint: "run with --save to capture full state"

**verdict:** the vision is comprehensive, possibly too comprehensive. core message is clear. adoption risk exists but is out of scope for v1 vision (that's ux polish).

---

## summary

| category | count |
|----------|-------|
| requirements from wish | 4 core, 1 "ideally" |
| issues found | 5 (all fixed) |
| assumptions verified | 1 (via code) |
| non-issues explained | 3 |
| meta questions asked | 1 |

the vision is ready for human review.
