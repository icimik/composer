# Current workstate

- Focus: Windows issue #3 is repaired and natively verified; deliver project foundations under [issue #24](https://github.com/icimik/composer/issues/24).
- Application PR: [#1](https://github.com/icimik/composer/pull/1), base `main`, head branch `feat/novel-workbench`; not merged.
- Follow-up branch: `chore/fresh-context-project-foundations`, stacked on the application changes. Do not treat this branch as already on `main`.
- Foundations PR: [#25](https://github.com/icimik/composer/pull/25), base `feat/novel-workbench`; retarget and revalidate after #1 merges.
- Verified local: lint/format/docs/YAML/policy checks, renderer build, design checks, 30 unit tests, 1 Electron smoke and 23 full E2E on Linux/Xvfb.
- Native application head `dae9ad7`: [run 37883284843](https://github.com/icimik/composer/actions/runs/37883284843) passed both OSes, 23 E2E each; Windows skipped 2 symlink-privilege unit cases. Installer job skipped; zero artifacts.
- Repair evidence: centralized environment helper, poisoned-environment smoke, LF/CRLF policy regression. Exact native evidence is maintained in `docs/research/current-verification.md`.
- Completed foundations: AGENTS/loop/context/design/review docs, research/issue references, project skill adapters, contribution/security/conduct/provenance/templates and hygiene checks.
- Remote safety: private vulnerability reporting was enabled and read back. No branch protection changes, merge, auto-merge or release publication.
- Policy: push/PR checks never package installers or upload artifacts; main-only packaging follows successful desktop verification.
- Unresolved: license/third-party rights, protected-main/reviewer policy, conduct reporting contact, signing, manual platform acceptance and 8 moderate development-toolchain audit findings.
- Next: read the foundations PR current-head native CI and obtain independent review; ask the maintainer for license/merge decisions. Do not start other roadmap features.

Recover via root AGENTS, this snapshot, the research index, selected issue, live PR and exact-head CI; earlier chat is not authoritative.
