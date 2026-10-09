# Current workstate

- Focus: [issue #38](https://github.com/icimik/composer/issues/38), compatible Vite8/plugin6/TS6 upgrade. Direction confirmed; [PR #39](https://github.com/icimik/composer/pull/39) submitted for independent review.
- Base: main `7e2c2dfe80ca1468bec58891d6ebd8a5668858d3`; maintainer merged #34/#36. Branch `research/toolchain-upgrade`, no stack dependency.
- Merged-main evidence: [run 37922322450](https://github.com/icimik/composer/actions/runs/37922322450), Linux success, macOS 62 units, Windows 60 passes/two existing symlink skips, smoke/23 E2E each; both installer jobs succeeded, two artifacts. No public release.
- Closure: #3 and #35 completed after readback; #33 was already completed. Feature roadmap and #23 signed/manual release gates remain open.
- Candidate: Vite8.3.4/plugin6.1.2/TS6.0.3 pinned; typescript-eslint8.71.1 unchanged. Only three direct versions change; config becomes `.mts`, client types explicit, size guards extended to `.mts`.
- Local: clean install/tree, check/build/lint/format/docs, 63 units, smoke and 23 E2E, design checks and dev/production-preview HTTP smoke pass. Candidate native/HMR/manual acceptance not claimed.
- TS7: outside stable parser peer range; keep #31 open. #30 needs coordinated Vite replacement; keep open pending maintainer decision.
- Delivery: PR #39 is ready for review, with source-cited research, acceptance/rollback and exact-head Linux verification. Main is not upgraded until an actual merge is read back.
- Authorization: maintainer confirmed direction/formal review and requested review fixes followed by normal merge if checks and repository approval permit. No protection bypass/change, forced peers, signing, publication or unattended merge.
- Policy unchanged: ordinary PR/push Linux portable build/E2E only, no installers/artifacts; main Linux→native→installer gates. Strict 180/120; MIT/CC0 notices preserved.
- Review follow-up: fix the Node-range Markdown table and synchronize status records; no dependency/runtime change. Re-run checks for the new head.
- Remaining: complete independent review and obtain the required GitHub approval, new main native runtime after merge, TS7 parser support, eight moderate dev-toolchain advisories, signed/manual release gates.
- Next: read live head/checks and approval; use a normal permitted merge only after validation, then inspect new main native/installer results. If approval is missing, report the blocker without bypass; do not merge old standalone bumps or start feature work.
