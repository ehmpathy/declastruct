# self-review: has-consistent-mechanisms

## summary

reviewed new mechanisms against extant codebase patterns. no duplications found.

## mechanisms reviewed

### 1. process.argv injection (plan.ts)

**what:** `process.argv = [process.argv[0]!, process.argv[1]!, ...passthroughArgs]`

**searched for:** `process.argv` across src/

**result:** no extant pattern for process.argv manipulation. this is new functionality.

**why it holds:** this is the core mechanism for the passthrough args feature. no prior art exists because wish files previously had no way to receive args.

### 2. process.argv clear (apply.ts)

**what:** `process.argv = [process.argv[0]!, process.argv[1]!]`

**searched for:** same search as above

**result:** companion mechanism to (1). no duplication.

**why it holds:** both plan and apply need to control what the wish file sees in process.argv. consistent pattern between the two commands.

### 3. configureOutput for error interception (invoke.ts)

**what:** commander configureOutput with writeErr callback

**searched for:** `configureOutput` and `writeErr` across src/

**result:** no extant pattern. this is new functionality.

**why it holds:** this is the mechanism to intercept unknown option errors and add helpful hints. no prior art for commander error customization in this codebase.

### 4. allowExcessArguments (invoke.ts)

**what:** `.allowExcessArguments(true)` on plan and apply commands

**searched for:** n/a - standard commander API

**result:** standard commander pattern, not a custom mechanism.

**why it holds:** uses the library's built-in API for the intended purpose.

## conclusion

all mechanisms are new (part of this feature) or standard library APIs. no duplication of extant functionality.

