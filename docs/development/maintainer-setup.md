# Maintainer setup and release prerequisites

This is a checklist, not a statement that remote protections or legal approvals are already configured.

- [ ] Choose and approve the application/documentation license scope after [provenance review](licensing.md).
- [ ] Require reviewed PRs and successful macOS/Windows desktop checks for `main`; disallow direct pushes and force-pushes. Set required check names after the CI naming is stable.
- [ ] Decide reviewer/maintainer roles and CODEOWNERS only after confirming actual responsibilities.
- [x] Enable GitHub private vulnerability reporting (enabled and read back on 2026-10-09).
- [ ] Verify the private reporting user journey and publish a durable escalation contact.
- [ ] Provide a confidential conduct-reporting contact, conflict-of-interest and appeal procedure.
- [ ] Review Dependabot update cadence and avoid unattended auto-merge.
- [ ] Decide architecture/platform support, icon rights, macOS signing/notarization and Windows signing.
- [ ] Perform real-machine IME, DPI, dialogs, credential-denial, install/uninstall and migration checks.
- [ ] Review third-party licenses, dependency advisories, real-model compatibility and data-loss risks before release.
- [ ] Publish only with an explicit release authorization, version/tag and reviewed release notes.

The agent must report which remote settings it actually inspected/changed and which checklist items remain unresolved. A successful `main` workflow does not approve the rest of this checklist.
