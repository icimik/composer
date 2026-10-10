# Oxlint / TypeScript 7 candidate verification

Historical initial-candidate snapshot. The maintainer approved follow-up strengthens CJS/type checking and changes the
final performance/configuration; see [current enhancement evidence](oxlint-enhancements.md), not the15.3x snapshot below.

Candidate for [#44](https://github.com/icimik/composer/issues/44), following
[#38](https://github.com/icimik/composer/issues/38) and [#31](https://github.com/icimik/composer/pull/31).
Base main: `c4e5405697ed27730ed9888816b3fe732f4470f1`. This document records candidate evidence, not merged acceptance.
Submitted as [draft PR #45](https://github.com/icimik/composer/pull/45), implementation head
`927409884171766fc26ba9b60eeabd698d8a54d7`; final current-head remote evidence is recorded on #44/#45.

## Observed compatibility

Oxlint 1.87.0 replaces ESLint10, @eslint/js, globals and typescript-eslint8.71.1. None remain in the lockfile.
TypeScript7.0.2 cleanly installs and passes `tsc --noEmit && vite build`; Node22.23.3, Electron44.7.0, Vite8.3.4 and
React plugin6.1.2 are unchanged. No force/legacy peers, compiler suppression, type-aware engine or JS plugin is used.
All retained package versions besides TypeScript match the base lockfile; platform bindings are added as optional packages.
Eight existing moderate development dependency advisories remain; no unrelated audit fix was applied.

## Coverage and differences

See [the design/rule mapping](../development/oxlint-migration.md) and
[context packet](../development/oxlint-context.md). Explicit config preserves 62 native rule names and relevant
file/global/severity/options overrides. The local scanner preserves strict 180 physical lines / 120 Unicode codepoints,
tab width2, CRLF/final-newline handling and no content exemptions for JS/CJS/MJS/TS/MTS/TSX.

CJS strict compile-only guarding rejects unsupported duplicate arguments and legacy octal; Node compiles but never
evaluates fixtures. This deliberately rejects other strict-only syntax too, without changing runtime strictness.
ESM/native TSX modules reject legacy octal directly; duplicate TS parameters are rejected by native `no-redeclare`.
Script-mode TSX legacy octal is rejected by the mandatory compiler/build/check gate, not standalone `npm run lint`.
That diagnostic-stage difference and Oxlint nursery `no-undef`/`no-useless-assignment` remain explicit review tradeoffs.

Initial size-test run failed on missing scanner. Native-rule regressions exposed the script-mode TSX octal gap, which
the compiler regression now documents. All 13 focused size/config/compiler/native-rule tests pass with TS6 and TS7.
Tests preserve Node/browser scope, unused-variable policy and generated-output exclusions; no application code changed.

## Full validation and performance

On 2026-10-10 UTC, clean `npm ci`, valid dependency tree, lint/format/docs/type/build/design checks, 101 units (zero failures
or skips), one real Electron launch smoke and all 38 Linux Electron E2E passed under Node22.23.3/Xvfb. Generated tracked
screenshots were restored; no application code or workflow changed. Exact-head remote CI is the remaining submission gate.
Local Linux results cannot establish macOS/Windows runtime/native acceptance. Installer packaging/artifact upload is
forbidden for this branch.

Paired benchmark: unchanged main `c4e5405`, 87 maintained source files, Linux/Node22.23.3, same tree/config scope, one warm-up
discarded per command, then 12 alternating paired process-wall-time runs. ESLint10.12.0 vs Oxlint1.87.0 **plus** the source
size/strict-CJS guard, both invoked as Node CLI processes; no npx/npm startup included. Candidate config was temporarily
copied beside the baseline sources because absolute external configs resolve overrides relative to their own directory;
that initial invalid benchmark was discarded. Base tree was clean after removal.

| Measurement | ESLint | Oxlint + guard |
| --- | --- | --- |
| Median | 1614 ms | 105.5 ms |
| Range | 1562–1670 ms | 96–115 ms |
| Relative median | 1× | 15.3× faster |

Raw ESLint samples (ms): 1641, 1636, 1562, 1576, 1670, 1585, 1619, 1667, 1562, 1565, 1610, 1618.
Raw Oxlint+guard samples (ms): 108, 114, 103, 101, 110, 96, 108, 100, 113, 100, 115, 97.
This is a local lint-step measurement, not a guaranteed speedup for the full check/E2E pipeline or other platforms.

## Review and handoff

Scoped self-review: conditional pass for the candidate. Package/lock diff removes the peer ceiling with no unrelated retained
version changes; no renderer/main-process/security/AI/storage/CI/upstream diff. Full quality gate retains rejected inputs,
with the disclosed TSX diagnostic-stage tradeoff and stronger CJS compile-only syntax. Tests use synthetic fixtures only.
Native/runtime/manual acceptance, independent approval and maintainer acceptance of diagnostic differences are unaudited.
No blocking self-review defect remains; self-review is not a human GitHub approving review.

Self-review is not independent approval. No merge, auto-merge, release, force-push, protection change, native dispatch or
issue closure is authorized. Keep #31/#38/#44 open pending the relevant actual acceptance; a maintainer decides merge.
Rollback restores the complete prior config/package/lockfile/tests by reverting this candidate.
