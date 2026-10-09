# Changelog

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
