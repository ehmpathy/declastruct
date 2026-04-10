# self-review r2: has-questioned-questions

triage all open questions in the vision.

---

## questions triaged

### 1. is wished[] needed in v1?

**current state:** flagged as question for wisher

**can this be answered via logic now?** no — this is a scope decision only the wisher can make

**triage:** [wisher]

**action:** keep as question for wisher

---

### 2. should readonly[] be array or object?

**current state:** flagged as question for wisher

**can this be answered via logic now?** YES

**logic:**
- values are already in `state`
- object like `{ "status": "active" }` would duplicate data from state
- array like `["status"]` is sufficient — just names the fields
- declastruct already uses arrays for field lists (e.g., `static readonly = [...]`)

**triage:** [answered]

**answer:** array. values are in state, no duplication needed.

**action:** update vision to mark as answered, not question

---

### 3. should --save include remote-only resources?

**current state:** flagged as question for wisher

**can this be answered via logic now?** YES

**logic:**
- the wish shows `--observe` on the `plan` command
- plan only processes resources in the wish file
- resources that exist remotely but aren't in the wish aren't part of the plan
- scope should match plan.json (only wished resources)

**triage:** [answered]

**answer:** no, only resources in the wish. matches plan.json scope.

**action:** update vision to mark as answered

---

### 4. "remote" vs "observed" terminology

**current state:** in "what is awkward" section, has recommendation

**can this be answered via logic now?** YES

**logic:**
- "remote" is familiar IaC terminology (terraform, pulumi)
- "observed" describes what we did (we observed the state)
- the JSON key should be "remote" (public, familiar)
- docs can say "the remote state we observed"

**triage:** [answered]

**answer:** use "remote" in JSON, "observed" in prose

**action:** mark as decision (not question)

---

### 5. does wished[] include readonly fields?

**current state:** in "what is awkward" section

**can this be answered via logic now?** YES (if wished[] is in v1 at all)

**logic:**
- wished[] should show what the user declared
- the user might declare readonly fields (unknowingly)
- snapshot should reflect user intent
- diff logic already filters out readonly — snapshot doesn't need to

**triage:** [answered]

**answer:** yes, show what user wrote

**action:** mark as decision (not question)

---

## summary

| question | triage | action |
|----------|--------|--------|
| is wished[] needed in v1? | [wisher] | keep as question |
| readonly[] array vs object | [answered] | update vision |
| include remote-only resources? | [answered] | update vision |
| "remote" vs "observed" term | [answered] | mark as decision |
| wished[] include readonly? | [answered] | mark as decision |

---

## updates made

1. **moved questions 2, 3 from "questions for wisher" to "decisions made"**
   - readonly[] format: array (not object)
   - --save scope: only wished resources

2. **moved "remote vs observed" from awkward to decisions**
   - decision: "remote" in JSON, "observed" in prose

3. **moved "wished[] shape" from awkward to decisions**
   - decision: if included, show all declared fields

4. **updated assumptions section**
   - added verification notes (code references)
   - renamed to "assumptions (verified)"

5. **simplified "what is awkward" section**
   - only --save.remote/--save.wished split remains
   - added note pointing to decisions section
