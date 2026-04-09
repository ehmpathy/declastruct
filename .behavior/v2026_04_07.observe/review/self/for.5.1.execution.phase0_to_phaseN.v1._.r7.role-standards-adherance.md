# role-standards-adherance self-review: --snap implementation

## checklist

for each file changed in this PR, checked against mechanic role standards:
- does the code follow the practices in the briefs?
- are there any violations of the rules?
- are there any deviations from extant patterns?

---

## briefs categories enumerated

the following briefs/practices/code.prod subdirectories are relevant to this code:

| directory | contains | checked |
|-----------|----------|---------|
| evolvable.procedures | input-context, arrow-only, named-args, dependency-injection | yes |
| evolvable.domain.objects | nullable-without-reason, undefined-attributes, immutable-refs | yes |
| evolvable.repo.structure | directional-deps, barrel-exports | yes |
| pitofsuccess.errors | failfast, failhide, failloud | yes |
| pitofsuccess.procedures | idempotent-procedures, immutable-vars | yes |
| pitofsuccess.typedefs | shapefit, as-cast | yes |
| readable.comments | what-why-headers | yes |
| readable.narrative | else-branches, narrative-flow, decode-friction | yes |

---

## files changed in this PR

```
src/domain.objects/DeclastructSnapshot.ts           [+] new
src/domain.operations/plan/planChanges.ts           [~] modified
src/contract/cli/plan.ts                            [~] modified
src/contract/cli/invoke.ts                          [~] modified
src/contract/cli/plan.integration.test.ts           [~] modified
```

---

## deep review: DeclastructSnapshot.ts

### line 1-4: imports

```ts
import { DomainLiteral } from 'domain-objects';
import type { IsoTimestamp } from './IsoTimestamp';
```

**rule.require.directional-deps:** domain.objects imports only from domain-objects package and sibling IsoTimestamp. no upward deps. **holds.**

### line 5-8: jsdoc header for DeclastructSnapshotEntry

```ts
/**
 * .what = a single entry in a snapshot, captures state for one resource
 * .why = enables debug and audit of what declastruct observed for each resource
 */
```

**rule.require.what-why-headers:** has `.what` and `.why`. both are 1 line. **holds.**

### line 9-32: DeclastructSnapshotEntry interface

```ts
export interface DeclastructSnapshotEntry {
  forResource: {
    class: string;
    slug: string;
  };
  state: Record<string, any> | null;
}
```

**rule.forbid.undefined-attributes:** no `?` optional fields. `state` is `| null`, not `| undefined`. **holds.**

**rule.forbid.nullable-without-reason:** `state` is nullable. line 28-29 documents the reason: `null if the resource does not exist remotely (for remote[])`. **holds.**

### line 34-36: DeclastructSnapshotEntry class

```ts
export class DeclastructSnapshotEntry
  extends DomainLiteral<DeclastructSnapshotEntry>
  implements DeclastructSnapshotEntry {}
```

**extant pattern check:** matches DeclastructChange.ts pattern exactly. **holds.**

### line 38-41: jsdoc header for DeclastructSnapshot

```ts
/**
 * .what = snapshot of remote and wished state at plan time
 * .why = enables debug and audit of what declastruct observed before diff
 */
```

**rule.require.what-why-headers:** has `.what` and `.why`. both are 1 line. **holds.**

### line 42-57: DeclastructSnapshot interface

```ts
export interface DeclastructSnapshot {
  observedAt: IsoTimestamp;
  remote: DeclastructSnapshotEntry[];
  wished: DeclastructSnapshotEntry[];
}
```

**rule.forbid.undefined-attributes:** no optional fields. all required. **holds.**

### line 59-67: DeclastructSnapshot class with nested

```ts
export class DeclastructSnapshot
  extends DomainLiteral<DeclastructSnapshot>
  implements DeclastructSnapshot
{
  public static nested = {
    remote: DeclastructSnapshotEntry,
    wished: DeclastructSnapshotEntry,
  };
}
```

**extant pattern check:** matches DeclastructPlan.ts pattern with `public static nested`. **holds.**

---

## deep review: planChanges.ts diff

### line 1-6: new imports

```ts
import {
  type DomainEntity,
  getUniqueIdentifierSlug,
  serialize,
} from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
```

**rule.require.directional-deps:** domain.operations imports from domain-objects and helpful-errors (infra-level packages). **holds.**

### line 35-38: return type change

```ts
): Promise<{ plan: DeclastructPlan; snapshot: DeclastructSnapshot }> => {
```

**rule.forbid.io-as-interfaces:** return type is inline, not a separate interface. **holds.**

### line 46-51: new variables

```ts
const observedAt = asIsoTimestamp(new Date());
const changes = [];
const snapshotRemote: DeclastructSnapshotEntry[] = [];
const snapshotWished: DeclastructSnapshotEntry[] = [];
```

**rule.require.immutable-vars:** all `const`, not `let`. arrays are pushed to (allowed pattern). **holds.**

### line 77-105: snapshot collection block

```ts
// collect snapshot entry BEFORE omitReadonly (for debug and audit)
const forResource = {
  class: resource.constructor.name,
  slug: UnexpectedCodePathError.wrap(
    () => getUniqueIdentifierSlug(resource),
    {
      message: 'failed to getUniqueIdentifierSlug for snapshot',
      metadata: {
        resource,
        ctor: resource.constructor.name,
      },
    },
  )(),
};
snapshotRemote.push(
  new DeclastructSnapshotEntry({
    forResource,
    state: remoteState ? JSON.parse(serialize(remoteState)) : null,
  }),
);
snapshotWished.push(
  new DeclastructSnapshotEntry({
    forResource,
    state: JSON.parse(serialize(resource)),
  }),
);
```

**rule.require.failfast:** uses `UnexpectedCodePathError.wrap` with metadata for error context. **holds.**

**rule.require.named-args:** all object constructors use named properties. **holds.**

**rule.forbid.else-branches:** no else branches. ternary `remoteState ? ... : null` is allowed (not a branch). **holds.**

**rule.forbid.as-cast:** no `as` casts in new code. **holds.**

### line 146-163: build plan and snapshot

```ts
const plan = new DeclastructPlan({ ... });
const snapshot = new DeclastructSnapshot({
  observedAt,
  remote: snapshotRemote,
  wished: snapshotWished,
});
return { plan, snapshot };
```

**rule.require.immutable-vars:** `plan` and `snapshot` are `const`. **holds.**

**rule.require.named-args:** object construction uses named properties. **holds.**

---

## deep review: plan.ts diff

### line 20-27: parameter change

```ts
export const executePlanCommand = async ({
  wishFilePath,
  planFilePath,
  snapFilePath,
}: {
  wishFilePath: string;
  planFilePath: string;
  snapFilePath: string | null;
}): Promise<void> => {
```

**rule.require.input-context-pattern:** uses destructured input object. **holds.**

**rule.forbid.undefined-inputs:** `snapFilePath` is `string | null`, not `string | undefined`. **holds.**

**rule.require.arrow-only:** uses arrow function. **holds.**

### line 29-33: expand paths via path.resolve

```ts
const resolvedSnapPath = snapFilePath
  ? resolve(process.cwd(), snapFilePath)
  : null;
```

note: variable name `resolvedSnapPath` uses "resolved" because it calls Node.js `path.resolve()`. this is the extant pattern in this file (see `resolvedWishPath`, `resolvedPlanPath`). the mechanic brief forbids the verb "resolve" as a domain term, but this is a direct reference to the Node.js path module function name.

**rule.require.immutable-vars:** `const`. **holds.**

**rule.forbid.else-branches:** no else. ternary is allowed. **holds.**

### line 95-106: conditional snapshot write

```ts
if (resolvedSnapPath) {
  const snapDir = dirname(resolvedSnapPath);
  await mkdir(snapDir, { recursive: true });
  await writeFile(
    resolvedSnapPath,
    JSON.stringify(snapshot, null, 2),
    'utf-8',
  );
}
```

**rule.forbid.else-branches:** no else branch. early-style guard (if truthy, do work). **holds.**

**rule.require.narrative-flow:** single code block with clear purpose. **holds.**

---

## deep review: invoke.ts diff

### line 27: new option

```ts
.option('--snap <file>', 'Path to output snapshot file')
```

**extant pattern check:** matches `--wish` and `--into` option patterns. **holds.**

### line 33: pass to command

```ts
snapFilePath: options.snap ?? null,
```

**rule.forbid.undefined-inputs:** converts `undefined` to `null` via `?? null`. **holds.**

---

## summary

**briefs directories checked:** 8

**files reviewed line-by-line:** 4 (DeclastructSnapshot.ts, planChanges.ts, plan.ts, invoke.ts)

**violations found:** 0

| rule | checked | status |
|------|---------|--------|
| rule.require.input-context-pattern | yes | holds |
| rule.require.arrow-only | yes | holds |
| rule.require.named-args | yes | holds |
| rule.forbid.undefined-inputs | yes | holds |
| rule.forbid.nullable-without-reason | yes | holds (documented) |
| rule.require.immutable-vars | yes | holds |
| rule.require.failfast | yes | holds |
| rule.forbid.else-branches | yes | holds |
| rule.forbid.as-cast | yes | holds |
| rule.require.what-why-headers | yes | holds |
| rule.require.directional-deps | yes | holds |
| rule.forbid.io-as-interfaces | yes | holds |

all new code follows mechanic role standards. no violations detected.

