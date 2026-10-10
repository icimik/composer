# Current workstate

- Focus: [#42](https://github.com/icimik/composer/issues/42) / [draft #43](https://github.com/icimik/composer/pull/43),
  document revision recovery under open #4. Gate: unwired cleanup candidate review, not product acceptance/merge.
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
- Pure core plus standalone disk adapter: bounded/guarded reads, exclusive flushes, commit marker, scratch/rename,
  complete verification, pure preview and explicit repeatable recovery. Unwired explicit retirement/cleanup candidate
  now preserves canonical files across partial deletion; [review contract](../docs/development/revision-cleanup-design.md).
  No active Store/IPC/renderer import or recovery UI/E2E yet. Do not claim #42 complete.
- Eight disk cases red before implementation; scratch-flush regression also observed red before fix.
  63 execution/30 replay child exits and deterministic EACCES/ENOSPC/EIO now covered; full exact counts belong to #43.
- CodeRabbit 67b5169 review 5478165876 returned: all three valid findings handled (spacing, stale table,
  owned partial-file removal). Two exclusive regressions were red first; cleanup success cases red before module.
  Prepared/complete cleanup has 138 actual child exits; unknown/link/third/ambiguous inventory and I/O refusal tests.
  Red-first self-review also requires re-flushing retirement parents before retry deletion after a prior sync failure.
  Current changed head needs full verification and independent review.
- Large plan sample: 158,633,767 staged bytes, 3264 ms, 804020 KiB peak Linux RSS including fixture creation.
  Main-thread responsiveness/full-budget RSS/native ACL/flush/IME/accessibility/power-cut/real providers unverified.
- Previous authorized rebases completed. Current follow-up uses normal push, never overwrites another writer or main.
  No merge/auto-merge/protection/release/delegation/closure authority. #42/#4 stay open.
- Next: review/approve the new retirement namespace at exact head before Store capture/IPC identity/UI consent/recovery E2E.
  Preserve queue/readiness/sender/path/symlink/hash/author/input guards, 180/120 and MIT/CC0.
