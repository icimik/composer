# Approved Oxlint CJS / type-check enhancements

Tracked in [#44](https://github.com/icimik/composer/issues/44) and [PR #45](https://github.com/icimik/composer/pull/45).
The [initial candidate](oxlint-verification.md) remains dated historical evidence, not the final configuration/performance.

## Authorization and scope

Maintainer follow-up accepts the migration direction, requests practical CJS/type-check strengthening, and asks to remove
draft for CodeRabbit review. [GitHub approval](https://github.com/icimik/composer/pull/45#pullrequestreview-5477840741)
is on `de2b3354fd9cf37c8d60b8c559d6a376fe046b2d`; it does not automatically approve later enhancement commits.
Formal review/fixes are authorized; merge, auto-merge, native dispatch, policy bypass and release are not.

## Stronger gates and actual fixes

- Pin `oxlint-tsgolint` 7.0.2003, no ESLint dependency or TypeScript peer ceiling. Enable type-aware lint and type-check
  diagnostics in root config. [Official documentation](https://oxc.rs/docs/guide/usage/linter/type-aware) describes the
  native Go TypeScript engine and separate rule/compiler diagnostics; keep `tsc --noEmit` as an independent gate.
- Enable `typescript/no-floating-promises`, `typescript/no-misused-promises`, `typescript/await-thenable` in the TS/MTS/TSX
  project scope. Existing React async event wrappers and handled save errors remain valid, without blanket suppression.
- Add native `no-eval`, `no-implied-eval`, `no-new-func`, `no-extend-native` errors for maintained source including CJS;
  retain compile-only strict CJS syntax and physical180/120 guards. These are static checks, not a security sandbox.
- Add compiler `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noImplicitOverride`, `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`. Indexed-access trial found three diagnostics: AI action tuples now retain tuple types;
  browser preview explicitly checks its initial document before access, with no non-null suppression.
- Type-aware lint found an unhandled `composerClose` Promise: return it into the existing flush/then/catch chain.
  A real Electron injected close-ready IPC rejection test failed first, then passed, retaining unsaved-close behavior.
  No IPC authorization, manuscript persistence or AI-acceptance semantics were weakened.
- Type-check diagnostics now reject script-mode TSX legacy octal even in standalone lint; the initial stage gap is removed.
  Regression tests assert the exact lint/compiler diagnostic and retain separate compiler rejection.

Broad strict `checkJs` on the dynamic Electron Store would require many parameter/exception/API annotations and an independent
typed-boundary design; the spike reproduced many errors, not a false pass. It is deferred rather than hiding errors with
`any`, `@ts-nocheck`, `strict:false` or blanket checking exclusions. CJS therefore has stronger syntax/static safety checking,
not a claim of whole-main-process type safety.

## Tests, stability and performance

Four additional unit cases exercise CJS safety, promise misuse/unhandled/await-thenable, handled promises and stronger
compiler flags. Lint fixtures now use independent temporary projects with copied config and a node_modules junction,
never source-tree mutations. A concurrent benchmark previously hit a tsgolint disappearing-fixture panic; discard that
measurement, isolate fixtures, then rerun on a stable source tree. Junctions support native Windows temp-project tests.
The injected close-rejection E2E observes actual IPC invocation and drains renderer tasks, with no fixed sleep, and passed
eight repeats. On 2026-10-10 06:03 UTC, full clean ci/tree/quality/type/build/design check passes105 units/zero failures/skips,
real Electron smoke1 and all39 E2E pass under Node22.23.3/Xvfb. Generated tracked screenshots restored; exact-head CI and
CodeRabbit readback follow submission, with final evidence recorded on #44/#45.

Final-config benchmark on the same enhanced candidate sources (91 files), Linux/Node22.23.3, one discarded warm-up and
12 alternating paired Node CLI runs, no simultaneous source mutations:

| Measurement | Baseline ESLint config | Enhanced Oxlint + type-aware + type-check + size/CJS guard |
| --- | --- | --- |
| Median wall time | 1622.5 ms | 870.5 ms |
| Range | 1522–1676 ms | 812–913 ms |
| Relative median | 1× | 1.9× faster |

ESLint samples (ms): 1632,1522,1650,1549,1591,1601,1624,1643,1629,1621,1676,1619.
Enhanced samples (ms): 812,828,839,899,913,862,866,865,877,891,905,875.
Baseline uses ESLint10.12.0 with its original config from main, invoked against the same candidate source. Enhanced lint
does additional analysis, so this is a practical final-step comparison, not equal-analysis throughput. The earlier15.3x
result applies only to the initial non-type-aware migration; it is not the current enhanced lint speedup.
No full-pipeline/platform performance guarantee is made.

## Delivery and remaining gates

Substantive enhancement head `bbfd29fb2a8999e971bbb02bbc71e166ad298552` passed
[PR Linux CI](https://github.com/icimik/composer/actions/runs/38029656342) and
[push Linux CI](https://github.com/icimik/composer/actions/runs/38029653394). Jobs/artifacts readback confirms only
Ubuntu22.04 verification, native/installer skipped without runners and zero artifacts for each run. #45 is no longer draft.
[CodeRabbit review](https://github.com/icimik/composer/pull/45#pullrequestreview-5477905390) completed on that full substantive
diff with no actionable findings/inline comments; verified optional missing-space wording is fixed. Bot excludes lockfile
by its filter, so local tree/package-lock inspection and dependency-policy regressions remain separate evidence.
This delivery-record follow-up is docs-only; final current-head CI/review is recorded on #44/#45.

Formal review is submitted; use this scope/current-head evidence for the final maintainer decision. Native/manual acceptance remains
post-authorized-main-merge; push/PR is Linux-only, zero artifacts, no installer/native allocation. Eight existing moderate
dev advisories remain. Rollback is the complete #45 candidate plus this follow-up; no release or migration writes occur.
Read CodeRabbit findings on the current head, fix verified findings with regressions and repeat affected checks.
Independent approval of the final revision and a separate maintainer merge decision remain required.
