# self-review: has-pruned-backcompat

## summary

reviewed backwards compatibility concerns. all are explicitly requested in criteria.

## backwards compat reviewed

### 1. passthroughArgs default value `[]`
- **location:** plan.ts parameter `passthroughArgs = []`
- **explicitly requested:** YES
- **evidence:** criteria usecase.6 states:
  > given('wish file does not parse args')
  >   when('user runs: npx declastruct plan --wish simple.ts --into plan.json')
  >     then('declastruct succeeds')
  >     sothat('backwards compatibility is preserved')
- **why it holds:** extant wish files that don't use passthrough args continue to work unchanged. the default empty array ensures process.argv contains only node and entry paths.

### 2. strict: false in parseArgs
- **location:** wish-with-args.fixture.ts
- **explicitly requested:** not a backwards compat concern - this is test fixture behavior
- **why it holds:** `strict: false` allows unknown flags to pass through, which is documented in the vision as user's responsibility

## conclusion

all backwards compatibility concerns are explicitly requested. no pruning needed.

