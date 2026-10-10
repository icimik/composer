# Contributing to Icimik Composer

This is an early local-first desktop writing tool. Start with [README](README.md), the [roadmap](docs/research/09-后续设计与竞品调研.md), and the [engineering loop](docs/development/loop.md). Contributions to Composer-authored code/docs are under [MIT](LICENSE); preserve third-party terms described in [licensing](docs/development/licensing.md).

## Choose and design one change

Search existing issues and PRs before opening another. Reference one primary issue, read its dependencies, and state the user-visible outcome and acceptance criteria. Discuss changes to storage, AI data transmission, framework rules, runtime semantics or public APIs in a small design note/ADR before implementing them. Avoid unrelated formatting or dependency upgrades.

Branch from the verified current `main`, which now contains the application and foundations changes. Stack only when there is a genuine unmerged dependency; explicitly document that base and retarget/revalidate after it lands. Do not mistake a passing stacked PR for a change already on `main`.

## Local validation

Use Node 22.12+ and the committed npm lockfile.

`.gitattributes` and `.editorconfig` keep text checkouts in LF on every platform. Binary media/installers are not normalized. Keep these conventions so Windows format checks evaluate the same content as macOS/Linux.

```sh
npm ci
npm run check
npm run test:smoke
npm run test:e2e
```

Linux needs a GUI runtime and Xvfb: `xvfb-run -a npm run test:e2e`. Tests must use temporary data and mock model services, not real user manuscripts or billable models. Four launch-helper regressions cover inherited Node-mode environment keys; the smoke test proves a real desktop window can start.

`npm run lint` uses Oxlint plus a deterministic source-size/strict-CJS-syntax guard for maintained JS/CJS/MJS/TS/MTS/TSX in renderer, main process, scripts and tests. Files must have at most 180 physical lines, including blanks/comments; lines must have at most 120 characters. Strings, templates, URLs and JSX are not exempt. Split cohesive responsibilities instead of compressing source or adding suppressions. The CJS guard compiles without evaluation, rejecting duplicate parameters and legacy octal syntax; use modern `0o` literals. Rule mapping and rollback are documented in [the migration design](docs/development/oxlint-migration.md).

Lint also runs pinned native type-aware/type-check diagnostics for the TS project, including Promise misuse/unhandled Promises and await-thenable. `build` retains independent `tsc --noEmit` checking with strict indexed access, exact optional properties, implicit-return/override and switch-fallthrough guards. CJS additionally rejects dynamic evaluation, function-constructor execution and native-prototype extension; this is not whole-main-process checkJs typing. See [the enhancement scope and evidence](docs/research/oxlint-enhancements.md).

`npm run format:check` includes application code and tests. Upstream framework/research data and the existing CSS token source remain outside this formatting scope. JSON, CSS, prose and markup templates are not JavaScript and are not subject to source-code lint parsing; executable showcase logic is a linted module. See [the size-limit ADR](docs/decisions/0003-strict-source-size-limits.md).

## Commits, PRs and review

Use focused Conventional Commit messages such as `fix(e2e): ...` and `docs(loop): ...`. Keep the PR small enough to review, include its issue/design references, verification commands and results, screenshots only when behavior changes, and known limitations. Do not upload CI artifacts for push/PR builds.

Use [the review checklist](docs/development/review-checklist.md). Fix findings in traceable commits and refresh evidence after the head SHA changes. A maintainer decides merge; AI-generated self-review does not count as another person's approval. Retest the merge result and update the issue/workstate only after verified merge.

## Safety and community

Do not paste model keys, paid-service credentials, real drafts or private data into issues, logs or fixtures. Report vulnerabilities using [SECURITY.md](SECURITY.md), not a public bug issue. Follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Remaining maintainer setup and release checks are tracked in [the setup checklist](docs/development/maintainer-setup.md).
