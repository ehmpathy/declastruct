# self-review r6: role-standards-adherance

🍵 tea first.

---

## the review question

does the code follow mechanic role standards? are there violations of required patterns?

---

## rule directories checked

based on the mechanic briefs in my context:

1. `code.prod/evolvable.procedures/` - function patterns
2. `code.prod/readable.narrative/` - readability patterns
3. `code.prod/readable.comments/` - comment patterns
4. `code.prod/pitofsuccess.errors/` - error patterns
5. `code.test/frames.behavior/` - test patterns
6. `lang.terms/` - term conventions
7. `lang.tones/` - tone and emoji conventions

---

## file-by-file standards check

### file 1: `asApplyCommandFromArgv.ts`

#### rule.require.arrow-only ✅

all functions use arrow syntax:
```ts
export const asApplyCommandFromArgv = (input: {...}): string => {
const getInvocationPrefix = (input: {...}): string => {
const asApplyArgsFromArgv = (input: {...}): string[] => {
```

no `function` keyword used.

#### rule.require.input-context-pattern ✅

all functions follow `(input: {...})` pattern:
```ts
asApplyCommandFromArgv(input: { argv: string[]; planFilePath: string })
getInvocationPrefix(input: { argv: string[] })
asApplyArgsFromArgv(input: { argv: string[]; planFilePath: string })
```

no positional args.

#### rule.require.what-why-headers ✅

each function has `.what` and `.why` comments:
```ts
/**
 * .what = transforms a plan command argv into the equivalent apply command
 * .why = shows users the exact command to run after plan, no syntax to remember
 */
export const asApplyCommandFromArgv = ...
```

all three functions documented.

#### rule.require.narrative-flow ✅

code reads as flat narrative without nested branches:
- early `continue` statements for skips
- no `if/else` branches
- linear flow from input to output

#### rule.forbid.gerunds ✅

no gerunds in code:
- comments use non-gerund forms
- variable names use non-gerund forms

---

### file 2: `asApplyCommandFromArgv.test.ts`

#### rule.require.given-when-then ✅

all tests follow BDD pattern:
```ts
given('[case1] npx invocation with basic flags', () => {
  when('[t0] transformed', () => {
    then('produces apply command with plan flag', () => {
```

#### rule.prefer.data-driven N/A

test cases use individual `given` blocks rather than data-driven. acceptable because:
- each case has unique verification
- not a simple transformer with uniform I/O

---

### file 3: `plan.ts` (changes only)

#### rule.require.what-why-headers ✅

new code has inline comments:
```ts
// capture original argv before it gets modified for passthrough args
const argvOriginal = [...process.argv];
```

```ts
// log apply hint
const applyCommand = asApplyCommandFromArgv({...});
```

#### rule.forbid.else-branches ✅

no else branches added. only new statements.

#### rule.require.narrative-flow ✅

additions maintain linear flow without nested branches.

---

## issue found: none

all code follows mechanic standards.

---

## non-issues confirmed

### internal functions not exported

`getInvocationPrefix` and `asApplyArgsFromArgv` are not exported.

**why this is correct:**
- they are internal utilities for `asApplyCommandFromArgv`
- no external consumer needs them
- follows `rule.require.single-responsibility` - one export per file

### no context parameter

functions take only `input`, no `context`.

**why this is correct:**
- these are pure transformers, no dependencies
- no io, no side effects
- `(input, context)` pattern only required when dependencies needed

---

## conclusion

**code follows mechanic standards.**

1. arrow-only functions ✅
2. input-context pattern ✅
3. what-why headers ✅
4. narrative flow ✅
5. no gerunds ✅
6. given-when-then tests ✅

no anti-patterns or deviations from conventions.
