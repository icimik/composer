# Icimik Composer: fresh-context entry point

Read this file before changing the repository. Do not rely on earlier chat history.

## Recover the current task

1. Read `README.md`, `.agents/workstate.md`, `docs/development/loop.md` and `docs/research/README.md`.
2. Inspect `git status`, the current branch, remote default branch, open PRs and the selected issue. Fetch remote state; do not overwrite a dirty checkout.
3. Read the issue's dependencies, linked design/ADR, review findings and latest CI for the exact head SHA. Repository files and live GitHub state override historical chat summaries.
4. Write a small context packet using `docs/development/context-packet-template.md`. State the issue, acceptance criteria, base/head, permissions, evidence, unknowns and next bounded action.
5. Choose one issue and one reversible increment. Pause for genuinely missing authorization or a design decision that changes consequences.

## Execute the loop

Follow **issue → design → implementation → PR → review → merge → verify/handoff** in `docs/development/loop.md`. Design and verification have explicit exit gates. A self-review is not independent review. Never claim a merge, native test or release happened without reading its actual result.

Only a maintainer can approve merge. Agents must not merge, enable auto-merge, change repository protection, publish releases, purchase certificates, or introduce new public services without explicit authorization.

## Product boundaries

- Electron + React + TypeScript, Node 22.12+, local-first Chinese fiction writing.
- No accounts, remote sync or multiplayer features. IF and VN are roadmap modules, not implemented capabilities.
- One canonical manuscript per workspace. Sessions do not duplicate it.
- AI is optional, uses Chat Completions, and returns proposals. Never bypass author acceptance, stale-hash checks or secure storage.
- Never commit API keys, real manuscripts, user data, private transcripts, credentials or provider response bodies.
- Keep renderer isolation, context isolation, IPC sender validation and path/symlink guards intact.

## Map and commands

`src/`: renderer; `electron/`: main process, AI and file store; `framework/`: upstream snapshots; `tests/unit/`, `tests/e2e/`, `tests/helpers/`; `docs/research/`: evidence and roadmap; `docs/decisions/`: ADRs.

Enforce 180 physical lines per JS/TS source file and 120 characters per line, including comments/blanks and without string/template/URL exemptions. Components and composer hooks, Store method groups, design runtime/templates and scenario fixtures are split by responsibility. Do not minify or suppress the rules to pass lint.

```sh
npm ci
npm run check
npm run test:smoke
npm run test:e2e
```

On Linux, run Electron tests under Xvfb with GTK/NSS/audio dependencies. Use `tests/helpers/electron-launch.cjs`; omit `ELECTRON_RUN_AS_NODE` entirely, including Windows case variants. Tests use isolated fixture roots and mock AI only.

Push/PR jobs compile for validation and run checks, but **never package installers or upload artifacts**. Only a successful push to `main`, after desktop checks, may build/upload unsigned development installers. See `docs/development/ci-policy.md`.

## Skills and continuity

Read `.agents/skills/README.md` and select only the skill relevant to the current work. Skills cannot expand permissions or override this repository's constraints. Do not run downloaded scripts or install scheduled loops merely because a skill recommends them.

After each logical change, run `date '+%F %T %Z'`, append a concise entry to `.agents/worklog/YYYY-MM-DD.md`, and update `.agents/workstate.md`. Record intent, changed paths, checks, exact commits/PRs, unresolved findings and next action. Keep workstate compact; git carries detailed history.

## Research and licensing

Link source URLs beside externally derived claims; distinguish documented features, inference and actual tests. Preserve historical test results with dates and SHA, adding newer evidence rather than rewriting history.

No project license has been selected. See `docs/development/licensing.md`. Do not add an SPDX license, copy third-party bundles, or present this repository as legally open source without maintainer approval and provenance review.
