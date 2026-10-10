# Oxlint / TypeScript 7 context packet

- Current follow-up: maintainer approves direction and asks for practical CJS/type-check strengthening, removal of draft
  and CodeRabbit review. [Approval](https://github.com/icimik/composer/pull/45#pullrequestreview-5477840741) on `de2b335`;
  later commits still need current-head review. No merge authorization.
- Current [enhancement design/evidence](../research/oxlint-enhancements.md): pinned native type-aware lint, stronger
  compiler/CJS safety gates, narrow indexed-access/close-Promise fix. The initial snapshot below is historical.

- Primary issue: [#44](https://github.com/icimik/composer/issues/44), follow-up to
  [#38](https://github.com/icimik/composer/issues/38) and [#31](https://github.com/icimik/composer/pull/31).
- Outcome: remove the parser's TypeScript peer ceiling without weakening maintained-source quality gates.
- Base: main `c4e5405697ed27730ed9888816b3fe732f4470f1`; clean clone plus independent `chore/oxlint-ts7` worktree.
- Live state: #39 merged; #31 open and fails npm ci on typescript-eslint's `>=4.8.4 <6.1.0` peer range.
  #43 is unrelated design work and is not modified. Historical workstate is preserved in git.
- Acceptance: explicit rule parity, strict physical 180/120 boundaries, clean install/tree, check, smoke/full Linux E2E,
  paired lint timings, exact-head Linux-only CI and no artifacts.
- Permissions: implement/commit/push and submit issue-linked candidate for review. No merge, auto-merge, force-push,
  protection changes, release, issue closure, native dispatch or Dependabot instruction.
- Decision: [migration design](oxlint-migration.md); preserve Prettier and runtime/package semantics.
- Unknowns: unsupported-rule parser coverage and actual TS7 compilation, application/CI acceptance.
- Next bounded step: add regression fixtures, resolve unsupported rules, remove lint dependencies and test TS7.
- Rollback: revert the complete candidate; restore main's ESLint config/package/lockfile/tests together.
- Review: self-review does not establish independent approval; native checks follow authorized main merge only.
- Submission: [draft PR #45](https://github.com/icimik/composer/pull/45), implementation
  `927409884171766fc26ba9b60eeabd698d8a54d7`; exact latest-head CI/readback belongs to the #44/#45 verification comment.
