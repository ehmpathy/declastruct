# self-review: has-pruned-backcompat

## summary

reviewed backwards compatibility concerns. all are explicitly requested in criteria.

## backwards compat reviewed

### 1. passthroughArgs default value `[]`

**location:** plan.ts line 23: `passthroughArgs = []`

**explicitly requested:** YES

**evidence from criteria (usecase.6):**
```
given('wish file does not parse args')
  when('user runs: npx declastruct plan --wish simple.ts --into plan.json')
    then('declastruct succeeds')
    then('wish file sees empty args in process.argv')
      sothat('backwards compatibility is preserved')
```

**why it holds:**
- extant wish files that don't parse args get an empty process.argv (just node + entry paths)
- no change in behavior for users who don't use passthrough args
- test confirms this: `'should work without passthrough args (backwards compat)'`

### 2. strict: false in parseArgs

**location:** wish-with-args.fixture.ts line 25

**explicitly requested:** not a backwards compat concern - test fixture behavior only

**why it holds:**
- `strict: false` allows unknown flags through to user's arg namespace
- vision explicitly states: "user owns their arg namespace after --"
- this is internal test behavior, not public API

## other backwards compat points reviewed

### 3. allowExcessArguments on apply command

**location:** invoke.ts apply command

**explicitly requested:** YES, indirectly via criteria usecase.3 (apply ignores passthrough args)

**why it holds:**
- without this, `apply --plan p.json -- --env prod` would error
- with this, excess args are silently ignored as criteria specifies

## conclusion

all backwards compatibility concerns are explicitly requested or serve documented behavior. no prune action required.

