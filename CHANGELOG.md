# Changelog

## Pending Oxlint / TypeScript 7 candidate

- Issue #44 follows #38/#31; replace ESLint/parser dependency stack with pinned Oxlint1.87.0 and trial TypeScript7.0.2.
- Preserve 62 native configured rule names and strict180/120 with a deterministic local guard, no forced peers/suppression.
- Disclose stricter compile-only CJS syntax and script-mode TSX octal diagnostics moving to mandatory compiler checking.
- Local clean install/check: 101 units, Electron smoke1 and all38 Linux E2E pass; same-source local lint median15.3x faster.
- Reviewable candidate only, no main merge, native acceptance, installer/artifact or release claim.

## Pending workspace isolation increment

- PR #41 / issue #40 implements the first bounded #4 capability after reviewed ADR 0005 approval, not the whole reliability roadmap.
- Independent healthy/unavailable workspace results, Chinese diagnostics and explicit retry/selection; no fake empty manuscript.
- Pure guarded reads, whole-workspace write gates, validated-before-commit selection and retained dirty input/baseline protection.
- Default Store/IPC/real Electron regressions cover corruption, missing files/read errors, all-failed/repair, save/restart and switching.
- No persisted format migration, automatic repair, transaction journal or backup policy. Implementation still needs independent review/merge.

## Pending toolchain upgrade

- Evaluate pinned Vite8.3.4 / React plugin6.1.2 / TypeScript6.0.3 with unchanged stable typescript-eslint; TS7 remains outside supported peers.
- Explicit ESM Vite config and client/CSS typing, with `.mts` source-limit regressions; no compiler/lint suppression or root module-mode switch.
- Record merged-main native/installer acceptance and close completed issues #3/#35; #33 already completed. Upgrade direction is confirmed and submitted for review; required GitHub approval, actual merge and upgraded native acceptance remain pending.

## Pending CI and licensing refresh

- Linux-only ordinary push/PR portable build and Electron E2E; main-only macOS/Windows verification gates main-only unsigned installer upload.
- Shared semantic workflow guard with negative event/platform/artifact regression cases.
- MIT for Composer-authored code/docs; verified CC0-1.0 framework and seven unchanged upstream skill bundles with retained licenses/provenance.
- Cleared superseded license warnings and updated fresh-context, review, CI and maintainer guidance; historical evidence stays dated.
- Synchronized the rewritten PR-stack parent without force-push or loss of newer continuity records.
- Strengthened required CI step/job failure gates and copied-file provenance inventory completeness.
- Added full specification/showcase freshness comparison and stale static markup/CSS regressions; regenerated showcase from the linted runtime.

## Unreleased source-size refactor

- Enforce strict ESLint 180-line files / 120-character lines, with boundary regressions.
- Split renderer components/hooks, Store responsibilities, design data/runtime and E2E fixtures/scenario groups.
- Expand source/test formatting without changing manuscript, AI or security behavior.
- Record Dependabot compatibility review and main ruleset merge blocker; do not claim blocked PRs merged.

Changes are tracked by reviewed commits and PRs. Entries under Unreleased are not tagged releases or installed-user guarantees.

## Unreleased

### Fixed

- Centralized Electron test launch environment and removed inherited Node-mode keys, including Windows case variants.
- Added a real desktop launch smoke test and four helper regressions.

### Changed

- Push/PR validation no longer builds installers or uploads artifacts. Main-only packaging requires successful desktop checks.

### Added

- Fresh-context AGENTS entry point, engineering loop, design/context/review templates, workstate and daily worklog.
- Repository-resident competitive research and roadmap/issue references.
- Contribution, security, community, CI, release and license-decision guidance; issue/PR templates and development hygiene checks.
- Project-specific skill adapters with pinned upstream provenance; no upstream bundles or scheduled executors are installed.

## 0.1.0 development snapshot

The original archive contained local workspaces/sessions, chapter/story-asset editing, snapshots, conflict guards, optional Chat Completions proposals, and Markdown export. It was imported in PR #1; it is not a signed stable release. See [verification history](docs/research/verification-results.md).
