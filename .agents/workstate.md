# Current workstate

- Focus: [issue #35](https://github.com/icimik/composer/issues/35), Linux-first CI, MIT adoption and CC0 skill refresh.
- Branch: `maintenance/linux-ci-mit-cc0`, stacked on unmerged [PR #34](https://github.com/icimik/composer/pull/34). Main dependency merges are incorporated normally; do not force-push.
- Authorization: safe Dependabot merges only, plus implementation/PR delivery for this increment. No authority to merge #34 or this new work, bypass/change protection, install schedulers, sign or publish.
- Dependabot #27/#28/#29/#32 are squash-merged; [review evidence](../docs/development/dependency-review.md). #30/#31 remain open because plugin/Vite and TypeScript/parser peers are incompatible.
- Final dependency-only main `0d190d9` passed [run 37913404198](https://github.com/icimik/composer/actions/runs/37913404198), both native checks and installer jobs, with two installer artifacts under the former workflow.
- Policy: Linux-only ordinary PR/push portable builds and Electron E2E, zero installer builds/uploads. Main push Linux success gates native macOS/Windows checks, then installers; no automatic public release.
- Local evidence: check/build/lint/format/docs passed, 51 unit tests, one launch smoke, all 23 Electron E2E, 76 contrast pairs / three negative token cases. Strict JS/TS limits remain 180 physical lines / 120 characters.
- Licensing: MIT for Composer code/docs/adapters; both upstream repositories confirmed CC0-1.0. Seven unchanged Markdown skill bundles and framework snapshots/notices are byte-verified in provenance.json; no executors installed.
- Delivery: [stacked PR #36](https://github.com/icimik/composer/pull/36), base `refactor/enforce-code-size-limits`; code head `62aa914` passed [PR run](https://github.com/icimik/composer/actions/runs/37913665915) and [push run](https://github.com/icimik/composer/actions/runs/37913613067). Only Ubuntu ran; native/package jobs had no runners, artifacts zero. Inspect final-head checks after any documentation follow-up.
- Remaining: independent review, optional required Linux status check, unsupported dependency migrations, eight moderate dev-toolchain advisories, conduct contact, native manual acceptance/signing.
- Next: read live PR/head/checks; after #34 merges, retarget this PR to main and repeat Linux checks. After maintainer merges this PR, read new main native/packaging results before closing #35.

Recover via root AGENTS, this snapshot, the research index, issue/design, live PR and exact-head CI. Historical chat and older worklogs do not override live evidence.
