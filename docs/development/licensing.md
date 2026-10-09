# License decision and third-party provenance

## Current status

No project LICENSE exists and no SPDX license has been selected. Public visibility is not a blanket reuse grant. This bootstrap prepares open-source project infrastructure but does not claim legally open-source distribution.

The inspected `kimmywork/skills` commit is `01b69d95c06ca5bc1e26157c151e75020037a4b3`. Its repository API did not expose a root license. The framework snapshot also needs an explicit rights review. Do not infer a license from an unrelated vendored tool's LICENSE.

## Decision needed from the maintainer

Confirm the rights to application code, framework snapshots, research documents, screenshots and skill guidance. Then choose a license and its scope:

- MIT: a simple permissive candidate for application code.
- Apache-2.0: a permissive candidate with explicit patent provisions.
- A separate documentation/assets license, if desired, must specify exactly which paths it covers.

These are options, not adopted terms. Do not add a placeholder LICENSE that appears to grant rights. Before license adoption, confirm contributor acceptance, retained upstream notices, bundled dependencies, media/font permissions and whether framework materials can be redistributed.

## Skills approach

`.agents/skills/` contains original, small project-specific adapters and a provenance catalog pointing at pinned upstream skills. It does not copy upstream SKILL text, helper executables or plugin bundles, and it does not install `loopy`/`loopify` scheduled execution. Optional upstream consultation never expands permissions.

`THIRD_PARTY_NOTICES.md` distinguishes existing embedded framework materials, referenced skills and npm dependencies. Installers/release publication remain blocked on the broader release checklist; generating an unsigned development artifact is not proof of distribution rights.
