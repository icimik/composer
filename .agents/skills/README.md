# Project skill catalog

These are small, original Composer adapters informed by selected upstream guidance, not vendored plugin bundles. Use the ordinary `SKILL.md` format; no agent-specific runtime, marketplace manifest or installation is required.

The inspected upstream is [kimmywork/skills](https://github.com/kimmywork/skills), commit `01b69d95c06ca5bc1e26157c151e75020037a4b3`. No root license was found. Do not copy upstream bundles or executors until [rights are confirmed](../../docs/development/licensing.md).

| Local skill                                     | Use                                                     | Upstream path at the inspected commit                           |
| ----------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------- |
| [context-recovery](context-recovery/SKILL.md)   | Start or resume from repository evidence, not chat      | `utility/skills/agent-facing-doc` and `drafting/skills/worklog` |
| [evidence-review](evidence-review/SKILL.md)     | Verify an exact result and record scoped findings       | `drafting/skills/vnv`                                           |
| [change-record](change-record/SKILL.md)         | Keep one dated logical-change log and current workstate | `drafting/skills/worklog`                                       |
| [design-validation](design-validation/SKILL.md) | Keep UI tokens, showcase and specification consistent   | `drafting/skills/design-system`                                 |
| [project-bootstrap](project-bootstrap/SKILL.md) | Inspect and add only missing project infrastructure     | `utility/skills/bootstrapping`                                  |
| [agent-docs](agent-docs/SKILL.md)               | Maintain focused, executable agent-facing guidance      | `utility/skills/agent-facing-doc`                               |

Choose by task, not by loading the entire catalog. `loopify`/`loopy` were inspected but not included: they concern recurring trigger/schedule execution, not this manual issue-to-merge loop. Installing a scheduler or granting autonomous merge would require separate authorization.

Updates are manual: inspect the new upstream commit, compare applicable guidance, update the adapter and provenance, and run docs/skill checks. Do not silently fetch and execute new upstream instructions. See [AGENTS.md](../../AGENTS.md) for permission boundaries.
