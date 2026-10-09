# Dependency review: 2026-10-09

The author authorized review and merge of the six Dependabot PRs present at task start. This does not authorize overriding repository protections or merging unrelated refactors.

## Reviewed bumps

| PR                                                | Change                        | Finding                                                                                                                                                         |
| ------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#27](https://github.com/icimik/composer/pull/27) | upload-artifact 4.6.2 → 7.0.1 | Version-only SHA pin; green native checks. Upload job remains main-only and skipped on PR. Actual uploader acceptance occurs only after an allowed main merge.  |
| [#28](https://github.com/icimik/composer/pull/28) | setup-node 4.4.0 → 7.0.0      | Version-only SHA pins; green native checks. Project Node stays 22.                                                                                              |
| [#29](https://github.com/icimik/composer/pull/29) | checkout 4.4.0 → 7.0.1        | Version-only SHA pins; green native checks. No privileged PR trigger added.                                                                                     |
| [#30](https://github.com/icimik/composer/pull/30) | React plugin 4.7.0 → 6.1.2    | CI fails `npm ci` with ERESOLVE: selected plugin needs Vite ^8, but project remains on Vite 6. Needs coordinated migration, not forced peers.                   |
| [#31](https://github.com/icimik/composer/pull/31) | TypeScript 5.9.3 → 7.0.2      | CI fails `npm ci` with ERESOLVE: installed/current latest typescript-eslint 8.71.1 accepts TypeScript >=4.8.4 <6.1.0. Await supported parser/compiler strategy. |
| [#32](https://github.com/icimik/composer/pull/32) | globals 16.5.0 → 17.13.0      | Package and lockfile only; green native checks.                                                                                                                 |

Action SHAs were checked against upstream release tags before attempted merge. Plugin/parser peer findings were reproduced from package registry metadata, not inferred from major-version names. No `--force` or `--legacy-peer-deps` was used.

## Merge blocker

Normal merge and squash attempts for #29 were denied. Live main ruleset `24777698` has active `update` (Restrict updates) and `creation` rules, no bypass actors, linear history and required Windows/macOS desktop checks. Classic branch protection API reports no classic protection, but the ruleset still applies; do not treat the former as permission to push.

No PR was merged by this task. No admin bypass, auto-merge, ruleset modification or direct main push was performed. Maintainer approval is needed for a minimal policy correction: retain linear history and both native checks, enforce PR-only entry, and remove the blanket update restriction or define an explicitly approved merge actor.

After policy is corrected, re-read each head/diff/checks and use an allowed squash/rebase merge. Observe the actual main SHA and native packaging/upload results. Failed compatibility bumps remain unmergeable until independently validated fixes exist.
