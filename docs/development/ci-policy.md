# CI and artifact policy

The author's policy is: no artifact upload on push/PR validation; installer building/upload begins only after merge to `main`.

## Verification

Every push, pull request and manual verification runs repository checks plus Electron smoke/full E2E on macOS and Windows. Renderer compilation is a validation step, not installer publication. Local traces/reports remain on the runner; they are not uploaded.

The smoke test uses a polluted parent Node-mode variable and verifies a real Electron window. The shared launch helper removes that variable rather than assigning an empty value.

## Packaging

The separate `package` matrix job requires `desktop` success and:

```text
github.event_name == 'push' && github.ref == 'refs/heads/main'
```

It builds unsigned development installers using `--publish never`, then uploads only installer files with a SHA-specific name and 14-day retention. Pushes to feature branches, pull requests, and `workflow_dispatch` cannot enter this job. Branch protection is a maintainer prerequisite: the condition proves a main push, not by itself that a human merged a reviewed PR.

No workflow uses `pull_request_target`, production model credentials, automated merge, package-registry publishing or release publication. GitHub Actions references are pinned to inspected upstream commit SHAs.

## Guards and limitations

`tests/unit/ci-policy.test.cjs` provides a conservative policy regression. `npm run docs:check` validates YAML, job boundaries, main-only gating, pinned actions and local documentation references. These are structural checks, not a substitute for native runs or GitHub branch protection.
