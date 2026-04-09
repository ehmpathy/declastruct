# self-review: has-consistent-conventions (round 9)

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/3.3.1.blueprint.product.v1.i1.md`

---

## search for extant conventions

### file name conventions

**source:** `ls src/.test/assets/*.fixture.ts`

**extant fixture names:**
```
wish.fixture.ts
wish-with-del.fixture.ts
wish-for-del.fixture.ts
wish-with-auth.fixture.ts
```

**pattern identified:** `wish[-with|-for]-<feature>.fixture.ts`

**blueprint proposes:** `wish-with-args.fixture.ts`

**convention check:**
| component | extant pattern | blueprint | match |
|-----------|---------------|-----------|-------|
| prefix | `wish-with-` | `wish-with-` | ✓ |
| feature | del, auth | args | ✓ descriptive |
| suffix | `.fixture.ts` | `.fixture.ts` | ✓ |

**why this holds:** new fixture follows the `wish-with-<feature>.fixture.ts` convention established by wish-with-del and wish-with-auth.

---

### parameter name conventions

**source:** read `src/contract/cli/plan.ts`

**extant executePlanCommand parameters:**
```typescript
wishFilePath: string;
planFilePath: string;
```

**pattern identified:** `<subject>FilePath` for file path parameters.

**blueprint proposes:** `passthroughArgs: string[]`

**convention check:**
| aspect | analysis |
|--------|----------|
| is this a file path? | no — it's an array of strings |
| does `FilePath` apply? | no — different type |
| is `Args` appropriate? | yes — standard suffix for argument arrays |
| is `passthrough` the right term? | yes — term from vision document |

**why this holds:** the parameter is not a file path, so `FilePath` suffix does not apply. `Args` suffix is appropriate for a string array of arguments. `passthrough` matches vision terminology.

---

### function name conventions

**source:** read `src/contract/cli/plan.ts`, `src/contract/cli/apply.ts`

**extant command execution functions:**
```typescript
executePlanCommand({ ... })   // plan.ts:15
executeApplyCommand({ ... })  // apply.ts:8
```

**pattern identified:** `execute<Command>Command`

**blueprint proposes:** no new functions — only parameter addition to extant function.

**why this holds:** no new function is introduced. the extant function is extended with a parameter.

---

### test file name conventions

**source:** `ls src/contract/cli/*.test.ts`

**extant test files:**
```
plan.integration.test.ts
apply.integration.test.ts
```

**pattern identified:** `<command>.<test-type>.test.ts`

**blueprint proposes:**
| file | status | convention match |
|------|--------|------------------|
| plan.integration.test.ts | modify extant | ✓ |
| apply.integration.test.ts | modify extant | ✓ |
| invoke.acceptance.test.ts | new file | ✓ follows pattern |

**why this holds:** the new test file follows the `<command>.<type>.test.ts` convention. `invoke` is the entry point (like plan/apply), `acceptance` is the test type.

---

### test case name conventions

**source:** read `src/contract/cli/plan.integration.test.ts:44`

**extant test case:**
```typescript
it('should generate a plan file with changes based on wish file', async () => {
```

**pattern identified:** `'should <verb> <subject> <details>'`

**blueprint proposes:**
```
'should pass args to process.argv'
'should strip -- separator from process.argv'
'should pass multiple args'
'should work without passthrough args (backwards compat)'
'should ignore passthrough args (use plan state)'
'should show passthrough args in plan help text'
```

**convention check:**
| test name | starts with 'should' | has verb | describes behavior |
|-----------|---------------------|----------|-------------------|
| pass args | ✓ | pass | ✓ |
| strip -- separator | ✓ | strip | ✓ |
| pass multiple args | ✓ | pass | ✓ |
| work without | ✓ | work | ✓ |
| ignore passthrough | ✓ | ignore | ✓ |
| show passthrough | ✓ | show | ✓ |

**why this holds:** all proposed test names follow the `'should <verb> <subject>'` pattern with parenthetical context notes where helpful.

---

### term conventions

**source:** vision document, extant codebase

| term | blueprint usage | extant in codebase? | source |
|------|----------------|---------------------|--------|
| `passthroughArgs` | parameter | new but follows vision term "passthrough" | vision.md |
| `wish file` | help text | yes | invoke.ts:25 |
| `wish-args` | help usage | follows `wish-` pattern | convention |
| `plan` | command | yes | invoke.ts:23 |
| `apply` | command | yes | invoke.ts:39 |

**why this holds:** all terms either match extant codebase vocabulary or follow established patterns.

---

### code structure conventions

**source:** read `src/contract/cli/invoke.ts:22-37`

**extant invoke.ts structure:**
```typescript
program
  .command('plan')
  .description('Generate a change plan from a wish file')
  .requiredOption('--wish <file>', 'Path to wish file')
  .requiredOption('--into <file>', 'Path to output plan file')
  .action(async (options) => { ... });
```

**blueprint proposes:**
```typescript
program
  .command('plan')
  .description('...')
  .requiredOption('--wish <file>', '...')
  .requiredOption('--into <file>', '...')
  .allowUnknownOption()  // added
  .usage('...')          // added
  .action(async (options, command) => { ... });  // modified
```

**convention check:**
| aspect | extant | blueprint | match |
|--------|--------|-----------|-------|
| chain style | method chain | method chain | ✓ |
| order | desc → opts → action | desc → opts → config → action | ✓ logical |
| action signature | (options) | (options, command) | ✓ commander API |

**why this holds:** new methods are added in a logical position (after options, before action). action signature change follows commander's documented API for unknown option access.

---

## summary

**conventions checked:** 7
**divergences found:** 0
**open questions:** 0

| category | extant convention | blueprint follows? |
|----------|------------------|-------------------|
| fixture file names | `wish-with-<feature>.fixture.ts` | ✓ yes |
| parameter names | `<subject>FilePath` for paths | ✓ yes (different type) |
| function names | `execute<X>Command` | ✓ n/a (no new fn) |
| test file names | `<cmd>.<type>.test.ts` | ✓ yes |
| test case names | `'should <verb> ...'` | ✓ yes |
| term vocabulary | declastruct terms | ✓ yes |
| code structure | commander chain | ✓ yes |

**the blueprint follows all extant conventions.**

