# Contributing to Icimik Composer

This is an early local-first desktop writing tool. Start with [README](README.md), the [roadmap](docs/research/09-后续设计与竞品调研.md), and the [engineering loop](docs/development/loop.md). The license decision is pending; review [licensing](docs/development/licensing.md) before submitting or redistributing contributions.

## Choose and design one change

Search existing issues and PRs before opening another. Reference one primary issue, read its dependencies, and state the user-visible outcome and acceptance criteria. Discuss changes to storage, AI data transmission, framework rules, runtime semantics or public APIs in a small design note/ADR before implementing them. Avoid unrelated formatting or dependency upgrades.

Branch from the verified base. Until PR #1 is merged, follow-up PRs can be stacked onto `feat/novel-workbench`; explicitly document that base and retarget only after it lands. Do not mistake a passing stacked PR for a change already on `main`.

## Local validation

Use Node 22.12+ and the committed npm lockfile.

```sh
npm ci
npm run check
npm run test:smoke
npm run test:e2e
```

Linux needs a GUI runtime and Xvfb: `xvfb-run -a npm run test:e2e`. Tests must use temporary data and mock model services, not real user manuscripts or billable models. Four launch-helper regressions cover inherited Node-mode environment keys; the smoke test proves a real desktop window can start.

`npm run lint` checks renderer, main-process, scripts and tests for configured correctness rules. `npm run format:check` applies to the maintained infrastructure surface; legacy application code, upstream framework snapshots and generated research/design artifacts are deliberately not reformatted in this bootstrap PR.

## Commits, PRs and review

Use focused Conventional Commit messages such as `fix(e2e): ...` and `docs(loop): ...`. Keep the PR small enough to review, include its issue/design references, verification commands and results, screenshots only when behavior changes, and known limitations. Do not upload CI artifacts for push/PR builds.

Use [the review checklist](docs/development/review-checklist.md). Fix findings in traceable commits and refresh evidence after the head SHA changes. A maintainer decides merge; AI-generated self-review does not count as another person's approval. Retest the merge result and update the issue/workstate only after verified merge.

## Safety and community

Do not paste model keys, paid-service credentials, real drafts or private data into issues, logs or fixtures. Report vulnerabilities using [SECURITY.md](SECURITY.md), not a public bug issue. Follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Maintainer setup and license prerequisites are tracked in [the setup checklist](docs/development/maintainer-setup.md).
