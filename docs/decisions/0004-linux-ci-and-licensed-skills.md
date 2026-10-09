# Linux-first CI and licensed skill snapshots

Status: accepted by maintainer merge; new main path passed [run 37922322450](https://github.com/icimik/composer/actions/runs/37922322450) at `7e2c2df`, including Linux, native verification and installers. Historical pre-merge limits below describe the implementation phase.

## Context and authorization

On 2026-10-09 the maintainer requested Linux-only ordinary push/PR checks, native builds only after main merge, MIT for Composer, and refreshed upstream skills following their CC0-1.0 adoption. Existing authorization covers safe Dependabot merges, not merge of the refactor or this implementation.

## Decision

Use three stages: Linux portable build/checks and Xvfb Electron tests for all events; main-push-only native macOS/Windows checks after Linux success; main-push-only installers after native success. Preserve no PR uploads, pinned actions, Node 22, read-only workflow permissions and `--publish never`. See [CI policy](../development/ci-policy.md).

Adopt root MIT with package metadata and installer notices. Keep framework/skills under their verified CC0-1.0 licenses and exact source commits. Import seven unchanged Markdown skill bundles with their references/resources, retaining six local adapters as project permission overlays. See [licensing](../development/licensing.md) and [skill catalog](../../.agents/skills/README.md).

## Alternatives and evidence

Keeping native jobs on every PR conflicts with the requested runner policy. Cross-compiling native installers on Linux would conflict with the prior no-PR-installer policy and would not establish native acceptance. Copying the entire skills repository would add unrelated tools and execution mechanisms; selected Markdown bundles are sufficient.

Semantic policy checks and negative mutation tests guard the event/platform/artifact boundaries. Live PR checks must prove Linux-only execution and zero artifacts; native/main packaging remains unverified under this new workflow until it merges. Historical native results remain evidence for their exact old SHA only.

## Rollback and boundaries

Revert this change through a reviewed PR if the workflow needs rollback; do not silently restore native PR runners or uploads. No branch-protection changes, independent review claim, automatic merge, signing or public release is included.
