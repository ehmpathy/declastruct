# backwards-compat self-review (r2): deeper examination

## deeper review of planChanges.ts

read the full diff line by line. key observations:

### return type change

```diff
-): Promise<DeclastructPlan> => {
+): Promise<{ plan: DeclastructPlan; snapshot: DeclastructSnapshot }> => {
```

**concern:** could have added optional backwards compat like:
```ts
// NOT DONE - this would be backwards compat shim
): Promise<DeclastructPlan | { plan: DeclastructPlan; snapshot: DeclastructSnapshot }> => {
```

**why it holds:** clean break is correct because:
1. declastruct is pre-1.0 semver (v1.7.3) - incompatible changes allowed
2. planChanges is internal function, not public package API
3. all callers in repo were updated in same commit
4. no external callers exist (not published as importable function)

### no shim for "snapshot optional" pattern

**concern:** could have made snapshot collection conditional:
```ts
// NOT DONE - would be unnecessary complexity
if (wantSnapshot) {
  snapshotRemote.push(...);
  snapshotWished.push(...);
}
```

**why it holds:** always collect snapshot because:
1. the cost is minimal (serialize() is cheap)
2. simplifies logic - no branches
3. caller decides whether to use snapshot
4. blueprint did not request conditional collection

### observedAt timestamp placement

**observation:** timestamp captured BEFORE any API calls:
```ts
const observedAt = asIsoTimestamp(new Date());
// ... then API calls happen
```

**why it holds:** this is correct behavior per vision - observedAt should reflect when observation began, not when it ended. no backwards compat concern here, just a note on the design choice.

---

## conclusion

**backwards compat shims found:** 0
**backwards compat shims that could have been added but were correctly omitted:** 2

the implementation correctly avoided backwards compat complexity that would have been YAGNI. the clean type change with all callers updated is the right approach for internal functions in pre-1.0 packages.
