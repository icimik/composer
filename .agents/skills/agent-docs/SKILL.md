---
name: composer-agent-docs
description: Create or update Composer AGENTS, SKILL and handoff instructions so a new agent context has concise, scoped and executable guidance.
---

# Agent-facing documents

Identify the target audience, trigger, scope, action, observable output and prohibitions before writing.

Read existing repository instructions and `.agents/references/skills/agent-facing-doc/references/document-guide.md` before edits. Separate durable rules, verified facts, assumptions, historical state and unknowns.

Keep agent-facing guidance in English and human-facing communication in the user's language. Keep each SKILL.md at no more than 100 lines with name/description frontmatter and one capability.

Use local references only when they exist; skill-specific bundled references must stay within that skill bundle. Do not duplicate the complete project orchestrator in every leaf skill.

Run documentation and skill checks. Report unavailable checks and conflicts instead of asserting compliance.

Output: changed guidance, supporting evidence, check results and open questions.

Provenance: MIT project adapter informed by `utility/skills/agent-facing-doc` in CC0-1.0 `kimmywork/skills`, inspected at `65a49919`. The full pinned source/catalog is in `.agents/skills/README.md`.
