# Document revision recovery context packet

- Issue/outcome: #42 under #4, continue ready-for-review #43 for coherent existing-document revisions and explicit recovery.
- Actual base main: `4cbdb07151d69de216e1a288713c382e5462896f`, merged tooling #45 and fixture repair #47 verified live.
  Own task branch rebased as requested; old head 81ef59f locally backed up, no shared/main rewrite.
  Main advanced during verification; second backup preserves cfb03b4. Adapter/test/probe bytes unchanged by both rebases.
- Production entry head: `94f5162728d33e16062c89d8ca9e9026b867e23e`; tree clean before current follow-up.
  Fetch found no newer main. Repo permissions pull/push/maintain verified; existing own branch/PR reused.
  Current cleanup/review/test changes must be preserved. Exact new head/checks belong to #43.
- Dependency: #41 merged/#40 closed with actual-main acceptance; #4 still open. ADR 0006 approval is separate.
- Decisions: approved sidecar/explicit consent/downgrade core at c9f8b27; sender now delegates measured allocation.
  [Decision record](https://github.com/icimik/composer/pull/43#issuecomment-6094957137).
  Chosen 256 MiB staged/256 MiB extra reserve, fixed parser compatibility, no pruning/automatic repair.
- Facts: 5M/35M chapterized samples support 1000 snapshots under 128 MiB, 5000 under 256 MiB, not 10000.
  One Linux large plan ran with ~785 MiB RSS/3.3 seconds; not whole-workspace GUI/native/max-budget assurance.
- New authorization: sender approved the cleanup detail at 94f5162 and explicitly requested production Store/IPC/UI;
  [record](https://github.com/icimik/composer/pull/43#issuecomment-6095766007), not independent implementation approval.
- Current changed-tree scope: active readiness gate for both namespaces, captured identity/title baselines,
  worker-driven save/restore/accept + cleanup, strict IPC and Chinese explicit recovery controls.
  [Integration map](../docs/development/document-revision-integration.md); normal load/preview remain pure.
- Regressions: 8 disk cases failed first, then residual-scratch flush red/fix; 63 execution/30 replay child exits.
  Full current-head verification required; old 93/111/38 counts are historical after merged tooling.
- Review: read completed 67b5169 review 5478165876. All three findings valid: spacing, stale acceptance rows,
  exclusive partial write. Red-first guarded exception cleanup; original error/unknown replacement preservation tested.
  No independent implementation approval.
- Evidence: two readiness tests red first; 36 Store process cases and true Electron UI cases supplement adapter cases.
  Production code head 55adc9730b043d0ab23bd3990b81fa48d0e9cd22 passed clean install/check 440 units, probe 36,
  smoke 1/full 50 E2E and PR/push CI Linux only/artifacts 0.
  [Exact evidence](https://github.com/icimik/composer/pull/43#issuecomment-6095958804).
  Evidence-only follow-up needs its own frozen checks; at 09:06 UTC CodeRabbit processing, no independent approval.
  b8e9e1f local440/probe36/smoke1/E2E50 passed; later long accepted-continuation replay regression was red, now focused green.
  New unit count441 and final code-head full checks/CI/review still required; CI watcher hit shared-IP API403.
  Completed b8e9e1f review5478426682: both valid rollback/probe findings adopted with two report tests.
  Final default count443 requires its own accurate-head evidence; do not use the deliberately stopped7721cee local run.
- Remaining: independent current implementation review/merge, final Linux evidence, native/packaged/asar/maximum-budget
  workloads, actual power loss and merged-main acceptance. #42/#4 remain open.
- Permission: own code/tests/issues/PR; requested own rebase with exact old-ref lease only.
  No merge/auto-merge/protection/release/delegation or #42/#4 closure.
- Next: verify final review follow-up head then read completed CodeRabbit/human review, fix valid feedback.
  No new resource/design approval question, merge or closure authority.
  Runtime rollback now requires completion/verified cleanup of active and retired evidence before downgrade.
