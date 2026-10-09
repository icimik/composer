# TypeScript and Vite upgrade evaluation

Observed 2026-10-09 UTC. This is a tested draft candidate for [issue #38](https://github.com/icimik/composer/issues/38), not a shipped upgrade or permission to merge; its base is merged main `7e2c2dfe80ca1468bec58891d6ebd8a5668858d3`.

## Compatible candidate

| Component | Merged main | Candidate | Compatibility basis |
| --- | --- | --- | --- |
| Vite | 6.4.4 | 8.3.4 | Node `^20.19.0 || >=22.12.0`; existing Node 22 floor is sufficient ([npm metadata](https://registry.npmjs.org/vite/8.3.4), [6→7 guide](https://v7.vite.dev/guide/migration)). |
| React plugin | 4.7.0 | 6.1.2 | Requires Vite `^8.0.0`; optional Compiler/Babel peers are not needed for the existing configuration ([npm metadata](https://registry.npmjs.org/@vitejs/plugin-react/6.1.2)). |
| TypeScript | 5.9.3 | 6.0.3 | Stable bridge release; compatible with current parser range ([release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/), [parser metadata](https://registry.npmjs.org/typescript-eslint/8.71.1)). |
| typescript-eslint | 8.71.1 | unchanged | Supports TypeScript `>=4.8.4 <6.1.0`; TypeScript 7 remains unsupported ([supported versions](https://typescript-eslint.io/users/dependency-versions/)). |

Version/peer assertions above were also queried with exact `npm view <package>@<version>` calls. Direct dependency comparison against main shows only these three version changes; Node, Electron, React, ESLint and the parser are unchanged.

## Migration implications

Vite 8 replaces the Rollup/esbuild combination with Rolldown/Oxc and changes default CSS minification, browser targets and CJS interop; both [6→7](https://v7.vite.dev/guide/migration) and [7→8](https://vite.dev/guide/migration) guides were reviewed. This repository has only `react()` and `base: './'` in its Vite config, without custom Babel, Sass, SSR, manual chunks or transform options, so no speculative compatibility options are added.

The original `.ts` config produced a Vite native-loader readiness warning because ESM syntax was loaded as CJS. Rename only the config to `vite.config.mts`; leave root package semantics and Electron `.cjs` modules unchanged. Update the TS include and extend existing strict ESLint rules to `.mts`, with 180/181 and 120/121 regression coverage.

The first TS6 compile failed with TS2882 on `import './styles.css'`. Explicit `"types": ["vite/client"]` supplies Vite's client/CSS declarations, without suppressing checking. TS6 changes ambient-type defaults and serves as the bridge to TS7; retain explicit ES2022, strict, noEmit and Bundler resolution rather than adding `ignoreDeprecations` or wildcard ambient types ([TypeScript release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)).

## Isolated experiment

- Vite8/plugin6 with TS5.9: clean install, checks/build, 62 units, launch smoke and 23 E2E passed; the config warning was observed.
- Adding TS6 before config/type adjustments reproduced the CSS-import compile failure; no forced peer or compiler-error suppression was used.
- Combined adjusted candidate: clean `npm ci`, dependency tree, lint/format/docs/build, 63 units including `.mts` boundaries, smoke and all 23 E2E passed; design retains 76 contrast pairs and three negative token cases.
- Local Vite dev HTTP checks returned 200 for index, TSX transform and CSS; production preview returned 200 for index and its relative JS asset, with no server warnings. This is startup/HTTP evidence, not interactive HMR or native acceptance.
- Temporary servers stopped; generated screenshots restored. No main code, protection, release, signing or credentials changed.

GitHub candidate CI must be inspected after push. Ordinary PR/push retains Linux only, skipped native/installer jobs and zero artifact uploads. Native/installer evidence for this candidate can only follow authorized maintainer merge; merged main's previous native results do not prove the upgraded toolchain.

## Next increments and decisions

Prefer the compatible Vite8/plugin6/TS6 candidate as the first reviewable increment. Keep [plugin-only PR #30](https://github.com/icimik/composer/pull/30) open until the maintainer accepts its coordinated replacement; do not merge its incompatible standalone diff.

Keep [TS7 PR #31](https://github.com/icimik/composer/pull/31) open. Re-evaluate when stable typescript-eslint officially supports TS7 and the peer ranges agree, then repeat strict compiler/parser checks and all Electron tests. Do not adopt canary tooling, forced peers or a split compiler alias merely to claim “latest” support ([parser support policy](https://typescript-eslint.io/users/dependency-versions/)).

Maintainer decision remains whether to approve this draft direction and independent review. Revert the whole candidate PR to restore the prior lockfile, versions and config path if accepted upgrades regress; do not automatically merge a dependency bump or close this migration issue before actual main acceptance.
