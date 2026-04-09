# self-review: has-pruned-yagni (round 5)

## reviewed artifact

`.behavior/v2026_04_07.wish-arg-passthrough/3.3.1.blueprint.product.v1.i1.md`

---

## what is YAGNI?

"You Ain't Gonna Need It" — the principle that we should not add functionality until it is necessary.

**signs of YAGNI:**
- "for future flexibility"
- "while we're here, let's also..."
- abstraction without current need
- features not in requirements

---

## component-by-component YAGNI audit

### invoke.ts changes

| line added | requested by | YAGNI? |
|------------|--------------|--------|
| `.allowUnknownOption()` | vision: "commander captures unknown flags via `allowUnknownOption()`" | no |
| `.usage('...[-- <wish-args>]')` | criteria usecase.4: "help output shows [-- <wish-args>]" | no |
| `const passthroughArgs = command.args` | required to pass captured args | no |
| `passthroughArgs` param in call | required to pass captured args | no |

**verdict:** 4 lines, all required. no YAGNI.

---

### plan.ts changes

| line added | requested by | YAGNI? |
|------------|--------------|--------|
| `passthroughArgs = []` param | required to receive args from invoke | no |
| `passthroughArgs?: string[]` type | required for param | no |
| `process.argv = [...]` injection | vision: "declastruct replaces process.argv with captured unknowns" | no |

**verdict:** 3 additions, all required. no YAGNI.

---

### wish-with-args.fixture.ts

| component | requested by | YAGNI? |
|-----------|--------------|--------|
| parseArgs call | required to demonstrate arg reception | no |
| `env` option | used to verify arg passthrough | no |
| suffix logic | used to verify arg affected output | no |
| getResources export | required fixture API | no |
| getProviders export | required fixture API | no |

**question:** is this fixture the minimum viable?

**analysis:**
- could we use a simpler fixture? the fixture needs to:
  1. read process.argv
  2. produce different output based on argv
  3. be verifiable by tests

- the current fixture does exactly this with ~15 lines
- no abstraction, no extra features
- the comment on module cache is documentation, not a feature

**verdict:** minimal fixture. no YAGNI.

---

### test cases

| test | criteria trace | YAGNI? |
|------|----------------|--------|
| 'should pass args to process.argv' | usecase.1: "wish file sees --env prod" | no |
| 'should strip -- separator' | usecase.1: "-- stripped" in criteria | no |
| 'should pass multiple args' | usecase.1: "multiple args" variation | no |
| 'should work without passthrough args' | usecase.2: "plan without passthrough args" | no |
| 'should ignore passthrough args' | usecase.3: "apply ignores passthrough args" | no |

**verdict:** 5 tests, all trace to criteria. no YAGNI.

---

## "nice to have" features NOT added

the vision mentioned some items as future work. we did NOT add them:

| feature | in vision | in blueprint | decision |
|---------|-----------|--------------|----------|
| typed args utility | "a declastruct utility for common arg parse patterns will be available in the future" | no | correctly deferred |
| arg validation | not requested | no | correctly omitted |
| env var fallback | not requested | no | correctly omitted |
| config file | not requested | no | correctly omitted |

**verdict:** resisted scope creep. only implemented what was requested.

---

## previously deleted YAGNI

in earlier reviews, we found and deleted:

| item | found in review | status |
|------|-----------------|--------|
| process.argv restoration | has-questioned-deletables | deleted from blueprint |

**this confirms:** we are vigilant about YAGNI. when we find it, we delete it.

---

## summary

**YAGNI items found in this review:** 0

the blueprint is minimal:
- invoke.ts: 4 lines, all traced to requirements
- plan.ts: 3 additions, all required
- fixture: ~15 lines, minimal viable implementation
- tests: 5 cases, all traced to criteria

no "future flexibility" abstractions.
no "while we're here" features.
no optimization before need.

**the blueprint is YAGNI-free.**
