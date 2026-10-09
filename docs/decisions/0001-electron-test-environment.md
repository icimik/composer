# ADR 0001: Explicit Electron test process environment

Status: proposed for review. Issue: [composer#3](https://github.com/icimik/composer/issues/3).

## Context

The original [Windows run](https://github.com/icimik/composer/actions/runs/37879905070/job/113656956280) failed before any of the 22 business tests could run, with `electron.exe: bad option: --remote-debugging-port=0`. The two launch sites inherited `process.env` and assigned `ELECTRON_RUN_AS_NODE: ''`. Linux and macOS success did not establish Windows behavior.

## Decision

Build launch options in one helper. Remove every case-insensitive spelling of `ELECTRON_RUN_AS_NODE` rather than setting it to an empty string. Preserve the other inherited variables without mutating the caller. Set fixture-only variables explicitly. Keep `--no-sandbox` limited to Linux test launches; production process options do not change.

Add environment-construction regressions, and launch a real Electron window using a deliberately polluted parent environment in a smoke test before the complete E2E suite. Do not change Electron, Playwright, or the dependency lockfile to hide the failure.

Per the author's delivery policy, push and PR verification do not build installers or upload any artifacts, including test traces and reports. Installer construction and upload are a separate job gated on a successful `push` to `main` and successful desktop verification. Local renderer compilation remains part of validation. A merge does not automatically publish a release.

## Consequences and verification

An environment regression is distinguishable from a business assertion failure. Smoke and full tests are separate CI steps; failures retain traces. Unit tests simulate Windows environment keys but are not native Windows verification. Native CI must prove the intervention works before this ADR is accepted. Signed releases, OS credential behavior and manual IME tests remain out of scope.
