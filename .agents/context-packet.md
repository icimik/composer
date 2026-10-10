# Document revision recovery context packet

- Outcome: one interrupted existing-document revision completes coherently without duplicate history/audit or mismatched
  accepted proposal/body; preserve other healthy workspaces and author input. [#42](https://github.com/icimik/composer/issues/42)
  is bounded under [#4](https://github.com/icimik/composer/issues/4); now at proposed-design gate.
- Delivery: [draft PR #43](https://github.com/icimik/composer/pull/43), design/probe revision
  `0e05a8b97cac39200b9324d5d5cc1b662e3aad8b`; final exact-head verification is its PR comment, not a recovery claim.
- Actual base: `c4e5405697ed27730ed9888816b3fe732f4470f1`, clean latest main. New own branch
  `design/document-revision-recovery-20261010`; no stack, no restored deleted branch or pre-existing changes.
- Completed dependency: [#41](https://github.com/icimik/composer/pull/41) merged; kimmywork approved exact `76e67c6` head,
  whose tree equals main. [#40 closure evidence](https://github.com/icimik/composer/issues/40#issuecomment-6093233851).
- Main evidence: [run 38019637399](https://github.com/icimik/composer/actions/runs/38019637399), Linux/macOS 93 units;
  Windows 88/five symlink-privilege skips; all smoke 1/full 38-test E2E passed. Native installers passed/artifacts=2.
  Local clean main npm ci/check/smoke/E2E repeated: 93/1/38 pass. Not a public release/manual-platform guarantee.
- Current call chain: renderer serialized flush -> sender-checked serial IPC -> Store saveDocument history/manuscript/
  manifest/audit; acceptance calls save then separately marks status. No cross-file journal exists.
- Measured: five temporary child-process exits at write boundaries leave partial/unknown state loading ready; this is
  [pre-fix evidence](../docs/research/document-revision-reproduction.md), not implemented transaction acceptance.
- Proposed contract: [ADR 0006](../docs/decisions/0006-document-revision-recovery.md), sidecar versioned intent and staged
  bytes/hashes; explicit author-confirmed recovery, pure diagnosis, no external third-value overwrite; canonical Markdown.
- Unknown: new ADR approval, recovery consent/downgrade behavior and resource budget. No approval inherited from ADR 0005.
  Tests mapped in ADR are future implementation requirements; current probes/baseline tests do not establish recovery.
- Non-goals: workspace creation/deletion/registry transactions, prompt-only atomicity, backups/retention/generic repair,
  database/schema migration, watchers/sync/accounts/new AI/IF/VN, absolute power-loss or external-race safety.
- Permissions: create/update issues, own branch/commits/push/draft PR; #40 closure explicitly authorized and completed.
  No merge/auto-merge/protection/force-push/release/scheduler/delegation. #4 stays open.
- Next: independently review exact proposed ADR revision and choose resource policy; only then red regressions/implementation.
- Rollback: design/probes removable. Future runtime downgrade with pending journal is unsafe; completion/validation required.
