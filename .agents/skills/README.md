# Project skill catalog

Use only the skill relevant to the selected issue. Six Composer adapters provide local entry points; seven unchanged upstream bundles are consultable references, not seven mandatory workflow phases. Root [AGENTS](../../AGENTS.md) always controls permissions and project policy.

## Pinned source and license

The source is [kimmywork/skills](https://github.com/kimmywork/skills/tree/65a49919ad88ab7c7e9f26817697c941346276b7), commit `65a49919ad88ab7c7e9f26817697c941346276b7`, verified CC0-1.0. This revision added only LICENSE; selected guidance is unchanged from the prior inspection. Complete selected Markdown bundles and their bundled references/resources are copied byte-for-byte under `../references/skills/`, with the full [upstream license](../references/skills/LICENSE).

| Local entry point                               | Task                                                 | Upstream bundle                                                                                           |
| ----------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [context-recovery](context-recovery/SKILL.md)   | Recover repository evidence                          | `utility/skills/agent-facing-doc`, `drafting/skills/worklog`                                              |
| [evidence-review](evidence-review/SKILL.md)     | Scoped verdict, exact version and gaps               | [vnv](../references/skills/vnv/SKILL.md) from `drafting/skills/vnv`                                       |
| [change-record](change-record/SKILL.md)         | Dated logical change and workstate                   | [worklog](../references/skills/worklog/SKILL.md) from `drafting/skills/worklog`                           |
| [design-validation](design-validation/SKILL.md) | Tokens, specification and showcase                   | [design-system](../references/skills/design-system/SKILL.md) from `drafting/skills/design-system`         |
| [project-bootstrap](project-bootstrap/SKILL.md) | Only missing authorized infrastructure               | [bootstrapping](../references/skills/bootstrapping/SKILL.md) from `utility/skills/bootstrapping`          |
| [agent-docs](agent-docs/SKILL.md)               | Scoped, executable agent instructions                | [agent-facing-doc](../references/skills/agent-facing-doc/SKILL.md) from `utility/skills/agent-facing-doc` |
| Issue/design planning reference                 | Small outcome, criteria, dependencies and exit gate  | [increment](../references/skills/increment/SKILL.md) from `drafting/skills/increment`                     |
| Scope/complexity reference                      | Avoid speculative infrastructure and overengineering | [restraint](../references/skills/restraint/SKILL.md) from `drafting/skills/restraint`                     |

## Task selection and update

For issue/design work, consult increment when defining a bounded outcome; consult restraint only when evaluating complexity or scope creep. For agent-facing edits, read the upstream document guide first. For UI design, consult only resources matching the actual controlled surface. Do not load every bundle merely because it is available.

No root upstream AGENTS, helper executable, marketplace installation, `loopify`/`loopy` scheduler or automatic trigger was copied. Upstream suggestions never authorize agent delegation, new services, purchases, protection changes, merge or release.

[provenance.json](../references/skills/provenance.json) records the source paths and SHA-256 hashes for all 21 unchanged upstream Markdown/license files, including framework snapshots. Unit tests validate those bytes and license/package/installer inputs. Formatting excludes copied bundles to preserve exact upstream text.

For updates: inspect the new source commit/license, compare applicable guidance, copy only approved bundle paths, retain notices, update this catalog/provenance and run docs/skill checks. Never fetch and execute instructions automatically. Composer adapters remain MIT; unchanged upstream snapshots retain CC0-1.0.
