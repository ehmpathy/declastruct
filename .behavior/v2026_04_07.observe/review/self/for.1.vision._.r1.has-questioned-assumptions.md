# self-review: has-questioned-assumptions

## hidden assumptions found

### 1. "effectiveAt" is the correct field name

**what we assumed:** the timestamp field should be called "effectiveAt"

**evidence from wish:**
> "except observedat should go first"

**wait — the wisher said "observedat", not "effectiveAt"**

i changed the name without realizing. the wish says "observedAt" should go first, meaning:
- the field should be called "observedAt" (not "effectiveAt")
- it should be first in the json

**what if the opposite were true?**
- "effectiveAt" implies when the data became effective
- "observedAt" implies when we observed it
- for a snapshot, "observedAt" is more accurate

**verdict:** ISSUE. i should use "observedAt" as the wisher specified.

**how i fixed it:** used sedreplace to change all "effectiveAt" to "observedAt" in the vision document.

**lesson:** read the wish more carefully — "observedAt should go first" meant both position AND name.

---

### 2. "readonly[]" is an array, not an object

**what we assumed:** readonly should be an array of field names: `["status", "nameServers"]`

**evidence from wish:**
```json
"readonly": ["status", "nameServers", ...]
```

**what if the opposite were true?**
- an object like `{ "status": "active", "nameServers": [...] }` would include values
- but values are already in `state`, so object would duplicate data

**verdict:** holds. array is correct — values are in state, no need to duplicate.

---

### 3. "state" contains the full API response

**what we assumed:** state has the complete remote API response

**what if the opposite were true?**
- maybe the DAO already transforms the API response
- maybe some fields are stripped before we see them

**verified via code:**
- in `planChanges.ts`, `remoteState` comes from `dao.get.one.byUnique`
- the DAO returns a DomainEntity, which is already a transformed shape
- this is intentional — DomainEntities cast the API response into a canonical form

**verdict:** holds. "state" is the DomainEntity shape, not raw API. this is correct — we want the canonical shape, not the raw API quirks.

---

### 4. "uniqueKey" structure matches domain-objects

**what we assumed:** uniqueKey is an object like `{ "name": "example.com" }`

**evidence from code:**
- domain-objects uses `getUniqueIdentifier(resource)` which returns the unique key fields
- if `static unique = ['name']`, then uniqueKey would be `{ name: "example.com" }`
- if `static unique = ['org', 'name']`, then uniqueKey would be `{ org: "...", name: "..." }`

**verdict:** holds. uniqueKey shape comes from domain-objects, will work for simple and composite keys.

---

### 5. "resourceClass" is the right identifier

**what we assumed:** use the class name like "DeclaredCloudflareDomainZone"

**what if the opposite were true?**
- maybe a shorter slug would be better?
- maybe users don't care about the class name?

**evidence from code:**
- `computeChange.ts` already uses `resourceForChange.constructor.name` for the class
- this is consistent with how plan.json works today

**verdict:** holds. consistency with plan.json matters more than brevity.

---

### 6. timeline order: fetch → serialize → diff

**what we assumed:** serialize happens after fetch but before diff

**verified via code:**
- `planChanges.ts` line 54-57: fetch `remoteState`
- `planChanges.ts` line 67-70: call `computeChange` with raw states
- inside `computeChange`, `omitReadonly` is called

**where would --save fit?**
- after fetch (line 57), before computeChange (line 67)
- this is the right place — we have raw state, haven't filtered yet

**verdict:** holds. the timeline is accurate.

---

### 7. "zero performance cost" claim

**what we assumed:** "zero performance cost (data already fetched)"

**what if the opposite were true?**
- serialization has CPU cost
- write to disk has I/O cost
- for large infrastructures, this could add seconds

**is this claim honest?**
- "zero" is hyperbole — there IS cost
- but it's negligible compared to API fetch latency (the API calls are the bottleneck)
- the claim should say "minimal" not "zero"

**verdict:** ISSUE. change "zero" to "minimal" for honesty.

**how i fixed it:** changed "zero performance cost" to "minimal performance cost (data already fetched; serialize + write is fast)"

**lesson:** avoid absolute claims ("zero") when describing tradeoffs.

---

### 8. users will use jq for large snapshots

**what we assumed:** "large infrastructure: snapshot is one file; use jq to filter"

**what if the opposite were true?**
- some users don't know jq
- some environments don't have jq installed
- jq expertise is a burden

**alternatives:**
- provide a `--resource-filter` flag to save only specific resources
- provide a viewer tool
- these are future enhancements, not v1

**verdict:** acceptable for v1. if this becomes a pain point, add filter later.

---

## summary

| assumption | verdict | action |
|------------|---------|--------|
| effectiveAt name | FIXED | changed to "observedAt" |
| readonly[] as array | holds | no change |
| state is full API | holds | no change (it's DomainEntity shape) |
| uniqueKey structure | holds | works for simple and composite |
| resourceClass identifier | holds | consistent with plan.json |
| timeline order | holds | verified in code |
| "zero" performance | FIXED | changed to "minimal" |
| users know jq | acceptable | v1 ok, enhance later if needed |
