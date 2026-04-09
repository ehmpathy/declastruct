# self-review r3: has-questioned-questions

fresh eyes on the triaged questions.

---

## current state of questions

after r2, the vision has:

| section | count | status |
|---------|-------|--------|
| assumptions (verified) | 3 | all verified with code refs |
| decisions made | 4 | all answered via logic |
| questions for wisher | 1 | properly marked [wisher] |
| must research | 0 | confirmed none needed |

---

## verification: are all questions triaged?

### re-read the entire vision for hidden questions

**before/after story:** no questions — concrete example

**usecases table:** no questions — derived from wish + reasonable extensions

**contract section:** no questions — shows v1 vs future clearly

**output shape:** no questions — shows v1 minimum + conditional variant

**timeline:** no questions — verified against code

**mental model:** no questions — analogies and terminology defined

**evaluation tables:** no questions — honest assessment

**pit of success:** no questions — edgecases handled

**open questions section:** properly structured with 1 question for wisher

**what is awkward:** only future scope item left (not a question, it's deferred scope)

---

## the one question left

**is wished[] needed in v1?**

**why this must go to wisher:**
- this is a SCOPE decision, not a TECHNICAL decision
- we can build either way
- only the wisher knows the priority/urgency
- our recommendation is documented (start with remote[] only)

**why we can't answer it ourselves:**
- "ideally" language suggests nice-to-have, not must-have
- but the wisher might have usecases we don't know about
- they might want wished[] for cross-check debug

**verdict:** correctly marked [wisher]. cannot be answered via logic or code.

---

## are there any questions we should ADD?

scanned for implicit questions we haven't asked:

1. **should --save be opt-in or opt-out?** — already decided: opt-in (only if flag present)

2. **what if the write fails?** — not a question, it's an implementation detail (fail the plan)

3. **should we validate the snapshot against a schema?** — not a v1 concern, snapshot is internal output

4. **what version format for the snapshot?** — not asked, could be future consideration
   - for now, no version field is needed
   - if schema changes, we can add version later
   - **decision:** no version field in v1 (YAGNI)

---

## summary

| check | result |
|-------|--------|
| all questions triaged? | yes |
| triage categories used correctly? | yes |
| hidden questions surfaced? | yes (found 1, decided: no version field in v1) |
| last question properly marked [wisher]? | yes |

the question triage is complete.
