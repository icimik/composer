# Current workstate

- Focus: [issue #33](https://github.com/icimik/composer/issues/33), strict ESLint 180 physical lines / 120-character lines and cohesive source decomposition.
- Branch/base: `refactor/enforce-code-size-limits`, from main `a8fc96a883111279ee6a24334594248188c02312`; application PR #1 and foundations PR #25 were merged by the maintainer at 08:31 UTC.
- Baseline main: [run 37905610513](https://github.com/icimik/composer/actions/runs/37905610513) succeeded. Old open/stacked statements in historical evidence are not current state.
- Implemented: components/state/save/actions, Store method groups, design templates/linted runtime, per-test E2E fixture and three scenario specs. Formatting includes app/test JS/TS.
- Verified local: full checks, 37 unit tests, Electron smoke, all 23 E2E, 76 contrast checks / 3 negative token cases. Generated spec matches baseline bytes and showcase handler behavior matches baseline.
- Dependency review: [review record](../docs/development/dependency-review.md). #27/#28/#29/#32 are green scoped bumps; #30/#31 fail peer compatibility. All remain open.
- Merge permission: author approved Dependabot merges only. main ruleset 24777698 restricts updates with no bypass actors, so normal merge/squash is denied. Do not bypass, enable auto-merge or alter protection without approval.
- Refactor merge is not authorized. Submit PR, read exact-head native CI and obtain maintainer review.
- Policy unchanged: no PR/non-main installer build or artifact upload; successful main-only packaging, no public release.
- Unresolved: scoped main policy correction, supported Vite/plugin and TypeScript/parser migrations, license/framework rights, conduct contact, signing/manual acceptance and prior dev-toolchain advisories.
- Next: inspect refactor PR head/checks, report blocked Dependabot merges and ask for the minimum policy authorization. Do not start roadmap features.

Recover via root AGENTS, this snapshot, the research index, selected issue, live PR and exact-head CI; earlier chat is not authoritative.
