# self-review r10: has-tested-mental-model

walk through user scenarios. verify the mental model holds.

---

## method

selected representative user scenarios and walked through:
1. what the user does
2. what they expect
3. what the blueprint produces
4. whether expectation matches production

---

## scenario 1: debug why field wasn't updated

**user story:** "i changed `paused: true` but the zone still shows `paused: false` after apply. why?"

**what user does:**
```sh
npx declastruct plan --wish resources.ts --into plan.json --snap snapshot.json
cat snapshot.json | jq '.remote[0].state'
```

**user expects:** to see the full remote state, find `paused` field value

**what blueprint produces:**
```json
{
  "forResource": { "class": "DeclaredCloudflareDomainZone", "slug": "..." },
  "state": {
    "_dobj": "DeclaredCloudflareDomainZone",
    "id": "abc123",
    "name": "example.com",
    "paused": false,
    ...
  }
}
```

**does it match?** yes — user sees `"paused": false` in remote, compares to wished state

**mental model verified:** snapshot shows what remote looks like, user can debug

---

## scenario 2: audit what was observed at plan time

**user story:** "production incident: we need to prove what declastruct saw when it planned"

**what user does:**
```sh
cat snapshot.json | jq '.observedAt'
cat snapshot.json | jq '.remote'
```

**user expects:** timestamp + full state at that moment

**what blueprint produces:**
```json
{
  "observedAt": "2026-04-07T15:00:00.000Z",
  "remote": [ ... full states ... ]
}
```

**does it match?** yes — observedAt is the temporal anchor, remote is the evidence

**mental model verified:** snapshot is a receipt with timestamp

---

## scenario 3: new resource (no remote state yet)

**user story:** "i added a new zone to resources.ts. what does snapshot show?"

**what user does:**
```sh
npx declastruct plan --wish resources.ts --into plan.json --snap snapshot.json
cat snapshot.json | jq '.remote[] | select(.forResource.slug | contains("newzone"))'
```

**user expects:** entry exists but state is null (resource doesn't exist remotely yet)

**what blueprint produces:**
```json
{
  "forResource": { "class": "DeclaredCloudflareDomainZone", "slug": "...newzone..." },
  "state": null
}
```

**does it match?** yes — forResource identifies what was looked up, state is null

**mental model verified:** null means "looked for but not found"

---

## scenario 4: compare remote vs wished

**user story:** "i want to see what cloudflare has vs what i declared"

**what user does:**
```sh
cat snapshot.json | jq '.remote[0].state'
cat snapshot.json | jq '.wished[0].state'
diff <(jq '.remote[0].state' snapshot.json) <(jq '.wished[0].state' snapshot.json)
```

**user expects:** remote shows API values, wished shows declared values

**what blueprint produces:**
- remote[].state = full API response (all fields)
- wished[].state = user's declaration (subset of fields)

**does it match?** yes — diff shows what's in remote but not in wished (readonly fields)

**mental model verified:** remote vs wished enables comparison

---

## scenario 5: drift detection over time

**user story:** "i want to track if remote state drifts between runs"

**what user does:**
```sh
# run 1
npx declastruct plan --wish resources.ts --into plan.json --snap snapshot-2026-04-07.json

# run 2 (later)
npx declastruct plan --wish resources.ts --into plan.json --snap snapshot-2026-04-08.json

# compare
diff snapshot-2026-04-07.json snapshot-2026-04-08.json
```

**user expects:** deterministic output enables meaningful diff

**what blueprint produces:**
- same resource order (iteration order matches wish file)
- same field order (serialize() is deterministic)
- observedAt differs (as expected)

**does it match?** yes — diff shows what changed between runs

**mental model verified:** snapshot is diffable for drift detection

---

## scenario 6: no --snap flag

**user story:** "i just want to plan, no snapshot"

**what user does:**
```sh
npx declastruct plan --wish resources.ts --into plan.json
ls snapshot.json  # should not exist
```

**user expects:** plan works, no snapshot file created

**what blueprint produces:** plan.json only, no snapshot.json

**does it match?** yes — opt-in behavior respected

**mental model verified:** --snap is opt-in, absence means no snapshot

---

## mental model gaps: NONE FOUND

i walked through 6 scenarios. each produced output that matched user expectation.

the mental model holds:
- snapshot = receipt of what declastruct observed
- remote = what API returned
- wished = what user declared
- observedAt = when it happened
- null state = resource not found remotely

---

## summary

**scenarios tested:** 6
**mental model gaps:** 0

**why the mental model holds:**

the design is symmetrical:
- --wish input → wished[] output
- remote API call → remote[] output
- when called → observedAt timestamp

users can reason about the snapshot without documentation:
- "remote" means what's remote
- "wished" means what i wished
- "observedAt" means when observed

**lesson:**

if you have to explain how to use the output, the mental model is broken. the snapshot is self-explanatory.
