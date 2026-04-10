# self-review r2: has-questioned-assumptions

fresh eyes, fresh assumptions to question.

---

## hidden assumptions found

### 1. the example assumes Cloudflare

**what we assumed:** the before/after story uses "DeclaredCloudflareDomainZone"

**what if the opposite were true?**
- declastruct is provider-agnostic (works with any API)
- a user might not use Cloudflare
- the example could confuse users into thinking this is Cloudflare-specific

**evidence from code:**
- declastruct works with any `DeclastructProvider`
- the test fixtures use `DemoResource`, not Cloudflare

**verdict:** acceptable. the example needs to be concrete to be useful. Cloudflare is just an example — the pattern applies to any provider. no change needed.

---

### 2. --save only works with plan command

**what we assumed:** `npx declastruct plan --save`

**did the wisher say this?** yes, the wish specifically shows:
```sh
npx declastruct plan --wish resources.ts --into plan.json --observe observe.json
```

**what if --save also worked with apply?**
- `apply` runs `plan` internally first
- could save snapshot during apply too
- but `apply` has side effects — the "before" snapshot would still be useful

**verdict:** holds. v1 is plan-only (matches wish). apply support could come later.

---

### 3. snapshot is a separate file from plan

**what we assumed:** `--save snapshot.json` creates a new file

**what if snapshot were part of plan.json?**
- plan.json would get bigger
- single file might be simpler (one artifact to track)
- but plan.json has a defined schema — adding raw remote state changes it

**did the wisher say this?** yes:
```sh
--into plan.json --observe observe.json
```
two separate files.

**verdict:** holds. separate files match the wish. keeps plan.json schema stable.

---

### 4. output format is JSON only

**what we assumed:** snapshot is JSON

**what if users wanted YAML, CSV, or other formats?**
- JSON is machine-readable and human-readable
- jq works with JSON
- other formats would add complexity

**evidence from wish:**
```json
"observed": [...]
```
the wish shows JSON examples.

**verdict:** holds. JSON is the right choice for v1. format options could come later if needed.

---

### 5. the "aha moment" assumes readonly is the problem

**what we assumed:** users want --save to debug readonly fields

**what if the problem is different?**
- unexpected API response shape
- auth/permission issues
- API rate limits
- resource not found

**does the snapshot help with these?**
- unexpected shape: YES, full state is visible
- auth issues: NO, would show null or error (but error handling is separate)
- rate limits: NO, that's a separate problem
- resource not found: YES, state would be null

**verdict:** holds. readonly debugging is the primary usecase, but snapshot helps with other debugging too.

---

### 6. all resources have readonly fields

**what we assumed:** every resource has a `readonly[]` array

**what if a resource has no readonly fields?**
- some simple resources might have all fields mutable
- `readonly[]` would be an empty array `[]`
- this is correct — empty means "no readonly fields"

**verdict:** holds. empty array is the right representation for "no readonly fields".

---

### 7. users understand "readonly" in this context

**what we assumed:** "readonly" is clear terminology

**what if it's confusing?**
- "readonly" in code usually means "can't change variable"
- here it means "field that declastruct won't update (API-managed)"
- could be called "computed", "managed", "immutable", "intrinsic"

**evidence from domain-objects:**
- `static readonly = [...]` is the standard pattern
- it's established terminology in the codebase

**verdict:** holds. "readonly" is established. add clarification in docs if users are confused.

---

### 8. snapshot includes ALL resources, not just changed ones

**what we assumed:** snapshot includes every resource in the wish

**what if users only want resources with changes?**
- smaller snapshot
- less noise
- but loses the "full picture" for audit

**what did the wisher say?** the wish shows "observed" as an array of all looked-up resources.

**verdict:** holds. full snapshot is more useful for audit and debugging than filtered snapshot.

---

### 9. the file naming convention

**what we assumed:** user picks the filename (`--save snapshot.json`)

**what if declastruct should auto-generate the filename?**
- `--save` without argument could default to `observed-{timestamp}.json`
- but then users need to find the file
- explicit is better than implicit

**verdict:** holds. user-specified filename is simpler and more predictable.

---

## summary

| assumption | verdict | why |
|------------|---------|-----|
| Cloudflare example | acceptable | concrete example needed, pattern is generic |
| plan command only | holds | matches wish, apply later |
| separate file | holds | wish shows two files |
| JSON format | holds | wish shows JSON |
| readonly is the problem | holds | primary usecase, helps others too |
| all resources have readonly | holds | empty array for none |
| "readonly" terminology | holds | established in domain-objects |
| all resources in snapshot | holds | full picture for audit |
| user-specified filename | holds | explicit > implicit |

no issues found in this round. all assumptions hold with justification.
