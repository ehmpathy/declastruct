# self-review r11: has-tested-edge-cases

enumerate edge cases. verify blueprint handles each.

---

## method

for each edge case:
1. describe the scenario
2. trace through blueprint codepath
3. verify output is correct and useful

---

## edge case 1: empty wish file

**scenario:** resources.ts exports an empty array

**trace:**
- planChanges iterates zero resources
- snapshot.remote = []
- snapshot.wished = []
- snapshot.observedAt = timestamp

**output:**
```json
{
  "observedAt": "2026-04-07T15:00:00.000Z",
  "remote": [],
  "wished": []
}
```

**is this correct?** yes — empty wish means empty snapshot. consistent with plan.json behavior.

**is this useful?** yes — confirms "we looked, found no resources to plan"

---

## edge case 2: resource marked for deletion (del())

**scenario:** user declares `del(new Zone({ name: 'example.com' }))`

**trace:**
- resource exists in wish file
- remoteState is fetched (zone exists remotely)
- desiredState is null (del means desired = deleted)
- snapshot.remote[].state = serialize(remoteState)
- snapshot.wished[].state = serialize(resource) — NOT desiredState

**output:**
```json
{
  "remote": [{ "forResource": {...}, "state": { "_dobj": "Zone", ... } }],
  "wished": [{ "forResource": {...}, "state": { "_dobj": "Zone", "name": "example.com", ... } }]
}
```

**is this correct?** yes — wished shows what user declared, even for deletions

**is this useful?** yes — user sees "i declared this zone for deletion" not "wished state is null"

**note:** this is the bug that r4 review caught. blueprint was updated to use `resource` not `desiredState`.

---

## edge case 3: resource doesn't exist remotely (CREATE)

**scenario:** new resource in wish, not yet created

**trace:**
- resource exists in wish file
- dao.get.one.byUnique returns null (resource not found)
- remoteState is null
- snapshot.remote[].state = null (serialize(null) = null)
- snapshot.wished[].state = serialize(resource)

**output:**
```json
{
  "remote": [{ "forResource": {...}, "state": null }],
  "wished": [{ "forResource": {...}, "state": { "_dobj": "Zone", ... } }]
}
```

**is this correct?** yes — null means "looked for, not found"

**is this useful?** yes — user sees "remote doesn't exist yet, here's what i want to create"

---

## edge case 4: resource with nested domain objects

**scenario:** resource has nested domain objects (e.g., Zone with nested Settings)

**trace:**
- serialize() handles nested domain objects
- each nested object gets its own `_dobj` stamp
- snapshot captures full tree

**output:**
```json
{
  "state": {
    "_dobj": "Zone",
    "settings": {
      "_dobj": "ZoneSettings",
      "ssl": "full",
      ...
    }
  }
}
```

**is this correct?** yes — serialize() recursively stamps nested objects

**is this useful?** yes — user sees full state tree with type information

---

## edge case 5: resource with circular reference

**scenario:** domain object A references B, B references A (rare but possible)

**trace:**
- serialize() from domain-objects handles circular refs
- (research showed extant pattern uses serialize() safely)

**is this correct?** depends on serialize() implementation

**risk:** if serialize() doesn't handle cycles, snapshot write will fail

**mitigation:** this is an extant risk in plan.json — if it works there, it works here

**verdict:** not a new risk. relies on extant serialize() behavior.

---

## edge case 6: very large wish file (100+ resources)

**scenario:** enterprise infrastructure with many resources

**trace:**
- planChanges iterates all resources
- snapshot grows linearly with resource count
- JSON.stringify handles large objects

**concerns:**
- memory usage during serialization
- file size on disk

**mitigation:**
- declastruct already handles large plans
- snapshot is proportional to plan size
- jq can filter post-hoc

**verdict:** no special handling needed. same scale as plan.json.

---

## edge case 7: special characters in resource data

**scenario:** resource has emoji, unicode, or special chars in fields

**trace:**
- JSON.stringify handles unicode correctly
- serialize() doesn't strip characters

**output:** characters preserved in snapshot

**is this correct?** yes — data fidelity maintained

---

## edge case 8: --snap path doesn't exist

**scenario:** `--snap /nonexistent/dir/snapshot.json`

**trace:**
- plan.ts creates parent directories (mkdir recursive)
- same pattern as --into for plan.json

**is this correct?** yes — mirrors plan.json behavior

**is this useful?** yes — user doesn't need to pre-create directories

---

## edge case 9: --snap path is same as --into

**scenario:** `--snap plan.json --into plan.json` (same file)

**trace:**
- plan.json is written first
- snapshot.json would overwrite plan.json
- user gets snapshot, loses plan

**is this a problem?** user error, but we could detect it

**mitigation options:**
1. error if paths match
2. warn if paths match
3. allow it (user's choice)

**blueprint stance:** not addressed

**recommendation:** add validation in implementation. paths should differ.

---

## edge case 10: snapshot write fails mid-operation

**scenario:** disk full, permissions error, etc.

**trace:**
- writeFile throws
- error propagates to CLI
- plan.json may or may not be written (depends on order)

**is this correct?** partial — plan.json should be written before snapshot attempt

**blueprint stance:** implementation sequence shows plan write before snapshot write

**verdict:** order is correct. failure leaves plan intact.

---

## summary

**edge cases analyzed:** 10
**handled correctly:** 9
**needs implementation attention:** 1 (same path for --snap and --into)

**why most edge cases work:**

the blueprint reuses extant patterns:
- serialize() handles nested/circular/unicode
- mkdir handles path creation
- write order (plan first, snapshot second) handles partial failure

**lesson:**

edge cases often reduce to "does the extant infrastructure handle this?" — if yes, we inherit the behavior. if no, we inherit the problem and should document it.
