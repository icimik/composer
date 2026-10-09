# Maintainer setup and release prerequisites

This is a checklist, not a statement that remote protections or legal approvals are already configured.

- [x] Adopt MIT for Composer-authored code/docs; retain confirmed CC0-1.0 framework/skill licenses and [provenance](licensing.md).
- [x] Main rules require one PR approval and linear history; the maintainer removed the blanket update restriction.
- [ ] Add `Linux verification` as a required PR status check if desired; no required status checks are present in the inspected rules. Do not require main-only native jobs on PRs.
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
