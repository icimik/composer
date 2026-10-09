# CI and licensing context packet

- Goal: [issue #35](https://github.com/icimik/composer/issues/35), Linux-only ordinary CI, main-only native build, MIT and CC0 refresh.
- Base: unmerged [PR #34](https://github.com/icimik/composer/pull/34), `refactor/enforce-code-size-limits`, head `26f5381`; keep its strict 180/120 limits.
- Branch: `maintenance/linux-ci-mit-cc0`. Safe dependency merges in main are incorporated normally.
- Delivery: [PR #36](https://github.com/icimik/composer/pull/36), stacked on #34; code head `62aa914` passed Linux-only PR/push runs, native/package skipped, zero artifacts. Read live final-head checks before approval.
- Design: [ADR 0004](../docs/decisions/0004-linux-ci-and-licensed-skills.md), [CI policy](../docs/development/ci-policy.md), [licensing](../docs/development/licensing.md).
- Acceptance: real Linux-only PR/push runs with native/installer jobs skipped and zero artifacts; negative policy tests; root MIT, distinct CC0 terms, pinned byte-verified copies, executable fresh-context docs.
- Evidence: 51 local units, smoke, 23 E2E and design checks; live current-head results must be read before review.
- Sources: skills `65a49919ad88ab7c7e9f26817697c941346276b7`, framework `ec414a6d7427760241fc94533396a58713f5a1ab`; both CC0-1.0.
- Authorization: reviewed compatible Dependabot #27/#28/#29/#32 merged; incompatible #30/#31 stay open. No refactor/CI merge, bypass, protection changes, scheduler or release authority.
- Unknowns: new main-path runtime cannot be proved by skipped PR jobs; manual/signing and existing dev-toolchain advisories remain.
- Next: inspect follow-up PR, obtain independent maintainer review, retarget after #34 merges, then read new main results after authorized maintainer merge.
