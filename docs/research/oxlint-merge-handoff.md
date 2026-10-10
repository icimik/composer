# Oxlint merged-main handoff and native acceptance blocker

Primary repair: [#46](https://github.com/icimik/composer/issues/46), parent
[#44](https://github.com/icimik/composer/issues/44) and [#38](https://github.com/icimik/composer/issues/38).

## Actual merge and Dependabot supersession

The maintainer merged [#45](https://github.com/icimik/composer/pull/45) at 2026-10-10 06:50:57 UTC, main
`0a533f081f5f62f0b9c0ae1bc39f7fd277c44a68`. Both manifest and lockfile pin TypeScript7.0.2, Oxlint1.87.0 and
native tsgolint7.0.2003; ESLint/parser packages are absent. This is an observed merge, not agent merge authorization.

[#31](https://github.com/icimik/composer/pull/31) only changed the TypeScript dependency manifest/lockfile. It was superseded
and automatically closed by Dependabot at 06:53:19 UTC because TypeScript was already up to date.
[Supersession record](https://github.com/icimik/composer/pull/31#issuecomment-6094852177) confirms no unique application
change remains. Do not merge/reopen it or issue ignore commands; future updates remain eligible.

## Post-merge evidence, not candidate-only evidence

[Main run38032356195](https://github.com/icimik/composer/actions/runs/38032356195) is on the actual merged SHA:

- Linux verification succeeded: quality/type/build/unit/design, launch smoke and Electron E2E steps.
- [macOS14](https://github.com/icimik/composer/actions/runs/38032356195/job/114156059570): actual lint/type/build passed;
  nine lint fixture tests failed parsing non-JSON CLI stdout, 96/105 units passed. Smoke/E2E were skipped after failure.
- [Windows](https://github.com/icimik/composer/actions/runs/38032356195/job/114156059615): check100 passes/zero failures/
  five existing platform-specific skips, smoke1 and all39 Electron E2E pass. Do not relabel skips as zero skips.
- Overall run failed; native-gated installer job skipped, zero artifacts. No native acceptance completion or release claim.

#31 supersession is independent of remaining native acceptance. Keep #44/#38/#46 open pending verified repair/merge/native
readback; preserve the original [candidate evidence](oxlint-enhancements.md) as dated Linux/PR history.

## Reproduction and bounded intervention

Reproduced on Linux before edits by symlinking the temporary root and overriding `os.tmpdir` for the isolated helper:
Oxlint exits1 with stdout beginning `Failed to parse oxlint configuration file`, complaining that `options.typeAware`
is only supported in root config but was found in the aliased `.oxlintrc.json`. Parsing that text as JSON hides the cause.
macOS temp-directory aliasing is consistent with this platform-only failure; actual repaired native acceptance is untested.

Two new regressions failed first: valid type-aware fixture under aliased temp root, and malformed config preserving native
stdout instead of generic JSON.parse error. Canonicalize generated temp root with `fs.realpathSync`, retaining isolated
projects and dependency junctions. Preserve raw stdout/stderr/exit status if CLI does not emit expected JSON diagnostics.
Assert diagnostics array shape; never treat a config/tool failure as a successful lint result.

Both regressions now pass, including rejection of floating Promises under the aliased temp root and cleanup inventory.
On 2026-10-10 06:59 UTC, clean install/full Linux check107 units/zero failures/skips, launch smoke1 and all39 Electron E2E
pass. No source/runtime/dependency/workflow/strictness changes,
skips, suppressions or relaxed gates.

[Repair PR #47](https://github.com/icimik/composer/pull/47), substantive head
`5ef462514387b46bd45ab61683c1d09557eaa2dc`, has successful
[PR CI](https://github.com/icimik/composer/actions/runs/38032925909) and
[push CI](https://github.com/icimik/composer/actions/runs/38032922819): Linux only, native/installers skipped, 0 artifacts.
[CodeRabbit review](https://github.com/icimik/composer/pull/47#pullrequestreview-5478061762) reviewed all eight files,
with no code findings and one optional status-spacing suggestion verified/adopted. Human review remains required.
The final documentation-only head needs its own CI readback on #46; repaired native acceptance remains unverified.

## Permissions and next gate

Wrap-up authorizes investigation and a scoped reviewable repair, not a new main merge. Use a branch/worktree from the
actual merged main, normal push and Linux-only PR CI, zero PR artifacts/installers/native allocation.
Only after maintainer review/explicit repair merge may the ordinary main workflow prove fixed macOS/Windows acceptance.
Do not dispatch native jobs on PRs, bypass protection, close incomplete parent issues or publish releases.
Rollback is a revert of the test-helper repair; TypeScript7/Oxlint integration stays intact.
