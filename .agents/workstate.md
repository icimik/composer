# Current workstate

- Focus: #42 / draft #43, bounded document revision recovery under #4.
- Rebase in progress onto actual main `0a533f081f5f62f0b9c0ae1bc39f7fd277c44a68`, explicitly requested by sender.
  Preserve own implementation; local backup branch retains pre-rebase `81ef59f`.
- Main contains merged tooling #45: Oxlint1.87.0/tsgolint7.0.2003/TypeScript7.0.2 and stricter compiler/CJS checks.
  Keep its lockfile/config/close-rejection fix unchanged; historical tooling workstate remains in main git history and
  [enhancement evidence](../docs/research/oxlint-enhancements.md). Do not reopen old toolchain approval.
- #40 closed after merged #41 acceptance. ADR 0006 core approved; current pure model is not active recovery.
- Sender requested measured resource allocation for 5M/35M Chinese-character works, review fixes and continued adapter work.
  No new product default yet; no pruning, DB migration, automatic repair, merge or closure authorization.
- Resolve continuity-only rebase conflicts, validate latest main scripts, then finish review fixes and bounded disk adapter.
