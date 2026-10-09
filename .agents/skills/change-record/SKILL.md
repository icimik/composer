---
name: composer-change-record
description: Record a completed logical Composer change and update the current workstate so the next context can recover from repository evidence.
---

# Change record

After a logical file/configuration change, run `date '+%F %T %Z'`. Use the returned calendar date for `.agents/worklog/YYYY-MM-DD.md`; one daily file, no numbered suffixes.

Append a concise entry containing time, reason, changed paths, relevant issue/design/commit/PR, actual checks, gaps and next action. Log logical changes rather than command transcripts.

Replace stale content in `.agents/workstate.md` with current focus, branch/base/PR, observed state, blockers and bounded next step. Historical detail belongs in git and daily logs.

Never copy secrets, user drafts or private messages into continuity files. Do not label pushed, reviewed or merged unless the corresponding remote event was read.

Output: paths updated, the logical change and its evidence. Human-facing summaries follow the user's language.

Provenance: original project adapter informed by `drafting/skills/worklog` in `kimmywork/skills`, inspected at `01b69d95`.
