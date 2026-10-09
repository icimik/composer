# Current workstate

- Focus: [#40](https://github.com/icimik/composer/issues/40), first bounded isolation candidate under
  [#4](https://github.com/icimik/composer/issues/4). No transaction/backup/migration implementation or parent closure.
- Base: fetched actual main `efcd507670b4a7d68c78a6f1b314c667ac5134ba`; fresh clean clone, new
  `design/workspace-failure-isolation-20261009`, no stack or reused deleted branch.
- Live correction: [#39](https://github.com/icimik/composer/pull/39) merged 12:02 UTC with independent approval.
  [Main run](https://github.com/icimik/composer/actions/runs/37927426466) passed Linux, macOS/Windows and both installer jobs;
  artifacts=2. Old toolchain approval blocker is obsolete; #38 still open and untouched. TS7 #31 unrelated, still failing.
- Recovery: [context packet](context-packet.md), [reproduction record](../docs/research/workspace-isolation-reproduction.md).
- Design: [ADR 0005](../docs/decisions/0005-workspace-failure-isolation.md), proposed only; no covering approval found.
  Review typed independent results, pure guarded reads, explicit no-auto-fallback selection, mutation gates and safe transitions.
- Evidence: synthetic Store faults block aggregate load; read guards recreate missing directories; failed switch persists B;
  manifest-only mutation alters an unloadable B before returning failure. Real Linux Electron reproduces startup blocker,
  all-failed/no-retry and input-preserving failed switch with wrong persisted active ID. No production change.
- Reproduction helpers are manual pre-fix characterization outside default test globs, not passing capability regressions.
  After approval, add failing acceptance regressions first and replace/archive defect assertions.
- Environment: Node22.23.3 via isolated npm exec; existing lockfile/Electron44.7.0 unchanged. GTK/Xvfb host prepared.
  Native/manual candidate, ACL, race/crash and complete #4 safety not claimed.
- Permissions: child issue, own task branch, commits/push/draft PR and review fixes. No production contract change before
  reviewed ADR; no merge/auto-merge/protection/force-push/release/scheduler/delegation.
- Local validation: npm ci/check passed, 63 units with zero skips; Store/UI probes passed as pre-fix characterization;
  Xvfb smoke 1/1 and full Linux E2E 23/23 passed. Restore only known test-generated screenshots before commit.
  Final-head PR checks/jobs/artifacts must still be read after push, not inferred from local success.
  Preserve MIT/CC0/provenance, 180/120, IPC/path/symlink/serial/hash/AI-author safety and Linux-only ordinary CI.
- Next: maintainer reviews exact ADR 0005 revision in the draft design PR. Record reviewer/SHA/approval URL before starting
  the separate minimal implementation PR. #40 and #4 remain open; rollback preparation without data changes.
