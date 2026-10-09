# Fresh-context engineering loop

The unit of work is one bounded issue, not a persistent chat. Recover evidence on every restart. This process is manual/agent-neutral; it does not install a scheduler, autonomous merge worker or external service.

## Recover

Read `AGENTS.md`, workstate, research index, selected issue, design and latest reviews. Inspect the dirty tree, actual base/head, open PRs, checks and dependency states. Draft a [context packet](context-packet-template.md). Separate verified facts, assumptions, decisions and missing permissions. A former “completed” message is not evidence that its branch merged.

## Issue

State the user problem, expected outcome, scope/non-goals, reproducible evidence and testable acceptance criteria. Link dependencies. Check for an existing issue/PR and reuse it; do not recreate the roadmap. Freeze the bounded issue you will address and record it in workstate.

## Design

Use [the design template](design-template.md); changes to storage, AI, framework semantics, runtime or public interfaces need a reviewed ADR. Small bugs can use a short note that captures evidence, intervention, tests and rollback. Evaluate alternatives proportionately, identify authorization boundaries, and resolve blocking questions before consequential implementation.

Exit gate: acceptance criteria map to tests or explicit manual checks, compatibility/security and migration effects are known, and a maintainer has approved consequential product decisions. A written proposal alone is not approval.

## Implementation and PR

Use a focused branch from the inspected base, preserving existing work. Write regression tests for the failure, implement the smallest correction, and run local checks. Update research, decisions and worklog when conclusions change.

Open or update the related PR with issue/design links, exact scope, commit, test evidence, known gaps and rollback. If stacked, identify the dependency/base. Push/PR validation uses Linux portable builds and Electron E2E only, never native runners, installer packaging or artifact upload. Never add “Closes” to an issue that is only partially addressed.

When a stack parent is rewritten, fetch its live ref and compare content before syncing the child. Preserve newer continuity records and historical evidence during conflicts. Prefer a normal merge when history rewriting is not authorized; verify the current parent is an ancestor, the resulting PR diff is scoped and live mergeability/checks recover. Do not overwrite the maintainer's parent or infer child approval from a parent review.

## Review

Freeze the head SHA and use [the review checklist](review-checklist.md). Record findings by location, evidence, severity and required action. Distinguish correctness, acceptance, security and readiness; enumerate unaudited areas.

Self-review is useful but not independent approval. An independent reviewer must be a different maintainer/reviewer or explicitly authorized separate review process. Resolve findings in follow-up commits and repeat affected validation after the head changes.

## Merge

A maintainer decides merge only after scope/design approval, review and required checks for the current head. Agents need explicit authorization to merge; this repository bootstrap does not grant it. Do not enable auto-merge, bypass protection, force-push shared history or publish a release to “finish the loop.”

## Verify and hand off

Read the actual merged SHA and `main` checks. Linux success gates main-only macOS/Windows native verification, whose success gates unsigned installer packaging/upload. It does not publish a public release. Close fully satisfied issues only after acceptance and merge are verified. Leave partially satisfied issues open with the remaining findings.

Update workstate and the dated worklog with the merged/result SHA, PR/issue, observed checks, unresolved risks and next issue. The next fresh context must be able to recover solely from repository artifacts and live GitHub.
