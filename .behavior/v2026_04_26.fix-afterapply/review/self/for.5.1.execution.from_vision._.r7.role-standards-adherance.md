# self-review r7: role-standards-adherance

🍵 tea first.

---

## the review question

does the code follow mechanic role standards? did the junior introduce anti-patterns?

---

## step 1: enumerate rule directories

from mechanic briefs in context, i will check:

| directory | rules to verify |
|-----------|-----------------|
| `lang.terms/` | gerunds, ubiqlang, treestruct names |
| `lang.tones/` | lowercase, no shouts, no buzzwords |
| `code.prod/evolvable.procedures/` | arrow-only, input-context, named args |
| `code.prod/readable.narrative/` | no else, early returns, no decode-friction |
| `code.prod/readable.comments/` | what-why headers |
| `code.prod/pitofsuccess.errors/` | failfast, failloud |
| `code.test/frames.behavior/` | given-when-then |

---

## step 2: line-by-line verification

### file: `asApplyCommandFromArgv.ts`

#### lines 1-4: jsdoc header

```ts
/**
 * .what = transforms a plan command argv into the equivalent apply command
 * .why = shows users the exact command to run after plan, no syntax to remember
 */
```

| rule | check | result |
|------|-------|--------|
| rule.require.what-why-headers | has .what and .why | ✅ |
| rule.forbid.gerunds | no -ing words | ✅ |
| rule.prefer.lowercase | all lowercase | ✅ |

#### lines 5-18: main function

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

| rule | check | result |
|------|-------|--------|
| rule.require.arrow-only | arrow function | ✅ |
| rule.require.input-context-pattern | `(input: {...})` | ✅ |
| rule.require.named-args | destructured input | ✅ |
| rule.forbid.positional-args | no positional args | ✅ |
| rule.require.treestruct | `as*` prefix for transformer | ✅ |
| rule.forbid.else-branches | no else | ✅ |

#### lines 21-39: getInvocationPrefix

```ts
/**
 * .what = extracts the invocation prefix from argv
 * .why = preserves how user invoked the command (npx, pnpm dlx, yarn dlx, or bare)
 */
const getInvocationPrefix = (input: { argv: string[] }): string => {
  const { argv } = input;
  const execPath = argv[1] ?? '';

  if (execPath.includes('npx')) return 'npx';
  if (execPath.includes('pnpm')) return 'pnpm dlx';
  if (execPath.includes('yarn')) return 'yarn dlx';
  if (execPath.includes('node_modules/.bin')) return 'npx';

  return '';
};
```

| rule | check | result |
|------|-------|--------|
| rule.require.what-why-headers | has .what and .why | ✅ |
| rule.require.arrow-only | arrow function | ✅ |
| rule.require.treestruct | `get*` prefix for retrieval | ✅ |
| rule.require.narrative-flow | early returns, no nests | ✅ |
| rule.forbid.else-branches | no else | ✅ |

#### lines 41-94: asApplyArgsFromArgv

```ts
/**
 * .what = converts plan argv into apply args
 * .why = removes plan-specific flags and adds --plan flag
 */
const asApplyArgsFromArgv = (input: {
  argv: string[];
  planFilePath: string;
}): string[] => {
  // ... implementation
};
```

| rule | check | result |
|------|-------|--------|
| rule.require.what-why-headers | has .what and .why | ✅ |
| rule.require.arrow-only | arrow function | ✅ |
| rule.require.treestruct | `as*` prefix for transformer | ✅ |
| rule.require.narrative-flow | uses early `continue`, no nested branches | ✅ |
| rule.forbid.else-branches | no else (only `if` with continue) | ✅ |

---

### file: `asApplyCommandFromArgv.test.ts`

#### test structure check

```ts
describe('asApplyCommandFromArgv', () => {
  given('[case1] npx invocation with basic flags', () => {
    when('[t0] transformed', () => {
      then('produces apply command with plan flag', () => {
```

| rule | check | result |
|------|-------|--------|
| rule.require.given-when-then | uses given/when/then | ✅ |
| rule.require.case-labels | `[case1]`, `[t0]` labels | ✅ |

all 10 test cases follow the same pattern.

---

### file: `plan.ts` (diff only)

#### line 18: import

```ts
import { asApplyCommandFromArgv } from './asApplyCommandFromArgv';
```

| rule | check | result |
|------|-------|--------|
| rule.require.directional-deps | imports from same directory | ✅ |

#### lines 38-39: argv capture

```ts
// capture original argv before it gets modified for passthrough args
const argvOriginal = [...process.argv];
```

| rule | check | result |
|------|-------|--------|
| rule.require.immutable-vars | spread creates new array | ✅ |
| rule.forbid.gerunds | comment avoids gerund (uses "gets modified" as verb phrase) | ✅ |

#### lines 155-163: apply hint output

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

| rule | check | result |
|------|-------|--------|
| rule.require.treestruct-output | tree structure with ├─ └─ | ✅ |
| rule.prefer.chill-nature-emojis | 🥥 is nature emoji | ✅ |

---

## issue found: none

all code follows mechanic standards after line-by-line review.

---

## lesson learned

line-by-line review is slower but finds more. in r6 i checked categories; in r7 i traced each line to specific rules. the difference is thoroughness.

---

## conclusion

**code adheres to mechanic role standards.**

every line verified against applicable rules:
- lang.terms: no gerunds, proper prefixes ✅
- lang.tones: lowercase, nature emojis ✅
- evolvable.procedures: arrow-only, input pattern ✅
- readable.narrative: no else, early returns ✅
- readable.comments: what-why headers ✅
- test.behavior: given-when-then ✅

no anti-patterns introduced. no deviations from conventions.
