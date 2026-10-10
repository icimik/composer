# Current workstate

## Merged toolchain wrap-up and native fixture repair

- Maintainer merged #45 at main `0a533f081f5f62f0b9c0ae1bc39f7fd277c44a68`, 2026-10-10 06:50:57 UTC.
- #31 automatically closed by Dependabot 06:53:19 UTC: manifest/lock already TS7.0.2; no unique application change.
  Supersession comment added, no duplicate merge/reopen/ignore command or branch deletion.
- Actual [main CI](https://github.com/icimik/composer/actions/runs/38032356195): Linux success; Windows check100 passes/
  zero failures/5 pre-existing platform skips, smoke1/all39E2E pass; macOS: 9 lint fixture failures (96/105), actual
  lint/type/build pass but smoke/E2E skipped. Overall failed, installer stage skipped, 0 artifacts.
- Focus [#46](https://github.com/icimik/composer/issues/46) under #44/#38: main-based clean
  `fix/lint-fixture-canonical-path` worktree; [context/design/evidence](../docs/research/oxlint-merge-handoff.md).
- Aliased-temp-root root-config failure reproduced on Linux; two regressions red first, canonical temp-root plus preserved
  non-JSON subprocess diagnostics now pass. No runtime/source/dependency/CI/check weakening. Clean local ci/check107/zero
  skips, smoke1/all39E2E passes; generated screenshots restored, eight prior moderate dev advisories unchanged.
- Repair [#47](https://github.com/icimik/composer/pull/47), head `5ef462514387b46bd45ab61683c1d09557eaa2dc`:
  [PR CI](https://github.com/icimik/composer/actions/runs/38032925909) and
  [push CI](https://github.com/icimik/composer/actions/runs/38032922819) success, Linux only, 0 artifacts.
  [CodeRabbit review](https://github.com/icimik/composer/pull/47#pullrequestreview-5478061762) has no code findings;
  optional status-spacing suggestions verified and adopted. Final documentation-only head evidence belongs to #46.
- Next: maintainer approving review and explicit repair-merge decision; GitHub still requires human review.
  Actual fixed macOS/Windows acceptance only after authorized main merge. #44/#38/#46 remain open.
- Allowed: scoped repair/commit/push/review, issue handoff. No new merge, native dispatch, release, protection bypass,
  auto-merge or force-push. Earlier #45 approval/merge does not authorize a new fix merge.

## Historical pre-merge candidate handoff

## Approved enhanced tooling candidate

- #44/#45 same main-based worktree; main remains `c4e5405`. Maintainer accepts migration direction, requests practical
  CJS/type-check enhancement and formal CodeRabbit review. GitHub kimmywork approval on `de2b335` verified; no merge permission.
- [Current scope/evidence](../docs/research/oxlint-enhancements.md) supersedes initial type-aware exclusions/performance.
- Pinned tsgolint7.0.2003, type-aware/typeCheck root options, three focused Promise/await rules, four source/CJS safety rules,
  five strict compiler flags. Standalone lint now catches script-mode TSX octal; independent tsc remains mandatory.
- Fixed unhandled composerClose rejection (real Electron red regression), indexed tuple/document accesses. No broad checkJs,
  any/nocheck/compiler suppression, IPC/storage/AI/provenance/CI changes. Temporary lint projects eliminate source scan races.
- Local clean ci/tree/check105 units/zero skips, smoke1/all39E2E and eight close-rejection repeats pass; paired stable-tree
  enhanced median870.5ms vs ESLint1622.5ms (1.9x), not initial15.3x. #45 is ready for formal review, draft removed.
- Enhancement head `bbfd29fb2a8999e971bbb02bbc71e166ad298552`: [PR CI](https://github.com/icimik/composer/actions/runs/38029656342)
  and [push CI](https://github.com/icimik/composer/actions/runs/38029653394) success; only Ubuntu22.04, native/installer
  skipped with no runner, artifacts=0 each.
- [CodeRabbit review](https://github.com/icimik/composer/pull/45#pullrequestreview-5477905390) inspected full base→bbfd29f
  substantive diff, no actionable findings/inline comments. Optional missing-space note verified/fixed in docs; no bot
  autofix or delegation. Lockfile excluded by bot filter, inspected locally and guarded by package/config tests instead.
- Final follow-up is documentation-only; exact-current-head CI/review evidence belongs to #44/#45 comments. No stale
  human approval is claimed for new heads; maintainer reapproval/merge decision and actual native acceptance remain.
- Allowed: commit/push/same-PR formal review and valid feedback fixes. No merge/auto-merge/native/release/protection bypass,
  force-push or issue closure; #31/#38/#44 remain open. Earlier approval does not automatically approve later heads.

## Initial tooling candidate snapshot

- Focus: [#44](https://github.com/icimik/composer/issues/44), complete Oxlint migration / TypeScript7.0.2 candidate.
- Recovered main `c4e5405697ed27730ed9888816b3fe732f4470f1`; clean clone, independent `chore/oxlint-ts7` worktree.
  #39 is merged. #31 remains open and fails clean install on typescript-eslint peer range. #43 is unrelated.
- [Context](../docs/development/oxlint-context.md), [design](../docs/development/oxlint-migration.md),
  [evidence/gaps](../docs/research/oxlint-verification.md). Historical workspace-isolation handoff below is preserved.
- Oxlint1.87.0 removes all ESLint/parser packages; TS6 lint/build passed before TS7 trial. TS7 install/build and 13 focused
  size/native/compiler/config regressions pass, no force/legacy peers. No runtime, CI or upstream changes.
- Explicit tradeoffs: compile-only strict CJS syntax; script-mode TSX legacy octal moves to mandatory compiler gate;
  two native nursery rules are explicitly enabled. Strict 180/120 retained; no alpha JS plugins or type-aware engine.
- Full local clean ci/tree/check: 101 units/zero failures/skips, smoke1 and all38 Linux E2E passed.
  Same-main-source paired benchmark (87 files, Node22,12 alternating runs): ESLint median1614ms, Oxlint+guard105.5ms,
  15.3x local lint speedup; no full-pipeline performance promise. Generated screenshots restored.
- Submission: [draft PR #45](https://github.com/icimik/composer/pull/45), implementation `927409884171766fc26ba9b60eeabd698d8a54d7`.
  Scoped self-review conditional pass, no independent approval. Draft preserves maintainer choice on the disclosed
  diagnostic-stage/CJS differences before formal review. Current-head remote CI and final handoff are recorded on #44/#45.
- Next: read exact-current-head PR/push Linux CI, zero artifacts and no allocated native/installer runners; hand off.
  Only the maintainer may accept direction, request formal review and later authorize merge.
- Allowed: scoped implementation/commit/push/PR and issue updates. No merge/release/auto-merge/protection change,
  force-push/native dispatch/artifact upload or issue closure. #31/#38/#44 remain open.

## Historical workspace-isolation handoff

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
- Final runtime follow-up: verified architecture-summary concern about async proposal resolution. Added actual gated main
  read regression (red first), then held the existing shared transition lock through resolve/discard completion. Switch,
  retry and typing cannot overtake it; a new fault rejects before writing. Both UI paths passed six repeats each.
  Local full check: 93 units/zero skips, smoke 1, all 38 E2E (15 isolation UI paths). Final head/CI are on #41.
  Partial-write transactions remain out of scope; optional bulk docstring coverage not adopted (no repository gate).
- Performance: 64 synthetic docs, one local readiness 12.0ms/guarded save 16.9ms; not a workload/platform guarantee.
- Environment: isolated Node22.23.3/current lockfile/Electron44.7.0/Xvfb; no package, workflow, provenance or upstream update.
  Eight existing moderate dev advisories remain. Native candidate/ACL/manual IME/accessibility/global native dialog unverified.
- Authorization: commit/push/update #41 and issue, formally submit for review/fix valid feedback. No merge, auto-merge,
  protection edit, force-push, release, scheduler or delegation. #40 and #4 remain open until actual merged acceptance.
- Scope exclusions: transactions/journal, backups/retention/repair, schema/DB migration, watcher/sync/accounts/new AI/IF/VN.
  Existing IPC sender/context isolation/path/symlink/serial/hash/AI-author safety, 180/120, MIT/CC0 and Linux CI retained.
- Next: read current-head CodeRabbit/human findings and exact-head CI on #41; fix valid findings and repeat verification.
  No implementation approval inherited from the earlier design-only head. Stop at review/merge; only maintainer can merge.
