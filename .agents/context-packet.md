# Document revision recovery context packet

- Issue/outcome: #42 under #4, continue draft #43 for coherent existing-document revisions and explicit recovery.
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
  Changed-tree clean install/check passed 440 units, smoke 1 and 49 E2E; additional all-pending focused E2E passes.
  Worker moderate-history timer observation exists. Frozen current-head verification and review remain required.
- Remaining: independent current implementation review/merge, final Linux evidence, native/packaged/asar/maximum-budget
  workloads, actual power loss and merged-main acceptance. #42/#4 remain open.
- Permission: own code/tests/issues/PR; requested own rebase with exact old-ref lease only.
  No merge/auto-merge/protection/release/delegation or #42/#4 closure.
- Next: full check/smoke/E2E then accurate-head CI/review. No new resource/design approval question.
  Runtime rollback now requires completion/verified cleanup of active and retired evidence before downgrade.
