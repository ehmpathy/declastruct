# self-review: has-questioned-assumptions

## assumption 1: users run plan with npx

**what we assumed:** the hint should show `npx declastruct apply ...`
**evidence:** none — users might use `pnpm dlx`, `yarn dlx`, or installed globally
**what if opposite?** hint would be wrong for pnpm/yarn/global users

**verdict: issue found** 🔧

**fix:** we can detect this from process.argv[1] — it contains the path to the executable. but this is fragile.

**simpler fix:** just show `declastruct apply --plan <path>` without any prefix. the user invoked plan somehow; they know how to invoke apply.


## assumption 2: users want multiline output

**what we assumed:** multiline shell commands with `\` are preferred
**evidence:** wish shows multiline example, but that's just how it was formatted
**what if opposite?** single line is easier to copy-paste

**verdict: non-issue** ✅

**why it holds:** we can emit single-line. the wish example was formatted for readability in markdown, not a requirement for output format.


## assumption 3: the hint should appear in the summary block

**what we assumed:** hint goes after resource count in summary
**evidence:** wish shows this placement
**what if opposite?** could go elsewhere (separate section, different format)

**verdict: non-issue** ✅

**why it holds:** the wish explicitly shows placement. the position makes sense — after plan completes, before user's next prompt.


## assumption 4: `npx declastruct` vs `declastruct`

**what we assumed:** need to detect how user invoked
**evidence:** none — we inferred this from "preserve caller context"
**did wisher say this?** no — wisher said preserve env vars and flags, not the invocation method

**verdict: issue found** 🔧

**fix:** just emit `declastruct apply --plan <path>`. if user has it globally installed, great. if via npx, they'll add npx themselves. if via pnpm, they'll add pnpm dlx.

this is what terraform does — it shows `terraform apply`, not `brew run terraform apply` or whatever.


## assumption 5: users need to see the full path

**what we assumed:** show the literal path like `provision/aws.auth/account=prep/.temp/plan.json`
**evidence:** wish shows this; plan file path is output, user needs it for apply
**what if opposite?** could use shorthand or relative path

**verdict: non-issue** ✅

**why it holds:** the path must be accurate for the command to work. relative paths are fine (relative to cwd). absolute paths would cause confusion across machines.


## assumption 6: env vars matter for the hint

**what we assumed:** wish wants env vars preserved in hint
**evidence:** wish says "caller may have used env vars"
**what if opposite?** env vars not relevant to the apply command itself

**verdict: issue found** 🔧

this assumption led to complexity. the wish mentions env vars but:
- we can't detect them
- users remember their own env vars
- terraform doesn't try to preserve them

**fix:** already addressed in requirements review — drop the env var preservation.


## summary

| assumption | status |
|------------|--------|
| users run with npx | 🔧 fixed — just show `declastruct` |
| multiline preferred | ✅ holds — emit single line |
| hint in summary block | ✅ holds — matches wish |
| detect invocation method | 🔧 fixed — don't detect, just show binary |
| show full path | ✅ holds — needed for command to work |
| env vars matter | 🔧 fixed — already dropped in requirements |

## revised minimal output

```
🌊 planned for 4 resources
   into provision/aws.auth/account=prep/.temp/plan.json

   to apply, run:
   └─ declastruct apply --plan provision/aws.auth/account=prep/.temp/plan.json
```

no npx, no env vars, just the command that works.
