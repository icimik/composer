# Workspace isolation implementation context packet

- Outcome: healthy writing/saving survives another registered workspace fault; diagnostics/retry preserve failed data.
- Scope: [#40](https://github.com/icimik/composer/issues/40), first increment of [#4](https://github.com/icimik/composer/issues/4).
- Delivery: existing own branch `design/workspace-failure-isolation-20261009`, [#41](https://github.com/icimik/composer/pull/41).
- Actual base: unchanged fetched main `efcd507670b4a7d68c78a6f1b314c667ac5134ba`; #39 remains merged, no old toolchain blocker.
- Design revision: `70d4f8925a2fd8995e455fdf9cc6fa82adcdc9d1`, clean tree at implementation start.
- Approval: maintainer kenpusney's verified follow-up approves ADR 0005 and same-PR implementation;
  [repository record](https://github.com/icimik/composer/pull/41#issuecomment-6092557163).
- Contracts: [accepted ADR](../docs/decisions/0005-workspace-failure-isolation.md); no persisted v1 format change.
- Tested facts: nine acceptance regressions red before production edits, now green; full acceptance mapping below.
- Code/submission: `3ef63d68e9cff8abab97066cee9b77539e070aea`, #41 ready for independent review. Exact code head clean
  install/check (93 units/zero skips), smoke 1/full 36 E2E repeated;
  [PR Linux CI](https://github.com/icimik/composer/actions/runs/38018289253) and
  [push Linux CI](https://github.com/icimik/composer/actions/runs/38018286202) passed, no native runners/artifacts.
- Acceptance mapping: [implementation verification](../docs/research/workspace-isolation-verification.md), historical
  [reproduction](../docs/research/workspace-isolation-reproduction.md) archived rather than rewritten.
- Code: guarded path/reader/registry/diagnostic helpers → Store mutation groups → sender-checked/sanitized IPC → result types
  → composer state/save/transitions/actions → diagnostic chooser and disabled/read-only editor/UI.
- Review: CodeRabbit four findings on `000f0224` verified/adopted; scope-safe fixes and suspended Ctrl+S regression added.
  Follow-up local check 91 units/zero skips, smoke and full 36 E2E passed. Read exact follow-up head on live #41.
- Latest evidence: CodeRabbit cleanup follow-up adopted with two red-first units. `3773438` PR CI passed, push CI failed:
  shortcut assertion observed transition-disable, not completed fault state. Another local failure exposed unpaused
  Playwright time. Tests now await retry completion and explicitly pause autosave time; three cases passed 12 repeats each.
  Full local check 93 units/zero skips, smoke 1 and full 36 E2E pass. Exact final head/CI are in #41 verification comment.
- Final runtime correction: architecture-summary async proposal concern verified, red UI regression added. Resolve/discard
  holds the same transition lock until identity-bound completion; mid-operation fault rejects without writes/input changes.
  Two paths passed six repeats each; latest full check 93 units/zero skips, smoke 1 and all 38 E2E pass. Read final #41 head.
- Unknowns: current-head independent review (no human approval) and final delivery-documentation exact-head CI;
  native ACL/Windows/macOS/manual IME/accessibility and global native dialog.
- Boundaries: no merge/auto-merge/protection/force-push/release/loop/delegation; keep #40/#4 open.
- Non-goals: journaling, backup/repair/retention, database/schema migration, watchers/sync or new AI/IF/VN.
- Next: read live #41 head/reviews/checks; evaluate valid findings against that head and repeat verification after fixes.
- Rollback: reviewed revert of implementation; no migration, but old mixed-workspace startup failure returns.
