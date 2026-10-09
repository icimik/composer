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

## Current merge results

The maintainer corrected the main ruleset. Live inspection found one required PR approval and linear history, no blanket update restriction and no required status checks. Compatible upgrades were approved under the explicit dependency-maintenance authorization and squash-merged without admin bypass:

- [#29 checkout](https://github.com/icimik/composer/pull/29): `2a6a0d5994c4fbfc023372247117ecbd0b81042c`, 09:35:39 UTC.
- [#32 globals](https://github.com/icimik/composer/pull/32): `aa553320e2cb348be8dc7eef22cb36a14cb148bb`, 09:38:49 UTC.
- [#27 upload-artifact](https://github.com/icimik/composer/pull/27): `0163def4664d7778472424fb46954dc0281bad8d`, 09:38:56 UTC.
- [#28 setup-node](https://github.com/icimik/composer/pull/28): `0d190d9bc5720115e7e14c7c650a112f04dca2f0`, 09:46:13 UTC.

#28 needed a normal merge of main into its bot branch to resolve adjacent action-pin conflicts. The reviewed net diff retained checkout/uploader upgrades and changed only setup-node pins. New head `3c6abefd7550b122aee7425ce93ef841a66f978e` passed [PR CI](https://github.com/icimik/composer/actions/runs/37912696808) and [push CI](https://github.com/icimik/composer/actions/runs/37912691219) on both native platforms, with installer jobs skipped. CodeRabbit was pending at merge with no posted blocking findings; this is not a completed independent review claim.

The preceding combined main at `0163def` passed [run 37912629893](https://github.com/icimik/composer/actions/runs/37912629893), including both native verification and installer jobs; its artifacts API returned two installer artifacts. This actually exercises upload-artifact v7 on allowed main packaging. The final setup-node combined main must be checked separately; the new Linux-first workflow has not merged yet.

#30 and #31 remain open for the peer-compatible migrations above. No forced peer install, unattended merge, refactor/CI PR merge, protection change or public release was performed.

## Historical merge blocker

Normal merge and squash attempts for #29 were denied. Live main ruleset `24777698` has active `update` (Restrict updates) and `creation` rules, no bypass actors, linear history and required Windows/macOS desktop checks. Classic branch protection API reports no classic protection, but the ruleset still applies; do not treat the former as permission to push.

At that earlier inspection no PR was merged. No admin bypass, auto-merge, ruleset modification or direct main push was performed. The former request for a policy correction is superseded by the maintainer's actual rule update and the current merge results above.

Re-read each head/diff/checks before any future authorized squash/rebase merge. Observe the actual main SHA and native packaging/upload results. Failed compatibility bumps remain unmergeable until validated compatible fixes exist.
