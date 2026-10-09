---
name: composer-design-validation
description: Validate or update Composer UI design artifacts using actual tokens, scenarios and measured accessibility rather than invented visual values.
---

# Design validation

Use for changes to shared UI tokens, themes, components, design specifications or the offline showcase.

Read actual `src/styles.css`, affected components and the current research design artifacts. Identify the controlled surface; OS palettes and future game surfaces are not automatically owned by the desktop theme.

Keep specification and showcase aligned with the same token source. Run `npm run design:check`; if deliberately changing tokens, run the generator and inspect both outputs.

Validate relevant states, focus, zoom, contrast, reduced motion and color-not-alone semantics. Keep Chinese manuscript fixtures free of real user data.

Do not redesign the whole product during a bug fix. Browser showcase evidence is not native desktop usability evidence.

Output: changed design scope, measured checks and unverified cases, in the user's language.

Provenance: MIT project adapter informed by `drafting/skills/design-system` in CC0-1.0 `kimmywork/skills`, inspected at `65a49919`. Consult `.agents/references/skills/design-system/` and only its relevant surface resources.
