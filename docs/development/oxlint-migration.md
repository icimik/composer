# Oxlint migration design

Primary issue: [#44](https://github.com/icimik/composer/issues/44). This is a scoped tooling change, not runtime redesign.

## Evidence and alternatives

[PR #31](https://github.com/icimik/composer/pull/31) fails at clean install before compiling: typescript-eslint 8.71.1
requires TypeScript `>=4.8.4 <6.1.0`. [#38](https://github.com/icimik/composer/issues/38) correctly deferred TS7 while
retaining that parser; #39 has since merged. Removing the dependency changes that premise, not the historical evidence.

The existing config uses ESLint core recommended rules, not typescript-eslint plugin rules or type-aware analysis.
The parser only reads TS/TSX/MTS. No React or custom plugins need porting. Incremental `oxlint && eslint` would retain
the peer conflict, so complete replacement is appropriate if rule and compiler regressions pass.

Use Oxlint 1.87.0, pinned, with a JSON config mechanically converted by `@oxlint/migrate@1.87.0 --with-nursery
--js-plugins=false`. [Official migration guidance](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint) describes
conversion and the need to check unsupported rules. Keep explicit severities/options and existing file/global overrides;
disable default categories/plugins to avoid an unrelated policy expansion.

## Rule mapping and acceptance gates

- Migrator preserves 62 distinct configured native rules, including `max-lines` with blanks/comments counted.
- Explicitly include `no-undef` and `no-useless-assignment` despite their nursery categorization; omitting them is a loss.
  TS keeps `no-undef` off, unused variables remain off, CJS keeps `preserve-caught-error` off, as before.
- Unsupported `max-len`: use a deterministic local source scanner, matching ESLint's Unicode-codepoint count, tab width 2,
  line endings and no string/template/URL exemptions. Enforce physical line count there too for every maintained extension.
- Unsupported `no-dupe-args` / `no-octal`: ESM native parser rejects both; TS native `no-redeclare` rejects duplicate
  parameters, but script-mode TSX (no import/export) permits legacy octal; TSX modules reject it. Preserve rejection in the
  existing mandatory `tsc --noEmit` build/check gate, with an explicit compiler regression; standalone lint does not reject
  script-mode TSX legacy octal. This changes diagnostic
  stage, not the full quality gate, and is a disclosed review tradeoff rather than exact linter parity.
  Use Node's strict compile-only check for CJS (no evaluation, dependencies or alpha JS plugin API), document the stronger
  syntax-only strict gate and test modern octal, shebangs and legal CommonJS.
- Tests cover 180/181 and 120/121, blanks/comments, CRLF/final newline/tabs/Unicode, all six extensions, ignored output,
  native recommended diagnostics, TS globals, CJS/browser override scopes and unsupported syntax.
- TypeScript stays 6.0.3 until lint migration passes; then trial 7.0.2 without force/legacy peers. Include only if clean
  install, dependency tree, compiler/build, units, real Linux Electron smoke/full E2E and exact-head CI succeed.

[Oxlint rule list](https://oxc.rs/docs/guide/usage/linter/rules.html) and local migrator output are the mapping evidence.
[JS plugins](https://oxc.rs/docs/guide/usage/linter/js-plugins) remain alpha; this candidate does not depend on that API.

## Scope, performance and rollback

Keep Node22, Electron44, Vite8, React plugin6, Prettier, CI policy, security/isolation/storage/AI behavior, MIT/CC0 and
upstream snapshots unchanged. Add no type-aware engine: there was no type-aware lint to replace, and `tsc` remains the
separate strict type-check gate. Benchmarks compare process wall times on the same source tree/Node/platform; they do not
promise a full-pipeline speedup or platform-wide performance.

Independent review, explicit maintainer merge decision and actual post-merge native verification remain separate gates.
Keep #31/#38/#44 open until appropriate acceptance. Revert the complete candidate to restore prior toolchain together.
