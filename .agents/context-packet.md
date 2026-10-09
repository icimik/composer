# Toolchain evaluation context packet

- Goal: close verified-complete issues, then evaluate TypeScript/Vite upgrades without forcing compatibility.
- Base: main `7e2c2dfe80ca1468bec58891d6ebd8a5668858d3`; #34/#36 merged, #3/#33/#35 completed, main runtime/installer CI passed.
- Issue/branch: [#38](https://github.com/icimik/composer/issues/38), `research/toolchain-upgrade`; independent draft candidate from main, not a continuation of the former stack.
- Design/evidence: [toolchain evaluation](../docs/research/toolchain-upgrade.md), [CI policy](../docs/development/ci-policy.md), [loop](../docs/development/loop.md).
- Candidate: Vite8.3.4/plugin6.1.2/TS6.0.3; current stable parser unchanged and peers satisfied.
- Intervention: explicit ESM `.mts` config and `vite/client` types fix observed warning/CSS compile failure; strict guards cover `.mts`.
- Acceptance: clean peers/install, all quality/build/tests, 63 units, 23 E2E, Linux-only PR/push and zero artifacts. Dev/preview HTTP startup passes; interactive HMR/native/manual acceptance remains separate.
- Boundaries: no TypeScript7 peer override, canary parser, unattended merge, protection change, signing or release. Existing advisory/manual gates remain.
- Next: inspect draft PR head/CI, obtain approval of direction/review; actual upgraded native validation follows only authorized maintainer merge.
