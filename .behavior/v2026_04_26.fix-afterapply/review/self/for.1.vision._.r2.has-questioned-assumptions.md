# self-review r2: has-questioned-assumptions

🍵 tea first.

---

## fresh eyes on the vision

i re-read the vision document line by line after updating it in r1.

### found issues

#### issue 1: bare `declastruct` won't work for npx users

**the assumption:** `declastruct apply --plan <path>` will work
**what i missed:** user ran `npx declastruct plan ...`, so `declastruct` isn't in their PATH
**what if opposite:** command fails, user frustrated

**how i fixed it:**
- changed hint from `declastruct apply --plan` to `npx declastruct apply --plan`
- npx works universally: finds global install or downloads

**what i learned:** always consider how user invoked the tool, not just what flags they used.

---

#### issue 2: vision showed wrong output format

**the assumption:** wish wants new format `🌊 planned for 4 resources`
**what i verified:** checked plan.ts lines 142-148, current format is `🌊 declastruct plan` + `├─ resources: N`
**what i realized:** wish example showed a format change, but wish TEXT only asks for "the command to run"

**how i fixed it:**
- changed vision "after" to use current format
- appended hint to current format instead of inventing new format
- scope stays focused on the actual ask: show the apply command

**what i learned:** distinguish between "example formatting" in a wish and "actual requirements" in the wish text.

---

### non-issues (why they hold)

#### assumption: single-line command is better

**the assumption:** emit `npx declastruct apply --plan <path>` as one line
**why it holds:**
- one triple-click to select entire line
- no shell escape issues with multiline `\`
- cleaner visual presentation

---

#### assumption: relative path is correct

**the assumption:** show path as user provided (relative)
**why it holds:**
- user runs apply from same directory as plan
- if they cd elsewhere, they adjust path — their responsibility
- absolute paths would break across machines

---

#### assumption: hint goes inside summary block

**the assumption:** `└─ to apply, run:` as last item in tree
**why it holds:**
- mirrors terraform's output structure
- keeps related info together
- natural flow: here's what we did → here's what to do next

---

## vision is now accurate

| aspect | status |
|--------|--------|
| command format | ✅ `npx declastruct apply --plan <path>` |
| output format | ✅ matches current code structure |
| hint placement | ✅ inside summary block |
| path style | ✅ relative, as given |
| line style | ✅ single line |

---

## lesson

**verify against source code, not just the wish.**

the wish showed an example that included incidental formatting changes. i almost built to the example format instead of the actual requirement. checking plan.ts caught this.
