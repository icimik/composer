# Workspace isolation implementation context packet

- Outcome: healthy writing/saving survives another registered workspace fault; diagnostics/retry preserve failed data.
- Scope: [#40](https://github.com/icimik/composer/issues/40), first increment of [#4](https://github.com/icimik/composer/issues/4).
- Delivery: existing own branch `design/workspace-failure-isolation-20261009`, [#41](https://github.com/icimik/composer/pull/41).
- Actual base: unchanged fetched main `efcd507670b4a7d68c78a6f1b314c667ac5134ba`; #39 remains merged, no old toolchain blocker.
- Design revision: `70d4f8925a2fd8995e455fdf9cc6fa82adcdc9d1`, clean tree at implementation start.
- Approval: maintainer kenpusney's verified follow-up approves ADR 0005 and same-PR implementation;
  [repository record](https://github.com/icimik/composer/pull/41#issuecomment-6092557163).
- Contracts: [accepted ADR](../docs/decisions/0005-workspace-failure-isolation.md); no persisted v1 format change.
- Tested facts: nine acceptance regressions red before edits; local check 89 units, smoke and 35 E2E passed after correction.
- Acceptance mapping: [implementation verification](../docs/research/workspace-isolation-verification.md), historical
  [reproduction](../docs/research/workspace-isolation-reproduction.md) archived rather than rewritten.
- Code: guarded path/reader/registry/diagnostic helpers → Store mutation groups → sender-checked/sanitized IPC → result types
  → composer state/save/transitions/actions → diagnostic chooser and disabled/read-only editor/UI.
- Unknowns: final exact-head independent review/CI; native ACL/Windows/macOS/manual IME/accessibility and global native dialog.
- Boundaries: no merge/auto-merge/protection/force-push/release/loop/delegation; keep #40/#4 open.
- Non-goals: journaling, backup/repair/retention, database/schema migration, watchers/sync or new AI/IF/VN.
- Next: commit/freeze/push, verify current-head checks/jobs/artifacts, formally submit #41 and evaluate valid review findings.
- Rollback: reviewed revert of implementation; no migration, but old mixed-workspace startup failure returns.
