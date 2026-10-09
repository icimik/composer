# Source-size context packet

- Goal: [issue #33](https://github.com/icimik/composer/issues/33), strict 180-line files / 120-character lines, preserving behavior.
- Base: current main `a8fc96a883111279ee6a24334594248188c02312`; #1 and #25 are merged, not pending.
- Branch: `refactor/enforce-code-size-limits`. Read live PR head/CI before approving a later commit.
- Design: [source-size ADR](../docs/decisions/0003-strict-source-size-limits.md), [loop](../docs/development/loop.md), [CI policy](../docs/development/ci-policy.md).
- Acceptance: no rule suppressions/exemptions for authored JS/TS, cohesive modules, boundary tests and complete native regression.
- Evidence: 37 local units, smoke, 23 E2E, design checks and generator equivalence; exact-head native results belong on the PR.
- Authorization: merge reviewed Dependabot PRs #27–#32 if compatible and allowed by protection. No authority to bypass/change rules, auto-merge, merge this refactor, sign or publish.
- Blockers: main ruleset restricts all updates without bypass actors; plugin/Vite and TypeScript/parser compatibility findings in [dependency review](../docs/development/dependency-review.md).
- Next: inspect current-head checks, finish scoped review and request policy correction. Do not silently close failed upgrade PRs or start roadmap work.
