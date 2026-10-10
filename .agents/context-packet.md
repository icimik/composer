# Document revision recovery context packet

- Issue/outcome: #42 under #4, continue draft #43 for coherent existing-document revisions and explicit recovery.
- Actual base main: `4cbdb07151d69de216e1a288713c382e5462896f`, merged tooling #45 and fixture repair #47 verified live.
  Own task branch rebased as requested; old head 81ef59f locally backed up, no shared/main rewrite.
  Main advanced during verification; second backup preserves cfb03b4. Adapter/test/probe bytes unchanged by both rebases.
- Working state: ongoing disk-adapter/review/document changes must be preserved. Exact latest head/checks belong to #43.
- Dependency: #41 merged/#40 closed with actual-main acceptance; #4 still open. ADR 0006 approval is separate.
- Decisions: approved sidecar/explicit consent/downgrade core at c9f8b27; sender now delegates measured allocation.
  [Decision record](https://github.com/icimik/composer/pull/43#issuecomment-6094957137).
  Chosen 256 MiB staged/256 MiB extra reserve, fixed parser compatibility, no pruning/automatic repair.
- Facts: 5M/35M chapterized samples support 1000 snapshots under 128 MiB, 5000 under 256 MiB, not 10000.
  One Linux large plan ran with ~785 MiB RSS/3.3 seconds; not whole-workspace GUI/native/max-budget assurance.
- Delivered scope: model and standalone guarded disk prepare/commit/install/preview/replay/complete, synthetic only.
  No active Store/IPC/UI recovery; complete journals retained. [Map](../docs/development/document-revision-core-handoff.md).
- Regressions: 8 disk cases failed first, then residual-scratch flush red/fix; 63 execution/30 replay child exits.
  Full current-head verification required; old 93/111/38 counts are historical after merged tooling.
- Review: two CodeRabbit documentation findings fixed; safe child status/signal suggestion adopted. No human runtime approval.
- Remaining: safe interrupted cleanup, active readiness/serialization/captured IDs/title baselines/IPC/UI consent,
  recovery E2E, large-plan responsiveness, native environments.
- Permission: own code/tests/issues/PR; requested own rebase with exact old-ref lease only.
  No merge/auto-merge/protection/release/delegation or #42/#4 closure.
- Next: read exact review/CI, add interrupted-cleanup regressions before product wiring. Rollback unused adapter/core has
  no user-file effect; future production downgrade requires pending-journal completion/validation.
