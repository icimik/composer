# Current verification

Updated 2026-10-09 UTC. This file separates observed results from historical source-import records and unexecuted acceptance work.

## Windows repair

Application PR [#1](https://github.com/icimik/composer/pull/1) remains open. Native verification of code commit `dae9ad70c22817544d40d364d5ec179f6b29cc4e` succeeded in [run 37883284843](https://github.com/icimik/composer/actions/runs/37883284843).

- Windows: build and design checks passed; 28 unit tests passed and 2 pre-existing symlink tests were skipped; poisoned-environment Electron smoke passed; all 23 full Electron E2E passed.
- macOS 14: build and design checks passed; all 30 unit tests passed; poisoned-environment Electron smoke passed; all 23 full Electron E2E passed.
- Both platforms passed 76 contrast pairs and rejected 3 deliberately corrupted token cases.
- The installer job was skipped. The run artifacts API reported zero artifacts.

Original Windows launch failures were `electron.exe: bad option: --remote-debugging-port=0`. The launcher now removes inherited `ELECTRON_RUN_AS_NODE` keys case-insensitively instead of setting an empty value. Regression coverage exercises empty, `0`, `1`, mixed-case keys, environment immutability and platform-specific sandbox flags. See [the launch ADR](../decisions/0001-electron-test-environment.md).

The first repair run also exposed a newly added CI-policy test's LF-only assumption. It was corrected to normalize CRLF and explicitly test both checkout formats before the successful run above. This is not evidence that the Electron fix itself failed.

## Foundations verification

Local Linux/Xvfb passed build, 30 unit tests, one smoke test, 23 E2E, 76 contrast checks and 3 negative token tests with the foundations changes. The branch additionally passed scoped lint/format checks, documentation/skill references, YAML parsing and structural CI-policy validation. Its exact-head native CI is reported on the foundations PR; do not substitute the application run above for validation of that later head.

Dependency audit on 2026-10-09 reported zero production dependency advisories with `npm audit --omit=dev`, but 8 moderate findings in the full development-toolchain tree. They derive from the `sprintf-js` advisory through Electron packaging/download dependencies; see [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c). No high/critical finding was reported by this audit. Do not interpret this as proof of security or run a force upgrade without validating installer compatibility. Track remediation in [desktop release issue #23](https://github.com/icimik/composer/issues/23).

AI E2E uses a local mock provider. These results do not establish quality or compatibility of every real OpenAI-compatible service, manual Chinese IME behavior, signed installers, notarization or native installation acceptance.

## Packaging policy

Push and pull-request verification compile the application and run checks/tests only. No PR or non-main branch job builds installers or uploads reports, screenshots or other artifacts.

Installer packaging and upload require a successful desktop matrix and a `push` event on `refs/heads/main`. Packaging uses `--publish never`; it creates unsigned development installers, not a public release. No main packaging run has been claimed here because PR #1 has not been merged.

The workflow cannot distinguish an allowed merge from an unprotected direct push to main. Maintainers must configure [main protection and required review](../development/maintainer-setup.md) to enforce “only after merge” as a repository policy.

## Remaining gates

- Independent review and maintainer-authorized merge; this change has only author self-review.
- License selection, framework snapshot rights and upstream skill reuse clearance.
- Protected-main/reviewer configuration, conduct reporting contact and signed release process.
- Manual macOS/Windows installation, Chinese IME and real-provider acceptance.

The [research index](README.md), [fresh-context loop](../development/loop.md) and [workstate](../../.agents/workstate.md) are recovery entry points. Historical 0.1 validation records remain intact and are not current CI claims.
