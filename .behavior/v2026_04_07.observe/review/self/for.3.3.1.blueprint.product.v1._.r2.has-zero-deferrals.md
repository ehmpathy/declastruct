# self-review r2: has-zero-deferrals

verify no vision items are deferred.

---

## method

1. searched blueprint for deferral markers: `defer`, `future`, `out of scope`, `later`, `todo`, `tbd`
2. enumerated each vision requirement
3. traced each to specific blueprint location
4. verified no partial implementations ("phase 1" patterns)

**scan result:** no deferral markers found.

---

## vision requirements traced

### 1. `--snap <file>` flag

**vision stated:** "add `--snap <file>` flag to `declastruct plan` command"

**blueprint location:** codepath tree shows `[+] --snap <file>` under invoke.ts plan command

**why not deferred:** the flag is the primary interface. if this were deferred, there would be no feature. the blueprint shows it as a `[+]` addition, not a `[~]` modification or future placeholder.

### 2. output `observedAt` timestamp

**vision stated:** `"observedAt": "2026-04-07T15:00:00.000Z"` as first field

**blueprint location:** DeclastructSnapshot interface shows `observedAt: IsoTimestamp` as first field

**why not deferred:** the timestamp is critical for audit. it answers "when was this observed?" without it, snapshots have no temporal anchor. the interface declares it explicitly.

### 3. output `remote[]` array

**vision stated:** `"remote": [...]` array with entries for each resource

**blueprint location:** DeclastructSnapshot interface shows `remote: DeclastructSnapshotEntry[]`

**why not deferred:** remote state is the primary payload. the entire feature exists to expose this. deferral would gut the feature.

### 4. output `wished[]` array

**vision stated:** `"wished": [...]` array with entries for each resource

**blueprint location:** DeclastructSnapshot interface shows `wished: DeclastructSnapshotEntry[]`

**why not deferred:** wished state alongside remote enables comparison. the vision explicitly shows both. the interface declares both.

### 5. entry `forResource.class`

**vision stated:** each entry has `"forResource": { "class": "DeclaredCloudflareDomainZone", ... }`

**blueprint location:** DeclastructSnapshotEntry shows `forResource: { class: string; slug: string; }`

**why not deferred:** resource identification is non-negotiable. without class, entries are anonymous blobs. the interface declares it.

### 6. entry `forResource.slug`

**vision stated:** each entry has `"forResource": { ..., "slug": "DeclaredCloudflareDomainZone.example.com.abc123" }`

**blueprint location:** DeclastructSnapshotEntry shows `forResource: { class: string; slug: string; }`

**why not deferred:** slug enables lookup and correlation with plan.json. the interface declares it.

### 7. entry `state` with `_dobj` stamp

**vision stated:** state contains `"_dobj": "DeclaredCloudflareDomainZone"` from serialize()

**blueprint location:** codepath tree shows `[←] serialize(remote)` and `[←] serialize(desired)`

**why not deferred:** serialize() is the prescribed method. it stamps _dobj automatically. no additional work needed to fulfill this — it comes from the method call.

### 8. null state for new resources

**vision stated:** "remote[].state should be null for new resources"

**blueprint location:** test tree shows test case `'snapshot remote[].state should be null for new resources'`

**why not deferred:** this is an edge case that must work from day one. new resources are common. a test case ensures the behavior.

### 9. opt-in behavior

**vision stated:** "no snapshot file is created" when flag absent

**blueprint location:** plan.ts shows `[+] write snapshot.json if --snap provided` — conditional write

**why not deferred:** opt-in is the default contract. the codepath explicitly shows conditional execution. test case `'should not create snapshot when --snap flag absent'` verifies.

---

## usecases traced

### debug readonly fields

**vision usecase:** "debug readonly fields" — see which fields were excluded

**blueprint enables:** codepath captures state BEFORE computeChange applies omitReadonly

**why not deferred:** this is the core motivation. the capture point in planChanges is explicit.

### audit remote state

**vision usecase:** "audit" — prove what remote state was at plan time

**blueprint enables:** observedAt timestamp + full serialized state

**why not deferred:** timestamp declared in interface, state declared in interface.

### drift detection

**vision usecase:** "drift detection" — compare snapshots over time

**blueprint enables:** deterministic serialize() output enables diff

**why not deferred:** no special drift logic needed — snapshots are files, files diff.

### first-time setup

**vision usecase:** "first-time setup" — learn what the API returns

**blueprint enables:** full remote state visible in snapshot

**why not deferred:** same as debug — full state captured.

---

## criteria traced (2.1)

each blackbox criterion from 2.1.criteria.blackbox has a corresponding blueprint element:

| criterion | blueprint element | why complete |
|-----------|-------------------|--------------|
| snapshot created when flag present | codepath + test | explicit flow |
| snapshot not created when flag absent | conditional + test | explicit guard |
| observedAt present | interface field | declared |
| remote[] with full state | interface + serialize | declared + method |
| wished[] with declared state | interface + serialize | declared + method |
| forResource structure | interface | declared |
| _dobj stamp | serialize() call | automatic from method |
| null state for new resources | test case | explicit verification |
| scope matches plan | codepath iterates wish | same iteration loop |
| independent of plan action | capture before computeChange | explicit ordering |

---

## summary

| category | items | covered | deferred |
|----------|-------|---------|----------|
| vision requirements | 9 | 9 | 0 |
| vision usecases | 4 | 4 | 0 |
| blackbox criteria | 10 | 10 | 0 |

**verdict:** zero deferrals.

**why it holds:**

the scope is contained. one flag, one domain object, one write path. there is no room for deferral — each piece is necessary for the feature to function.

the vision describes a complete, minimal feature. the blueprint implements that complete feature. there are no "phase 2" or "future enhancement" markers because no item remains to phase.

deferral patterns appear when scope creeps or when implementation reveals complexity. here, the research phase showed that extant infrastructure handles all requirements. serialize() stamps _dobj. planChanges already fetches remoteState. writeFile already handles JSON output. the blueprint composes extant pieces — it does not invent new ones that could be deferred.
