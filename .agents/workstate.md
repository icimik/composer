# Current workstate

- Focus: [#42](https://github.com/icimik/composer/issues/42) / [#43](https://github.com/icimik/composer/pull/43),
  document revision recovery under open #4. Gate: independent implementation review/merge, no merge/closure authority.
- Sender requested rebase, review fixes and measured allocation. Rebase onto merged #45 main
  `4cbdb07151d69de216e1a288713c382e5462896f` completed after #47 also merged during verification.
  Continuity conflicts only; dated main evidence preserved. #47 canonical lint fixture repair retained unchanged.
  Local `backup/revision-core-before-rebase-20261010` retains own old head `81ef59f`.
  Second backup `backup/revision-adapter-before-main47-20261010` retains cfb03b4; adapter bytes match after rebase.
- Keep merged Oxlint1.87.0/tsgolint7.0.2003/TS7.0.2, lockfile/strict compiler/close-rejection fixes.
  Historical toolchain records remain in main git history and [enhancement evidence](../docs/research/oxlint-enhancements.md).
- #40 closed after merged #41 readback. ADR 0006 core approved at c9f8b27; not human implementation approval.
- [Allocation delegation](https://github.com/icimik/composer/pull/43#issuecomment-6094957137): chosen 256 MiB staged
  payload / 256 MiB extra reserve. [Measurements/limits](../docs/research/revision-resource-allocation.md).
  128 MiB fits 1000 selected-chapter snapshots, not 5000; 256 fits 5000, not 10000. No unlimited-history promise.
- Sender approved cleanup at 94f5162 and requested production wiring;
  [authorization](https://github.com/icimik/composer/pull/43#issuecomment-6095766007).
  Core/cleanup design approval is not independent implementation approval or merge permission.
- Production candidate: both namespaces gate normal workspace readiness/writes; strict capture/digest identity,
  serialized worker plan/execute/cleanup for save/restore/accept; accepted proposal status shares the manifest image.
  Sender-validated IPC and Chinese preview/explicit confirmation controls are wired. Recovery never flushes/selects/hydrates.
  Dirty reopen retains original baseline; unchanged explicit reopen alone hydrates canonical after-state.
  [Integration map](../docs/development/document-revision-integration.md). #42 is not closed.
- Eight disk cases red before implementation; scratch-flush regression also observed red before fix.
  63 execution/30 replay child exits and deterministic EACCES/ENOSPC/EIO now covered; full exact counts belong to #43.
- CodeRabbit 67b5169 review 5478165876 returned: all three valid findings handled (spacing, stale table,
  owned partial-file removal). Two exclusive regressions were red first; cleanup success cases red before module.
  Prepared/complete cleanup has 138 actual child exits; unknown/link/third/ambiguous inventory and I/O refusal tests.
  Red-first self-review also requires re-flushing retirement parents before retry deletion after a prior sync failure.
  Completed 94f5162 bot review 5478298045 has no code blocker; optional wording adopted.
  First production code head 55adc9730b043d0ab23bd3990b81fa48d0e9cd22 passed exact-head local checks and both CI runs.
  [Evidence](https://github.com/icimik/composer/pull/43#issuecomment-6095958804): clean install/check 440 units/zero fail/skip,
  probe 36, smoke 1/full 50 Linux E2E; Ubuntu only, native/installer unassigned, artifacts 0.
  At 09:06 UTC new CodeRabbit processing, no completed production review/human approval. PR now ready, not draft.
- Two new readiness cases were red first. 36 actual production Store child exits supplement the 231 adapter cases;
  save/restore/accept real Electron kill/restart/confirm/open/save/restart scenarios exist with dirty/B/conflict/cleanup cases.
  Unchanged explicit-reopen E2E was red first, then only that unchanged branch was corrected.
  Worker 500-history sample: ~2029 ms, 386 parent callbacks, ~9.54 ms longest gap; observation, not maximum workload SLA.
- Large plan sample: 158,633,767 staged bytes, 3264 ms, 804020 KiB peak Linux RSS including fixture creation.
  Main-thread responsiveness/full-budget RSS/native ACL/flush/IME/accessibility/power-cut/real providers unverified.
- Previous authorized rebases completed. Current follow-up uses normal push, never overwrites another writer or main.
  No merge/auto-merge/protection/release/delegation/closure authority. #42/#4 stay open.
- Next: freeze this evidence-only follow-up, repeat its exact-head validation/CI and read CodeRabbit/human reviews.
  Prior changed-tree 49 E2E superseded by exact production-code 50; do not rewrite historical runs.
  b8e9e1f evidence-only local440/probe36/smoke1/E2E50 also passed. Subsequent red-first long continuation retry fix
  adds one unit (441); frozen new code head must be checked before final claims. Matching accepted continuation never appends
  twice before duplicate verification. CI watcher API403 shared-IP limit requires selective readback, not assumed results.
  No renewed design/resource question; fix valid feedback, stay at independent review/merge until maintainer authorizes.
  Both namespace journals must be resolved before rollback/downgrade; packaged/asar worker and native recovery unverified.
  Preserve queue/readiness/sender/path/symlink/hash/author/input guards, 180/120 and MIT/CC0.
