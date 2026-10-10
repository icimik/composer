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
- Submission: #41 ready for independent review. Final runtime/test head `3ef63d68e9cff8abab97066cee9b77539e070aea`;
  repeated clean npm ci/locked Electron installation/check: 93 units/zero failures/skips, smoke 1 and 36 Linux Electron E2E
  (13 new isolation UI paths). Diagnostic screenshot visually inspected; generated tracked screenshots restored.
  [PR CI](https://github.com/icimik/composer/actions/runs/38018289253) and
  [push CI](https://github.com/icimik/composer/actions/runs/38018286202) succeeded at that SHA: Ubuntu22.04 only,
  native/installer jobs skipped without runner, artifacts=0 each. Final documentation head requires exact-head readback.
- Review: [CodeRabbit review](https://github.com/icimik/composer/pull/41#pullrequestreview-5477145993) posted four findings.
  All verified valid and fixed: date, retry wording, over-disabled new/read-only dialogs, exception-safe fixture cleanup.
  Additional red UI assertion found a silently rejected Ctrl+S in suspended mode; now visibly reports refusal.
- Latest revision: second CodeRabbit cleanup finding adopted after two red regressions; every callback attempted and close
  error remains primary cause. Head `3773438` PR CI passed but push CI failed at premature Ctrl+S during retry; the local
  follow-up also exposed a running-clock autosave race in another test. Three clock-controlled tests now explicitly pause
  time and await completed transitions. Each passed 12 repeats; full check 93 units/zero skips, smoke 1 and all 36 E2E pass.
  Optional approval-wording comment adopted; additional LGTM comments require no change. No finding rejected.
  Final head/CI and independent review readback belong to the #41 verification comment. No human approving review,
  merge permission or bot autofix/delegation.
- Performance: 64 synthetic docs, one local readiness 12.0ms/guarded save 16.9ms; not a workload/platform guarantee.
- Environment: isolated Node22.23.3/current lockfile/Electron44.7.0/Xvfb; no package, workflow, provenance or upstream update.
  Eight existing moderate dev advisories remain. Native candidate/ACL/manual IME/accessibility/global native dialog unverified.
- Authorization: commit/push/update #41 and issue, formally submit for review/fix valid feedback. No merge, auto-merge,
  protection edit, force-push, release, scheduler or delegation. #40 and #4 remain open until actual merged acceptance.
- Scope exclusions: transactions/journal, backups/retention/repair, schema/DB migration, watcher/sync/accounts/new AI/IF/VN.
  Existing IPC sender/context isolation/path/symlink/serial/hash/AI-author safety, 180/120, MIT/CC0 and Linux CI retained.
- Next: read current-head CodeRabbit/human findings and exact-head CI on #41; fix valid findings and repeat verification.
  No implementation approval inherited from the earlier design-only head. Stop at review/merge; only maintainer can merge.
