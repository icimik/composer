# Workspace failure isolation context packet

- Outcome: one registered corrupt/unreadable workspace does not block healthy writing; failed data stays untouched.
- Parent: [#4](https://github.com/icimik/composer/issues/4), first bounded candidate only; roadmap #2 unchanged.
- Base/head at recovery: actual main `efcd507670b4a7d68c78a6f1b314c667ac5134ba`.
- Checkout: fresh clone, initially clean; branch `design/workspace-failure-isolation-20261009` from fetched main, no stack.
- Live correction: [#39](https://github.com/icimik/composer/pull/39) merged 2026-10-09 12:02 UTC with independent approval.
- Main evidence: [run 37927426466](https://github.com/icimik/composer/actions/runs/37927426466) succeeded on Linux,
  Windows/macOS and installer jobs; two artifacts. Former toolchain review/approval blocker is obsolete.
- Duplicate search: all issues/PR titles, #4 body/comments/timeline, decisions directory inspected; no matching child/design.
- Bounded child created: [#40](https://github.com/icimik/composer/issues/40).
- Code: Store files/workspaces → main IPC → preload/types → composer hydration/save/actions → App/Sidebar.
- Facts: all-workspace Promise.all rejects; read guards mkdir; switching persists active ID before validating target.
- Unknowns: diagnostic contract and startup selection need maintainer review; no covering reviewed ADR found.
- Scope: isolated results, safe diagnostics, explicit active selection, failed-write and switch/input protection, read purity.
- Acceptance: healthy save/restart; active/all-failed states; malformed/missing/read faults; hashes/registration/security;
  failed switch preserves draft/title/prompt/identity; explicit retry after external repair; real Linux UI E2E.
- Permissions: child issue, new branch, reproduction/design docs, commits/push/draft PR. No production contract change
  before reviewed ADR; no merge/auto-merge/protection/force-push/release/loop/delegation.
- Non-goals: transactions, backups, repair, schema migration, DB replacement, watchers, sync or new AI/IF/VN.
- Design/evidence: [ADR 0005](../docs/decisions/0005-workspace-failure-isolation.md), proposed only;
  [measured reproduction](../docs/research/workspace-isolation-reproduction.md).
- Next: deliver design draft PR with exact-head validation and request independent maintainer design approval.
- Rollback: revert preparation PR only; it changes no production data or runtime.
