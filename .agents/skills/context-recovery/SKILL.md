---
name: composer-context-recovery
description: Start or resume a Composer engineering task by reconstructing one bounded context packet from repository files and live GitHub evidence.
---

# Context recovery

Use on a fresh context, a handoff, or an apparently missing progress detail.

1. Read repository AGENTS, README, current workstate and research index.
2. Inspect the dirty tree, base/head/default branch, selected issue, dependencies, open PR and current-head CI.
3. Compare historical status with live state. Do not infer missing work or a merge from an earlier answer.
4. Read only the relevant design, code and review findings.
5. Create a context packet: verified scope/criteria, source versions, branch/PR, permission boundaries, unknowns and one next action.

Do not implement unrelated issues while recovering context. Never paste private chat logs, credentials or manuscripts into the packet.

Output: a compact evidence-based recovery packet and any material blocker. Human-facing summaries follow the user's language.

Provenance: MIT project adapter informed by `utility/skills/agent-facing-doc` and `drafting/skills/worklog` in CC0-1.0 `kimmywork/skills`, inspected at `65a49919`. Pinned source bundles are under `.agents/references/skills/`.
