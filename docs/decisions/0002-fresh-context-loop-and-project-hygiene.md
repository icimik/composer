# ADR 0002: Repository-resident engineering context and project hygiene

Status: proposed for maintainer review.

## Context

Prior email continuations could recover summaries but not the original local branch/files. The author requested a repository entry point, research/roadmap references, selected skills and standard open-source project preparation. PR #1 is still open; `main` does not yet contain the application.

## Decision

Use a short root AGENTS entry point plus focused loop/context/design/review references, a compact workstate, and one dated log. Live GitHub/commit evidence is authoritative over prior chat.

Keep issue→design→PR→review→merge as an explicit manual loop. Review is not authorization to merge; self-review is not independent approval. Follow-up foundation changes are a stacked PR until the initial application lands.

Add contribution/security/conduct/changelog/provenance documents and issue/PR templates. Add correctness lint, narrowly scoped formatting, local-reference/YAML/skill checks and conservative dependency update configuration. Do not impose fictional coverage thresholds or reformat the legacy application.

Use small original project-specific skill adapters and pinned source provenance. Do not copy unlicensed upstream bundles or install schedule executors. A public project is not automatically legally open source; license and third-party rights remain a maintainer decision.

Preserve the author's CI policy: no push/PR uploads or installer builds; main-only packaging after successful verification, no automatic release. Remote protection/reviewer changes need explicit authorization.

## Verification and consequence

Docs/skill/YAML/CI checks must detect broken references, oversized skills, unsafe workflows and policy drift. Lint/format are real CI gates within a documented scope. Native CI validates the exact head; legal, conduct contacts, protected-main and signed release setup remain explicit open prerequisites.
