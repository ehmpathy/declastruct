# self-review: has-questioned-assumptions

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/3.3.1.blueprint.product.v1.i1.md`

---

## assumption 1: command.args contains passthrough args

**the assumption:** `command.args` in commander.js action callback contains the captured unknown flags.

**what if the opposite were true?** if `command.args` contained something else (like positional args only), the feature would silently fail.

**evidence check:**
- commander.js docs state that with `allowUnknownOption()`, unknown options appear in `command.args`
- this is documented behavior, not an assumption

**verdict:** evidence-based. holds.

---

## assumption 2: allowUnknownOption() is the right API

**the assumption:** commander.js `allowUnknownOption()` captures unknown flags without error.

**what if the opposite were true?** if it captured unknowns but also threw warnings, or if it stripped them, the feature would fail.

**alternatives considered:**
- parse process.argv ourselves: more code, duplicates commander's work
- use `passThroughOptions`: different semantics, for subcommand passthrough
- use custom arg parser: unnecessary, commander handles this

**evidence check:**
- commander.js docs confirm `allowUnknownOption()` prevents errors on unknown options
- the options appear in `command.args` when the action runs

**verdict:** evidence-based. holds.

---

## assumption 3: process.argv injection before import works

**the assumption:** if we modify process.argv before `await import(wishPath)`, the wish file's top-level code will see the modified argv.

**what if the opposite were true?** node might cache process.argv at startup, or the module might read argv before our injection completes.

**evidence check:**
- process.argv is a mutable array, not a frozen snapshot
- `await import()` is synchronous from the perspective of the imported module's top-level code
- the wish file's top-level parseArgs runs when the module loads, which is after our injection

**potential issue:** node module cache. if the wish file was previously imported, the cached version's top-level code won't re-run.

**mitigation needed?** no — in normal CLI usage, each `npx declastruct plan` is a fresh process. module cache only affects repeated imports within the same process.

**verdict:** holds for CLI usage. module cache is not a concern for the target use case.

---

## assumption 4: wish files use parseArgs from 'util'

**the assumption:** the fixture uses `parseArgs` from node's 'util' module.

**what if wish files use different parsers?** they might use:
- yargs
- commander
- minimist
- manual argv parse

**is this a problem?** no. all arg parsers read from process.argv. the blueprint injects args into process.argv, which all parsers will see.

**the fixture is an example, not a constraint.** wish files can use any parser.

**verdict:** not an assumption about wish files. the fixture demonstrates one approach. all approaches work because all parsers read process.argv.

---

## assumption 5: process.argv[0] and [1] should be preserved

**the assumption:** when we inject args, we preserve argv[0] (node path) and argv[1] (entry point path).

**what if the opposite were true?** if we set `process.argv = passthroughArgs` without preserving [0] and [1], parsers would see the wrong structure.

**evidence check:**
- node convention: argv[0] is the node executable, argv[1] is the entry point
- parseArgs and other parsers expect this structure
- `process.argv.slice(2)` is the idiomatic way to get user args

**verdict:** correct. preserving [0] and [1] matches the convention all parsers expect.

---

## assumption 6: apply command should ignore passthrough args

**the assumption:** apply uses the plan file's captured state and ignores any args passed at apply time.

**what if the opposite were true?** if apply re-parsed args, it could diverge from the planned state.

**evidence check:**
- vision explicitly states: "apply should NOT support `--` args"
- rationale: "the plan file captures complete resource state at plan time"
- if apply used different args, it would be a different state than was planned

**verdict:** intentional design decision, not an assumption. documented in vision.

---

## simpler approaches considered

### could we avoid process.argv injection entirely?

**alternative:** pass args as a parameter to getResources() and getProviders().

**why this was rejected:**
- vision says "wish files parse args themselves via standard node patterns"
- a parameter would require declastruct-specific API in wish files
- process.argv injection is transparent — wish files work like normal CLI tools

**verdict:** simpler alternative exists but was rejected for good reasons in vision. not an oversight.

### could we use environment variables instead?

**alternative:** set env vars like `DECLASTRUCT_ENV=prod` instead of process.argv.

**why this was rejected:**
- requires wish files to read env vars, not args
- breaks the CLI-like mental model
- vision explicitly chose process.argv injection

**verdict:** simpler alternative exists but was rejected in vision. not an oversight.

---

## summary

**assumptions questioned:** 6
**assumptions found unsupported:** 0
**simpler alternatives found:** 2 (both rejected in vision for good reasons)

all technical decisions in the blueprint trace to either:
- documented API behavior (commander.js)
- node.js conventions (process.argv structure)
- intentional vision decisions (apply ignores args)

no hidden assumptions found. the blueprint is based on evidence and documented decisions.
