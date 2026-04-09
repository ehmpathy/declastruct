# self-review r9: has-pruned-config

eliminate configuration options. hardcode until proven insufficient.

---

## method

for each potential configuration point, asked:
1. is this configurable in the blueprint?
2. should it be configurable?
3. what's the cost of hardcoded vs configurable?

---

## configuration points analyzed

### 1. snapshot file path

**is it configurable?** yes — user provides via `--snap <file>`.

**should it be configurable?** yes — user needs to control where output goes.

**why this config is justified:**
- matches `--into <file>` pattern for plan.json
- user may want different paths for different runs
- hardcoded path would be unusable

**verdict:** config is necessary. keep --snap flag.

### 2. snapshot format (JSON vs YAML)

**is it configurable?** no — JSON only.

**should it be configurable?**

i questioned this. YAML is often requested for IaC tools.

**arguments for config:**
- some users prefer YAML readability
- terraform supports multiple formats

**arguments against config:**
- vision specifies JSON output
- plan.json is JSON (consistency)
- YAML adds dependency (js-yaml or similar)
- no user has asked for YAML

**verdict:** no config. JSON only. YAGNI.

### 3. include/exclude resource filters

**is it configurable?** no — all wish resources included.

**should it be configurable?**

i questioned this. large infrastructures might want partial snapshots.

**arguments for config:**
- `--snap-include "Zone*"` could filter to specific classes
- could reduce snapshot size

**arguments against config:**
- vision says "snapshot only includes wish resources"
- filter adds complexity
- user can filter with jq after the fact
- no user has asked for this

**verdict:** no config. full snapshot. filter with jq if needed.

### 4. pretty print vs compact JSON

**is it configurable?** no — pretty print (implied by JSON.stringify indent).

**should it be configurable?**

**arguments for config:**
- compact saves bytes
- some tools prefer single-line JSON

**arguments against config:**
- plan.json uses pretty print
- snapshot is for human inspection (debug, audit)
- pretty print aids readability
- size difference is negligible for typical wish files

**verdict:** no config. pretty print matches plan.json pattern.

### 5. observedAt precision (seconds vs milliseconds)

**is it configurable?** no — uses ISO timestamp (milliseconds).

**should it be configurable?** no — ISO 8601 is the standard.

**verdict:** no config. use standard ISO format.

### 6. snapshot scope (wish-only vs all-remote)

**is it configurable?** no — wish resources only.

**should it be configurable?**

i questioned this. users might want to see ALL remote resources.

**arguments for config:**
- `--snap-all` could include remote resources not in wish
- useful for discovery

**arguments against config:**
- plan.json only includes wish resources
- "all remote" would require resource enumeration (different operation)
- discovery is a different usecase (not in vision)
- no user has asked for this

**verdict:** no config. wish-only matches plan.json scope.

---

## configuration NOT added

| potential config | why not added |
|------------------|---------------|
| --snap-format yaml | no user request, adds dependency |
| --snap-include/exclude | use jq for post-hoc filter |
| --snap-compact | pretty print aids readability |
| --snap-all | different usecase, not in vision |
| --snap-precision | ISO 8601 is standard |

---

## hard question: is ONE config flag enough?

the blueprint has exactly one config: `--snap <file>`.

**is this too minimal?**

i considered whether power users would feel limited.

**counter-argument:**
- power users can post-process with jq
- `cat snapshot.json | jq '.remote[] | select(.forResource.class == "Zone")'`
- config adds flags, flags add docs, docs add maintenance

**lesson:** config is not power. simplicity is power. one flag that does one job clearly.

---

## summary

**config points analyzed:** 6
**config in blueprint:** 1 (--snap file path)
**config NOT added:** 5

**why minimal config:**

1. the one config (file path) is necessary — user must control output location
2. all other configs would add complexity without proven demand
3. post-hoc tools (jq) handle filter/format needs

**principle applied:**

configuration is a commitment. each flag is documentation to write, tests to maintain, and edge cases to handle. add config when users prove they need it, not when we imagine they might.
