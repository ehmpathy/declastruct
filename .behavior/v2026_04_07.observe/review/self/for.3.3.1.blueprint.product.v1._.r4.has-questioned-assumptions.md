# self-review r4: has-questioned-assumptions

surface hidden technical assumptions and question each.

---

## assumption 1: serialize() works on remoteState

**the assumption:** we can call `serialize(remoteState)` to get JSON with `_dobj` stamp.

**what if opposite were true?**
- remoteState might be raw JSON from the API, not a DomainEntity instance
- serialize() might fail or produce unexpected output

**evidence check:**
- research showed remoteState comes from `dao.get.one.byUnique(resource, providerContext)`
- DAO returns domain object instances (e.g., `DeclaredCloudflareDomainZone`)
- domain objects have `_dobj` after instantiation
- serialize() is used elsewhere in the codebase for these objects

**verdict:** assumption holds. DAOs return domain object instances, not raw JSON.

---

## assumption 2: planChanges loop is the right capture point

**the assumption:** we capture snapshot entries inside the resource iteration loop in planChanges.

**what if opposite were true?**
- what if we captured after the loop completes?
- what if a future refactor changes the loop structure?

**evidence check:**
- the loop iterates wish resources
- remoteState and desiredState are scoped to each iteration
- after the loop, individual states are not accessible
- the loop is the ONLY place where both remote and desired exist together

**verdict:** assumption holds. the loop is the necessary capture point — data is not available elsewhere.

---

## assumption 3: { plan, snapshot } tuple return is safe

**the assumption:** planChanges can return a tuple without breakage.

**what if opposite were true?**
- callers might expect a single value
- tests might assert on return shape

**evidence check:**
- planChanges is called in one place: plan.ts
- plan.ts currently does: `const plan = await planChanges(...)`
- change to: `const { plan, snapshot } = await planChanges(...)`
- this is a controlled internal change, not a public API

**verdict:** assumption holds. one caller, we control it.

---

## assumption 4: wished state for deleted resources

**the assumption:** wished[] contains entries for all resources, even those marked for deletion.

**what if opposite were true?**
- for DESTROY action, desiredState is null
- if wished[].state is null for deletions, is that useful?

**evidence check:**
- vision shows wished[].state as "full instance" for all cases
- criteria matrix.2 shows: "ind: in wish = yes" for all rows
- for deleted resources (del() marker), the original resource is in the wish file
- desiredState is `isMarkedForDeletion(resource) ? null : resource`
- but the RESOURCE itself exists — we can serialize it before the deletion check

**issue found:** blueprint assumes desiredState = wished, but desiredState is null for deletions.

**fix:** capture the resource itself (before deletion check), not desiredState.

```
// before
wished.state = serialize(desiredState)  // null for deletions

// after
wished.state = serialize(resource)  // always the resource
```

**verdict:** assumption was WRONG. fixed via resource instead of desiredState for wished[].

---

## assumption 5: file paths follow plan pattern

**the assumption:** snapFilePath treatment matches planFilePath (expand, mkdir, write).

**what if opposite were true?**
- different validation needed?
- different directory structure?

**evidence check:**
- research pattern.7 shows: `mkdir(dirname(path), { recursive: true })` + `writeFile(path, ...)`
- both are file paths, both need parent directories
- no special treatment needed for snapshot vs plan

**verdict:** assumption holds. same pattern applies.

---

## assumption 6: snapshot scope matches plan scope

**the assumption:** snapshot only includes resources in the wish (same as plan).

**what if opposite were true?**
- what if user expects snapshot to include remote-only resources?
- remote-only: resources that exist remotely but aren't in the wish

**evidence check:**
- vision states: "snapshot only includes wish resources"
- criteria usecase.5: "only resources in the wish are included"
- plan.json only includes wish resources
- consistency with plan.json is the design

**verdict:** assumption holds. scope is explicitly defined in vision and criteria.

---

## issues found

| # | assumption | status | action |
|---|------------|--------|--------|
| 1 | serialize() works on remoteState | holds | none |
| 2 | planChanges loop is capture point | holds | none |
| 3 | tuple return is safe | holds | none |
| 4 | desiredState = wished state | WRONG | use resource not desiredState |
| 5 | file path treatment same as plan | holds | none |
| 6 | scope matches plan | holds | none |

---

## fix applied

**issue 4** reveals a subtle bug in the blueprint:

the blueprint codepath showed:
```
├── [+] collect snapshot entry
│   ├── [←] serialize(remote)
│   └── [←] serialize(desired)
```

but `desired` is null for deleted resources. the wished[] array should show what the user declared, not the computed desired state.

**fix applied to blueprint (3.3.1.blueprint.product.v1.i1.md):**

1. updated codepath tree (lines 50-52):
   ```
   ├── [+] collect snapshot entry  # BEFORE omitReadonly
   │   ├── [←] serialize(remoteState)   # may be null if new
   │   └── [←] serialize(resource)      # always the declared resource
   ```

2. updated implementation sequence step 2:
   - added note: "use resource (not desiredState) for wished[] — desiredState is null for del() resources"

this ensures wished[].state is always populated, even for del() marked resources.

---

## summary

**assumptions questioned:** 6
**assumptions that held:** 5
**assumptions that were wrong:** 1

**why this matters:**

the desiredState vs resource distinction is subtle but critical:

| variable | definition | value for del() resources |
|----------|---------|---------------------------|
| resource | what user declared | the domain object |
| desiredState | what declastruct wants | null (deletion means no desired state) |
| remoteState | what exists remotely | the remote object (or null if new) |

the snapshot should capture what the user DECLARED (resource), not what declastruct COMPUTED (desiredState).

**the bug that was avoided:**

if we had shipped with `serialize(desiredState)`:
1. user declares `del(new Zone({ name: 'example.com' }))`
2. plan shows DESTROY action (correct)
3. snapshot shows wished[].state = null (WRONG)
4. user looks at snapshot to understand what they declared
5. user sees null and thinks "i didn't declare this resource"
6. user is confused — they DID declare a resource, they just marked it for deletion

**the fix ensures:**

wished[].state = the serialized resource, always. even for deletions. the snapshot answers "what did i declare?" not "what does declastruct want?"

**lesson learned:**

question variables that SEEM interchangeable. `desiredState` and `resource` sound like they refer to the same data. they don't. desiredState is a transformation of resource (with deletion applied). the snapshot needs the original, not the transformation.
