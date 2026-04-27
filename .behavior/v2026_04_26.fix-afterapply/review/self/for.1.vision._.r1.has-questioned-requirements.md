# self-review: has-questioned-requirements

## requirement 1: show apply command after plan

**who said this?** wisher (vlad), today
**evidence?** example output in wish shows desired UX
**what if we didn't?** user has to remember/lookup apply syntax - friction

**verdict: holds** ✅

this is the core ask. it's clear, valuable, and matches terraform's pattern.


## requirement 2: preserve env vars and caller context

**who said this?** wish mentions "caller may have used env vars"
**evidence?** the example shows `AWS_PROFILE=prep` preserved
**what if we didn't?** simpler implementation; user re-adds env vars

**verdict: questioned** 🤔

env vars are not in process.argv. we cannot reliably detect them.

options:
- A: promise what we can't deliver (bad)
- B: just show `npx declastruct apply --plan <file>` (terraform does this)
- C: document the limitation

**recommendation: option B.** terraform just shows `terraform apply`. users know their env vars. don't overcomplicate.

this simplifies the implementation significantly and sets realistic expectations.


## requirement 3: only replace --wish and --into flags

**who said this?** wish says "scope it only to the --wish and --into flags"
**evidence?** desire to preserve other flags user may have supplied
**what if we expanded scope?** cleaner transformation rules

**verdict: incomplete** 🤔

the wish says "only --wish and --into" but:
- `--snap` must also be removed (not used by apply)
- `-- passthrough` must also be removed (encoded in plan file)

these aren't "other flags the user supplied" — they're plan-specific flags that don't apply to apply.

**recommendation:** expand scope to transform all plan-specific flags, not just --wish and --into.


## requirement 4: same command, just replace flags

**who said this?** wish says "since its the same as the one used to run the plan"
**evidence?** intuitive UX — user sees what they ran, modified
**what if we didn't?** show static hint like `declastruct apply --plan <path>`

**verdict: holds with simplification** ✅

the core idea is good: show the apply command with the plan path.

but given:
- env vars aren't capturable
- the transformation is simpler than "replace your exact command"

we should just show:
```
to apply, run:
└─ npx declastruct apply --plan <actual-path>
```

static, predictable, honest.


## summary

| requirement | status |
|-------------|--------|
| show apply hint after plan | ✅ holds |
| preserve env vars | 🤔 drop — not technically feasible |
| only replace --wish/--into | 🤔 expand to include --snap and -- passthrough |
| same command, replace flags | ✅ simplify to static hint |

## simplified vision

instead of reconstructing the user's exact command, just emit:

```
🌊 planned for 4 resources
   into provision/aws.auth/account=prep/.temp/plan.json

   to apply, run:
   └─ npx declastruct apply --plan provision/aws.auth/account=prep/.temp/plan.json
```

this is:
- honest (no false promises about env vars)
- simple (no argv parse required)
- predictable (same output regardless of how user invoked plan)
- sufficient (user knows their own env vars)
