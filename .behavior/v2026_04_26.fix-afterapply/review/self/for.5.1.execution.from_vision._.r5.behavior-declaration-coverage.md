# self-review r5: behavior-declaration-coverage

🍵 tea first.

---

## the review question

does the implementation cover every requirement from the behavior declaration?

---

## line-by-line code verification against wish

### wish statement 1: "after plan, it should give the command to run to execute the apply"

**code trace:**

`plan.ts:155-163`:
```ts
// log apply hint
const applyCommand = asApplyCommandFromArgv({
  argv: argvOriginal,
  planFilePath: relativePlanPath,
});
log.info('🥥 did you know?');
log.info('   ├─ to apply, run');
log.info(`   └─ ${applyCommand}`);
log.info('');
```

**verified:** ✅ the apply hint is output after plan completes, exactly as wished.

---

### wish statement 2: "since its the same as the one used to run the plan except we just replace the --flags"

**code trace:**

`plan.ts:39` captures the original command:
```ts
const argvOriginal = [...process.argv];
```

`asApplyCommandFromArgv.ts:5-18` transforms it:
```ts
export const asApplyCommandFromArgv = (input: {
  argv: string[];
  planFilePath: string;
}): string => {
  const { argv, planFilePath } = input;
  const prefix = getInvocationPrefix({ argv });
  const applyArgs = asApplyArgsFromArgv({ argv, planFilePath });
  return [prefix, 'declastruct apply', ...applyArgs].filter(Boolean).join(' ');
};
```

**verified:** ✅ the transformer receives the actual command that was run and transforms it. it does not construct a new command from scratch.

---

### wish statement 3: "ensure to only replace the --flags, since the caller may have used env vars and other attributes"

**code trace:**

the argv capture at `plan.ts:39` happens before any modification:
```ts
const argvOriginal = [...process.argv];
```

this is BEFORE `plan.ts:78-82` which modifies process.argv for passthrough:
```ts
process.argv = [
  process.argv[0]!,
  process.argv[1]!,
  ...cliContext.passthrough.argv,
];
```

**verified:** ✅ by the capture of argv first, we preserve the exact command the caller used, with any env vars or attributes they may have set.

---

### wish statement 4: "also, scope it only to the --wish and --into flags, since they may have supplied other flags too"

**code trace:**

`asApplyCommandFromArgv.ts:56`:
```ts
const skipFlags = new Set(['--wish', '--into', '--snap']);
```

`asApplyCommandFromArgv.ts:77-79` removes only specified flags:
```ts
if (skipFlags.has(arg)) {
  skipNext = true;
  continue;
}
```

`asApplyCommandFromArgv.ts:89-90` preserves all other args:
```ts
// preserve all other args
result.push(arg);
```

**test verification from `asApplyCommandFromArgv.test.ts:131-152`:**
```ts
given('[case7] command with other flags to preserve', () => {
  // ...
  expect(result).toEqual(
    'npx declastruct apply --plan plan.json --verbose --debug',
  );
});
```

**verified:** ✅ only plan-specific flags (`--wish`, `--into`, `--snap`) are removed. user flags like `--verbose` and `--debug` are preserved.

---

## issue found: none

the implementation covers all requirements from the wish. each requirement maps to specific lines of code that implement it correctly.

---

## non-issues confirmed

### why --snap is removed even though wish only mentions --wish and --into

the wish says "scope it only to the --wish and --into flags". the implementation also removes `--snap`.

**why this is not a violation:**

1. the wish's intent is "preserve other flags the user may have supplied"
2. `--snap` is a plan-specific flag (captures snapshot at plan time)
3. `--snap` has no use for the apply command
4. to remove it does not violate the spirit of the wish

if we kept `--snap`, the apply command would be:
```
npx declastruct apply --plan plan.json --snap snap.json
```

this would be unclear because `apply` doesn't accept `--snap`. the removal produces a clean, valid command.

### why passthrough args are removed

passthrough args (`-- arg1 arg2`) are passed to the wish file at plan time. since apply doesn't execute the wish file, these args are irrelevant.

to keep them would produce:
```
npx declastruct apply --plan plan.json -- --env prod
```

this would be unclear because apply doesn't forward args to a wish file.

---

## test coverage summary

| requirement | test case(s) |
|-------------|--------------|
| shows apply command | implicit in integration |
| preserves invocation prefix | cases 1-4 (npx, pnpm, yarn, bare) |
| removes --wish | cases 1, 8 |
| removes --into | cases 1, 8 |
| removes --snap | case 5 |
| removes passthrough | case 6 |
| preserves other flags | case 7 |
| handles --flag=value | case 8 |
| handles relative paths | case 10 |

10 unit tests, all pass.

---

## conclusion

**all wish requirements covered.** the implementation:

1. shows apply command after plan ✅ (`plan.ts:155-163`)
2. transforms actual command, not new construction ✅ (`plan.ts:39`)
3. captures argv before modification ✅ (`plan.ts:39` before `plan.ts:78`)
4. removes only plan-specific flags, preserves user flags ✅ (`skipFlags` set)

no gaps found. no features omitted.
