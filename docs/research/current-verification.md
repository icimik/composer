# Current verification

Updated 2026-10-10 UTC. This file separates observed results from historical source-import records and unexecuted acceptance work.

## Merged workspace isolation and next design, 2026-10-10 UTC

Actual main is `c4e5405697ed27730ed9888816b3fe732f4470f1`, after merged
[PR #41](https://github.com/icimik/composer/pull/41). Its
[main run 38019637399](https://github.com/icimik/composer/actions/runs/38019637399) passed Linux, native Windows/macOS
and unsigned installer jobs; artifacts=2 SHA-named installers, no release. Linux/macOS passed 93 units without skips;
Windows passed 88 with five symlink-privilege skips. All platforms passed smoke 1 and the full 38-test Electron E2E suite.
Repeated main local clean install/check/smoke/full E2E passed 93/1/38, zero unit skips.
[#40 is closed after acceptance](https://github.com/icimik/composer/issues/40#issuecomment-6093233851), following
[independent exact-head approval](https://github.com/icimik/composer/pull/41#pullrequestreview-5477300427).
Manual ACL/IME/accessibility/global native dialog and real-provider/power-loss behavior remain unverified.

[#42](https://github.com/icimik/composer/issues/42) is the next bounded #4 design: one interrupted document revision.
[Proposed ADR 0006](../decisions/0006-document-revision-recovery.md) and
[synthetic interruption evidence](document-revision-reproduction.md) do not implement recovery or carry prior approval.
Parent #4 remains open for transaction/recovery policy, backups/retention and migration.

## Historical workspace isolation candidate

Actual main at this recovery is `efcd507670b4a7d68c78a6f1b314c667ac5134ba`, after merged
[PR #39](https://github.com/icimik/composer/pull/39); its
[main Linux/native/installer run](https://github.com/icimik/composer/actions/runs/37927426466) passed.
The older main/toolchain sections below remain historical snapshots, not current blockers.
[PR #41](https://github.com/icimik/composer/pull/41) implements bounded #40 after ADR 0005 approval, with
[acceptance mapping and local evidence](workspace-isolation-verification.md). Candidate independent review/merge/native
acceptance remain outstanding; no #4 completion or release is claimed.

## Historical merged-main acceptance and issue closure

The maintainer merged #34/#36, and main is `7e2c2dfe80ca1468bec58891d6ebd8a5668858d3`. [Main run 37922322450](https://github.com/icimik/composer/actions/runs/37922322450) actually executed the new Linux→native→installer workflow successfully: Linux passed; macOS passed 62 unit cases, smoke and 23 E2E; Windows passed 60, skipped the same two symlink-privilege cases, and passed smoke/23 E2E. Both unsigned development installer jobs succeeded; the artifacts API returned two SHA-named installers, not a public release.

[Windows issue #3](https://github.com/icimik/composer/issues/3) and [CI/license issue #35](https://github.com/icimik/composer/issues/35) are completed after readback; [source-size issue #33](https://github.com/icimik/composer/issues/33) was already completed. Signing, installation/manual IME, migration acceptance and other roadmap work remain open, particularly [release issue #23](https://github.com/icimik/composer/issues/23).

The next [toolchain evaluation](toolchain-upgrade.md) is under formal review in [PR #39](https://github.com/icimik/composer/pull/39) / [issue #38](https://github.com/icimik/composer/issues/38), with its direction confirmed by the maintainer. Its new versions are not part of the merged-main run above; old native evidence must not be reused as upgraded-toolchain acceptance.

## Historical stack synchronization and review follow-up

The maintainer rewrote parent #34 onto dependency-updated main; new head `ae7c7bb5e7316afc76006f17fdf60e264ed7aa58` changes only the merged action/globals versions relative to the original parent. Child #36 was still rooted in the old parent history. Normal merge `00747cc` makes the current parent an ancestor, resolves six documentation/continuity conflicts, and preserves the previous child tree byte-for-byte. No parent update or force-push was performed.

The [parent CodeRabbit review](https://github.com/icimik/composer/pull/34#pullrequestreview-5468593533) suggested optional complete showcase freshness coverage. It is implemented in #36: `design:check` compares freshly rendered specification and full HTML, and regressions reject stale static markup/CSS templates while retaining handler comparisons. The existing showcase was regenerated from the linted runtime; tokens/CSS and the specification remain unchanged.

The [child CodeRabbit review](https://github.com/icimik/composer/pull/36#pullrequestreview-5468609368) identified two policy-coverage opportunities, not current production defects. Required check/smoke/E2E steps now reject conditional/failure-tolerant overrides, and jobs reject failure tolerance; ten additional mutations cover those gates. License tests discover copied Markdown/licenses and require exact inventory equality before byte-hash checks.

Local follow-up passed 62 units, launch smoke, all 23 Electron E2E, lint/format/docs/build and design checks. Current-head Linux CI and live stack mergeability must be read separately after push. Existing parent approval does not approve new child changes or authorize agent merge; main-path runtime remains pending maintainer merge.

## Historical CI, licensing and skills refresh

The maintainer requested Linux-only ordinary PR/push validation and native macOS/Windows checks only on main pushes after merge. [CI policy](../development/ci-policy.md) and [ADR 0004](../decisions/0004-linux-ci-and-licensed-skills.md) describe the new gates and negative regression tests. This change requires PR review; skipped native jobs on its PR cannot establish execution of its new main path.

[PR #36](https://github.com/icimik/composer/pull/36) is stacked on #34. Code head `62aa91442224b754ab3ef18848de422b6c2673e3` passed [PR run 37913665915](https://github.com/icimik/composer/actions/runs/37913665915) and [push run 37913613067](https://github.com/icimik/composer/actions/runs/37913613067). Jobs APIs showed successful Ubuntu 22.04 verification only; native and installer jobs were skipped with empty labels and no runner. Both artifacts APIs returned zero. Local checks passed 51 unit cases, smoke, 23 E2E, 76 contrast pairs and three negative token cases; current-head CI must be re-read after any documentation follow-up.

Composer-authored code/docs now use MIT. Both upstream repositories have verified CC0-1.0 licenses; framework snapshots are byte-identical to the licensed revision, and seven complete Markdown skill bundles are imported unchanged. See [licensing and source commits](../development/licensing.md) and [skill catalog](../../.agents/skills/README.md). Historical unconfirmed-rights statements below or in dated logs are superseded, not evidence of a current blocker.

Dependabot results and exact-head evidence are in [dependency review](../development/dependency-review.md); the former blanket update restriction was removed by the maintainer. The two unsupported peer upgrades remain open. No refactor/CI PR merge authority or protection-changing authority is implied.

Final dependency-only main `0d190d9bc5720115e7e14c7c650a112f04dca2f0` passed [run 37913404198](https://github.com/icimik/composer/actions/runs/37913404198), including both native verification and installer jobs; its artifacts API returned two installer artifacts. This validates the action upgrades under the former workflow, not execution of #36's new main-only gates.

## Historical source-size task

The maintainer subsequently merged application [#1](https://github.com/icimik/composer/pull/1) and foundations [#25](https://github.com/icimik/composer/pull/25) at 08:31 UTC. Current main baseline `a8fc96a` passed [run 37905610513](https://github.com/icimik/composer/actions/runs/37905610513); the earlier records below describe their pre-merge state, not the live repository.

[Issue #33](https://github.com/icimik/composer/issues/33) enforces 180 physical lines per JS/TS source file and 120 characters per line. Local refactor checks passed lint/format/docs/build, 37 unit tests, one smoke and all 23 Electron E2E. Four limit boundary tests, two template/parity tests and a Store API/descriptor regression supplement the previous 30 units. Design still passes 76 contrast pairs and three negative token mutations; no CSS token, framework snapshot or tracked screenshot was changed.

Refactor [PR #34](https://github.com/icimik/composer/pull/34) provides exact-head macOS/Windows evidence in its checks and verification comment; local results are not a native acceptance claim. At that earlier inspection all six Dependabot PRs were open because merge protection blocked the compatible upgrades; current outcomes supersede this historical snapshot in [dependency review](../development/dependency-review.md).

## Windows repair

Application PR [#1](https://github.com/icimik/composer/pull/1) was open when this repair was recorded. Native verification of code commit `dae9ad70c22817544d40d364d5ec179f6b29cc4e` succeeded in [run 37883284843](https://github.com/icimik/composer/actions/runs/37883284843).

- Windows: build and design checks passed; 28 unit tests passed and 2 pre-existing symlink tests were skipped; poisoned-environment Electron smoke passed; all 23 full Electron E2E passed.
- macOS 14: build and design checks passed; all 30 unit tests passed; poisoned-environment Electron smoke passed; all 23 full Electron E2E passed.
- Both platforms passed 76 contrast pairs and rejected 3 deliberately corrupted token cases.
- The installer job was skipped. The run artifacts API reported zero artifacts.

Original Windows launch failures were `electron.exe: bad option: --remote-debugging-port=0`. The launcher now removes inherited `ELECTRON_RUN_AS_NODE` keys case-insensitively instead of setting an empty value. Regression coverage exercises empty, `0`, `1`, mixed-case keys, environment immutability and platform-specific sandbox flags. See [the launch ADR](../decisions/0001-electron-test-environment.md).

The first repair run also exposed a newly added CI-policy test's LF-only assumption. It was corrected to normalize CRLF and explicitly test both checkout formats before the successful run above. This is not evidence that the Electron fix itself failed.

## Foundations verification

Local Linux/Xvfb passed build, 30 unit tests, one smoke test, 23 E2E, 76 contrast checks and 3 negative token tests with the foundations changes. The branch additionally passed scoped lint/format checks, documentation/skill references, YAML parsing and structural CI-policy validation. Its exact-head native CI is reported on the foundations PR; do not substitute the application run above for validation of that later head.

Foundations [PR #25](https://github.com/icimik/composer/pull/25) was stacked on `feat/novel-workbench` before maintainer merge. Its code/configuration head `418d51f9717e523acd5510bbaf6549a29c65ccc1` passed [native run 37883800648](https://github.com/icimik/composer/actions/runs/37883800648): both OSes passed lint, format, 29 Markdown documents / 55 references, YAML/skills/CI policy, build, design checks, smoke and 23 full E2E each. macOS passed 30 unit cases; Windows passed 28 and skipped the same 2 symlink-privilege cases. The installer job was skipped and artifacts API returned zero artifacts.

The earlier foundations run at `d30cbc2` failed Windows formatting because checkout converted text to CRLF. `.gitattributes` now enforces LF checkouts and `.editorconfig` aligns editor behavior; binary media/installers are excluded from normalization. A later documentation-only handoff commit does not retroactively change which SHA this recorded run tested; check the PR's current-head checks before review.

Actions emitted a Node 20 runtime deprecation annotation for the pinned v4 checkout/setup-node actions (the runner executes them on Node 24). Both actions succeeded. Updating those pins to newer validated majors is a maintenance follow-up, not completed by this bootstrap; the configured dependency update workflow must not auto-merge them.

Dependency audit on 2026-10-09 reported zero production dependency advisories with `npm audit --omit=dev`, but 8 moderate findings in the full development-toolchain tree. They derive from the `sprintf-js` advisory through Electron packaging/download dependencies; see [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). No high/critical finding was reported by this audit. Do not interpret this as proof of security or run a force upgrade without validating installer compatibility. Track remediation in [desktop release issue #23](https://github.com/icimik/composer/issues/23).

AI E2E uses a local mock provider. These results do not establish quality or compatibility of every real OpenAI-compatible service, manual Chinese IME behavior, signed installers, notarization or native installation acceptance.

## Packaging policy

Ordinary push and pull-request verification run Linux portable builds and Electron checks/tests only. No PR or non-main branch job uses native runners, builds installers or uploads reports, screenshots or other artifacts under the new policy.

Main-only native validation requires Linux success; installer packaging/upload require native matrix success and a `push` event on `refs/heads/main`. Packaging uses `--publish never`; it creates unsigned development installers, not a public release. Historical pre-merge runs above intentionally did not package; old native PR runs used the former workflow.

The workflow cannot distinguish an allowed merge from an unprotected direct push to main. Maintainers must configure [main protection and required review](../development/maintainer-setup.md) to enforce “only after merge” as a repository policy.

## Remaining release gates

- Reviewed approval for the new [revision-recovery design #42](https://github.com/icimik/composer/issues/42); #41 and the toolchain upgrade are already merged.
- Optional required Linux status-check configuration, conduct reporting contact and signed release process.
- Manual macOS/Windows installation, Chinese IME and real-provider acceptance.

The [research index](README.md), [fresh-context loop](../development/loop.md) and [workstate](../../.agents/workstate.md) are recovery entry points. Historical 0.1 validation records remain intact and are not current CI claims.
