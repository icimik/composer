# Current workstate

- Focus: [#40](https://github.com/icimik/composer/issues/40), bounded workspace fault isolation under
  [#4](https://github.com/icimik/composer/issues/4), continuing in [PR #41](https://github.com/icimik/composer/pull/41).
- Base main: `efcd507670b4a7d68c78a6f1b314c667ac5134ba`, fetched unchanged. Existing own branch
  `design/workspace-failure-isolation-20261009`, clean prior head `70d4f8925a2fd8995e455fdf9cc6fa82adcdc9d1`; no stack.
- Design: [ADR 0005](../docs/decisions/0005-workspace-failure-isolation.md) accepted by maintainer kenpusney via verified
  follow-up; [record](https://github.com/icimik/composer/pull/41#issuecomment-6092557163), reviewed SHA `70d4f892`.
  Same-PR implementation explicitly requested, superseding separate-PR plan. Not approval of implementation or merge.
- Candidate: pure guarded reads; discriminated load results; sanitized identity/reason/retry diagnostics; no automatic
  active fallback; complete pre-write readiness; validated/copied registry commit; transition lock; retained dirty input/hash.
- Evidence: nine red acceptance regressions failed before production edits, now pass. Historical defect probes archived in
  git, replaced by default acceptance tests. [Test map/limits](../docs/research/workspace-isolation-verification.md).
- Local: full check passed 89 units/zero skips, smoke 1/1 and 35 Linux Electron E2E, including 12 new isolation UI paths.
  Diagnostic screenshot visually inspected. Final exact-head install/check/CI and review must be read after commit/push.
- Performance: 64 synthetic docs, one local readiness 12.0ms/guarded save 16.9ms; not a workload/platform guarantee.
- Environment: isolated Node22.23.3/current lockfile/Electron44.7.0/Xvfb; no package, workflow, provenance or upstream update.
  Eight existing moderate dev advisories remain. Native candidate/ACL/manual IME/accessibility/global native dialog unverified.
- Authorization: commit/push/update #41 and issue, formally submit for review/fix valid feedback. No merge, auto-merge,
  protection edit, force-push, release, scheduler or delegation. #40 and #4 remain open until actual merged acceptance.
- Scope exclusions: transactions/journal, backups/retention/repair, schema/DB migration, watcher/sync/accounts/new AI/IF/VN.
  Existing IPC sender/context isolation/path/symlink/serial/hash/AI-author safety, 180/120, MIT/CC0 and Linux CI retained.
- Next: freeze implementation head, run clean install/check/smoke/full Linux E2E, read CI jobs/artifacts and independent
  review on #41. No approval inherited from the earlier design-only green head. Stop at review/merge.
