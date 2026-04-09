# self-review: has-critical-paths-frictionless (r8)

## question

double-check: are the critical paths frictionless in practice?

## critical paths from vision

the vision (1.vision.md) defines these critical paths:

| path | user goal | success looks like |
|------|-----------|-------------------|
| **cp1: plan with snap** | capture full state | one command, both outputs appear |
| **cp2: debug with jq** | inspect what api returned | `cat snapshot.json \| jq '.remote[0]'` shows full state |
| **cp3: audit timestamp** | prove when snapshot was taken | `observedAt` is first field, ISO format |
| **cp4: new resource state** | understand null remote | `state: null` for resources not yet created |

---

## cp1: plan with snap

### manual test

```sh
npx tsx ./bin/run plan \
  --wish src/.test/assets/wish.fixture.ts \
  --into /tmp/declastruct-test/plan.json \
  --snap /tmp/declastruct-test/snapshot.json
```

### output

```
🐢 declastruct plan

🐚 plan
   ├─ wish: src/.test/assets/wish.fixture.ts
   ├─ into: /tmp/declastruct-test/plan.json
   └─ snap: /tmp/declastruct-test/snapshot.json

🌊 resources: 2
   ├─ CREATE: 2
   ├─ UPDATE: 0
   ├─ KEEP: 0
   └─ DESTROY: 0

✨ plan written to /tmp/declastruct-test/plan.json
✨ snapshot written to /tmp/declastruct-test/snapshot.json
```

### friction? none

- command runs without error (exit code 0)
- both files created
- output confirms locations
- no extra configuration

---

## cp2: debug with jq

### manual test

```sh
cat /tmp/declastruct-test/snapshot.json | jq '.remote[0]'
```

### output

```json
{
  "forResource": {
    "class": "DemoResource",
    "slug": "DemoResource.e0b6f399-5040-4aa7-af2b-a388979a72aa.b9bfe71c"
  },
  "state": null
}
```

### friction? none

- jq parses the file without error
- structure matches vision: `forResource.class`, `forResource.slug`, `state`
- user can filter to specific resource instantly

---

## cp3: audit timestamp

### manual test

```sh
cat /tmp/declastruct-test/snapshot.json | jq '.observedAt'
```

### output

```
"2026-04-08T06:26:42.123Z"
```

### friction? none

- `observedAt` is first field (as vision specified)
- ISO 8601 format (machine-readable, human-readable)
- user can answer "when did it run?" in one command

---

## cp4: new resource state

### observation

the test resources are new (not yet created remotely), so `remote[].state` is `null` for both entries. this matches the vision's edge case:

> "no remote state (new resource) | remote[].state is null, forResource shows what was looked up"

### friction? none

- null state is clear and intentional
- `forResource` still shows the identifier (class + slug)
- user understands the resource doesn't exist remotely

---

## edge cases verified

| case | tested? | result |
|------|---------|--------|
| --snap without --into | not tested | would fail (--into is required for plan) |
| relative path | yes | works correctly |
| absolute path | yes | works correctly |
| new resource (null state) | yes | works as expected |

---

## what i learned

the vision's "aha moment" is real:

> "oh, i can just look at snapshot.json to see exactly what cloudflare returned — i don't need to add debug logs or re-run."

when i ran `jq '.remote[0]'`, i immediately saw the resource structure. no guess needed, no re-runs, no console.logs. the value is instant.

the design choices that make it frictionless:

1. **--snap is opt-in** — plan still works without it
2. **jq-friendly** — standard JSON, no custom format
3. **observedAt first** — audit use case is immediate
4. **null for new** — clear semantics, no confusion

---

## conclusion

all four critical paths are frictionless:

| path | frictionless? | evidence |
|------|---------------|----------|
| cp1: plan with snap | yes | one command, both outputs, clear feedback |
| cp2: debug with jq | yes | standard JSON, jq parses instantly |
| cp3: audit timestamp | yes | observedAt first, ISO format |
| cp4: new resource state | yes | null is explicit, forResource identifies |

the implementation matches the vision. users will experience the "aha moment" on first use.

