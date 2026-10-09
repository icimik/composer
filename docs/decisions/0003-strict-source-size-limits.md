# ADR 0003: Strict source size limits and cohesive modules

Status: accepted by maintainer merge; [issue #33](https://github.com/icimik/composer/issues/33) completed. Native regression passed [merged-main run](https://github.com/icimik/composer/actions/runs/37922322450).

## Requested outcome

The author requested ESLint errors for files over 180 lines and lines over 120 characters, and actual decomposition of nonconforming code. Count physical blank/comment lines; do not exempt strings, templates, URLs, tests or JSX. The rules apply to maintained JS/CJS/MJS/TS/TSX, not JSON, CSS, Markdown or template data.

The formally submitted [toolchain candidate](../research/toolchain-upgrade.md) extends the same source guards to MTS for the renamed ESM Vite configuration; no source-size exemption is introduced.

## Module boundaries

- Renderer: root App assembles components. `src/composer/` separates state/hydration, serialized saving/close acknowledgement, workspace operations, AI actions and UI effects. A typed controller carries state/actions; ready views require non-null workspace/session/document.
- UI: sidebar, editor views, AI controls/proposals and dialog forms are focused components. Fragments preserve the existing DOM hierarchy and accessible names.
- Store: schema/atomic primitives plus file-boundary, workspace, document/history and session/proposal method groups. The Store entry point preserves its public API, shared receiver/queue and non-enumerable class-method descriptors.
- AI: formatting and prompt-string concatenation preserve the same instructions and transmission scope. No provider/credential behavior is changed.
- Design generator: prose/markup move to data templates; executable showcase logic lives in a linted CJS module and is embedded as a self-contained function. Substitution is non-evaluating and requires named values.
- E2E: all 21 workbench cases remain, grouped into workspace, AI and security/boundary specs with a per-test app/mock-provider fixture. Launch smoke and visual coverage remain separate.

## Verification and rollback

Boundary regressions exercise 180/181 and 120/121, counting blanks/comments and rejecting long strings/templates/URLs. Existing store/AI/Electron tests protect autosave, conflict/stale guards, canonical manuscripts, cancellation, IPC and symlink boundaries. A generated temporary specification is byte-equal to the checked-in baseline; generated showcase handlers are compared to baseline behavior in a mock DOM.

Application/test formatting is now checked; CSS and upstream/research data are not rewritten. No ESLint suppression or exclusion is added to hide failing source. Actual native evidence belongs to the PR's exact head.

Rollback is a revert of this refactor commit. Main-only packaging/upload and no release publication stay unchanged. The author authorized Dependabot merges, not automatic merging of this refactor; maintainer review/merge remains required.
