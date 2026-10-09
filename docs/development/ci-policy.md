# CI and artifact policy

The maintainer's policy: ordinary PR/push validation uses Linux only; native macOS/Windows validation and installer upload run only after merge to `main`. No public release is automated.

## Ordinary verification

`verify` / `Linux verification` runs on Ubuntu 22.04 for every push, PR and manual dispatch. It installs Electron runtime libraries, runs repository checks (including portable TypeScript/renderer build), then Electron launch smoke and all E2E under Xvfb. This checks platform-neutral code on Linux; it is not a claim to cross-compile macOS/Windows installers or establish native acceptance.

No ordinary validation job packages installers or uploads artifacts, including test reports. Local traces stay on the runner. The smoke test verifies a real Electron window with a polluted Node-mode parent; the shared launch helper removes that variable.

## Main-only native verification and packaging

The `desktop` matrix requires `verify` success. The `package` matrix requires `desktop` success. Both use macOS 14 and Windows and have this exact job-level gate:

```text
github.event_name == 'push' && github.ref == 'refs/heads/main'
```

Native jobs run build/checks, smoke and full E2E only on main pushes. Packaging then builds unsigned installers with `--publish never`, uploading only DMG/ZIP/EXE files with SHA-specific names and 14-day retention. PRs, feature pushes and manual dispatches skip both native matrices before allocating runners.

Main PR protection enforces entry via reviewed merges; a workflow main-push condition alone does not prove a reviewed merge. The maintainer removed the blanket update restriction; the inspected rules still require one approval and linear history, but have no required status checks. Adding `Linux verification` as a required PR check remains a maintainer decision. Do not require main-only native jobs on PRs.

## Guards and limitations

`scripts/ci-policy.cjs` is shared by docs validation and unit tests. Tests reject ungated native jobs, non-Linux ordinary runners, missing dependency gates, extra jobs, artifact/report uploads or installer building in validation, mutable action pins and privileged PR triggers. LF and CRLF parsing are covered.

Structural tests do not replace live run inspection. Read the exact head, jobs, runner platforms, conclusions and artifacts count. Main-only jobs cannot be claimed as tested by a PR where they were skipped. There are no production model credentials, auto-merge, registry publication or automatic releases.
