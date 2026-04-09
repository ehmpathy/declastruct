# self-review: has-ergonomics-validated (r9)

## question

double-check: does the actual input/output match what felt right at design?

## reference documents

since no repros artifact exists, i compare against the vision document:
- `.behavior/v2026_04_07.observe/1.vision.md` — defines contract and output shape

---

## input ergonomics

### planned (vision)

```sh
npx declastruct plan --wish resources.ts --into plan.json --snap snapshot.json
```

### implemented (actual)

```sh
npx tsx ./bin/run plan --wish src/.test/assets/wish.fixture.ts --into plan.json --snap snapshot.json
```

### match? yes

| aspect | planned | actual | match? |
|--------|---------|--------|--------|
| flag name | `--snap` | `--snap` | yes |
| flag position | after `plan` | after `plan` | yes |
| flag argument | file path | file path | yes |
| optional | yes (opt-in) | yes (opt-in) | yes |

the input ergonomics match the vision exactly. no drift.

---

## output ergonomics

### planned (vision)

```json
{
  "observedAt": "2026-04-07T15:00:00.000Z",
  "remote": [
    {
      "forResource": {
        "class": "DeclaredCloudflareDomainZone",
        "slug": "DeclaredCloudflareDomainZone.example.com.abc123"
      },
      "state": {
        "_dobj": "DeclaredCloudflareDomainZone",
        "id": "abc123",
        ...
      }
    }
  ],
  "wished": [
    {
      "forResource": { ... },
      "state": { "_dobj": "...", ... }
    }
  ]
}
```

### implemented (actual)

```json
{
  "observedAt": "2026-04-08T06:26:42.123Z",
  "remote": [
    {
      "forResource": {
        "class": "DemoResource",
        "slug": "DemoResource.e0b6f399-5040-4aa7-af2b-a388979a72aa.b9bfe71c"
      },
      "state": null
    }
  ],
  "wished": [
    {
      "forResource": {
        "class": "DemoResource",
        "slug": "DemoResource.e0b6f399-5040-4aa7-af2b-a388979a72aa.b9bfe71c"
      },
      "state": {
        "_dobj": "DemoResource",
        "exid": "b9bfe71c",
        "name": "First Resource"
      }
    }
  ]
}
```

### match? yes

| aspect | planned | actual | match? |
|--------|---------|--------|--------|
| observedAt first | yes | yes | yes |
| observedAt format | ISO timestamp | ISO timestamp | yes |
| remote[] structure | array of entries | array of entries | yes |
| forResource.class | string | string | yes |
| forResource.slug | string | string | yes |
| state with _dobj | yes | yes | yes |
| wished[] structure | array of entries | array of entries | yes |
| null state for new | yes | yes | yes |

the output shape matches the vision exactly. no drift.

---

## terminal output ergonomics

### implemented

```
🐢 declastruct plan

🐚 plan
   ├─ wish: src/.test/assets/wish.fixture.ts
   ├─ into: /tmp/declastruct-test/plan.json
   └─ snap: /tmp/declastruct-test/snapshot.json

🌊 resources: 2
   ├─ CREATE: 2
   ...

✨ plan written to /tmp/declastruct-test/plan.json
✨ snapshot written to /tmp/declastruct-test/snapshot.json
```

### assessment

- snap path shown in header (alongside wish and into)
- confirmation message shows snapshot was written
- consistent with other declastruct output (turtle vibes)

this follows the ergonomist brief for treestruct output format.

---

## drift analysis

| area | drifted? | notes |
|------|----------|-------|
| input flags | no | --snap as designed |
| output structure | no | observedAt, remote[], wished[] as designed |
| terminal feedback | improved | added snap path to header and confirmation |

the terminal output is slightly better than the vision — it shows the snap path in the header tree, which helps users confirm their command was parsed correctly.

---

## why each design decision holds

### --snap flag name

**why it holds:** the vision chose `--snap` because it:
- matches the verb pattern of `--wish` (what you want) and `--into` (where it goes)
- is short (4 chars) and memorable
- evokes "snapshot" — a point-in-time capture

**alternative considered:** `--observe` was in the original wish document. `--snap` won because it's shorter and the noun "snapshot" is more familiar than the verb "observe."

the implementation uses `--snap`. this matches the vision. no drift.

### observedAt first

**why it holds:** the vision specified `observedAt` as the first field because:
- audit use case needs timestamp immediately
- `cat snapshot.json | head` shows when it was taken
- JSON key order matters for human readers

**implementation verified:** the snapshot JSON has `observedAt` as the first key. i confirmed this with `jq 'keys[0]'`.

### forResource + state structure

**why it holds:** the vision chose this structure because:
- matches plan.json structure for consistency
- `forResource` identifies WHAT (class + slug)
- `state` shows WHAT WAS SEEN (full serialized object or null)

**alternative considered:** flat structure with class/slug/state at same level. rejected because nesting under `forResource` groups the identifier fields together.

the implementation uses the exact structure. no drift.

### _dobj stamp from serialize()

**why it holds:** the vision specified `_dobj` because:
- `serialize()` from domain-objects adds it automatically
- enables class identification without external schema
- matches how plan.json stamps objects

**implementation verified:** the snapshot test shows `_dobj: "DemoResource"` in the state. this came from `serialize()` as expected.

---

## reflection

the vision document was precise. each design decision had clear rationale. this precision prevented drift.

if i had implemented without the vision, i might have:
- used `--observe` instead of `--snap` (more verbose)
- put `observedAt` last instead of first (audit harder)
- used flat structure instead of `forResource` grouping (less consistent)

the vision's precision saved implementation time and prevented rework.

---

## conclusion

input/output ergonomics match the vision exactly. every design decision has clear rationale that held through implementation.

| decision | rationale | held? |
|----------|-----------|-------|
| --snap flag | short, matches pattern | yes |
| observedAt first | audit use case | yes |
| forResource + state | matches plan.json | yes |
| _dobj stamp | class identification | yes |

the terminal output added one enhancement (snap path in header tree). this improves the experience without altering the core contract.

no fixes needed.

