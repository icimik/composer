# Workspace fault isolation: implementation verification

Issue [#40](https://github.com/icimik/composer/issues/40), parent [#4](https://github.com/icimik/composer/issues/4).
Delivery remains [PR #41](https://github.com/icimik/composer/pull/41); no merge or issue closure is authorized.
Base main: `efcd507670b4a7d68c78a6f1b314c667ac5134ba`.
Approved design: [ADR 0005](../decisions/0005-workspace-failure-isolation.md), reviewed revision
`70d4f8925a2fd8995e455fdf9cc6fa82adcdc9d1`, with
[maintainer approval recorded](https://github.com/icimik/composer/pull/41#issuecomment-6092557163).
The verified follow-up requested implementation in #41, superseding the separate-implementation-PR plan.
Design approval is not independent approval of implementation or permission to merge.

## Red-first evidence and runtime boundaries

On original production code, explicit `node --test tests/unit/workspace-isolation.test.cjs` produced **0 passes / 9 failures**
before changes on 2026-10-10 02:10 UTC. With the smallest complete runtime correction those nine passed.
The original [pre-fix evidence](workspace-isolation-reproduction.md) is historical, not current feature behavior.
Manual defect-assertion scripts are archived at preparation commit
`d4c0c2add4d509860d4b2b94b71a3cc3a52c770d`; replaced by default unit/E2E acceptance regressions, not left as failing tools.

- **Store reads**: guarded pure paths reject internal symlinks, parent escape and non-canonical registered roots. No mkdir on
  manifest/document/history reads. Only explicit writers prepare checked directories. Registered faulty roots cannot be
  “created” into replacement novels. Import/open validates via the same guarded reader before registration/selection.
- **Results and diagnostics**: each registry entry returns a discriminated ready/unavailable result; identity comes from
  registry. Fixed Chinese reason/next-step codes never contain raw JSON, private path, exception text or provider data.
  References/identities validated; unsafe registry remains a separate global error, never reset.
- **Writes and selection**: full workspace validation before each public workspace mutation and AI configuration; AI
  response commits revalidate in the serial queue. Stale hash/proposal checks preserved. Switching reads target first,
  persists a copied registry, then commits memory/renderer identity; persistence failure does not poison current selection.
- **UI**: broken-last-active and all-failed states show explicit diagnostics/healthy choices, no fake blank manuscript.
  Retry refreshes results without hydration/flush of dirty input. A newly faulty current editor is preserved read-only;
  repaired reopening retains its original baseline hash so external edits still conflict. Unsaved suspended input prevents
  leaving/create/open from erasing it. Shared transition lock disables editor/title/prompt/selection and rejects overlap.
- **IPC/privacy**: sender/frame/origin checks retained in a focused registration helper; arbitrary exceptions are sanitized,
  while explicitly trusted user messages survive. Context isolation, sandbox, canonical manuscript and AI-author acceptance
  remain unchanged. No fault-injection flag in production; tests intercept builtin fs only in isolated test processes.

## Acceptance mapping

All test files named here run in the default unit or Electron suite; test titles are executable checks, not future plans.

| Acceptance item | Concrete automated evidence |
| --- | --- |
| Healthy + broken; save/restart | Unit `mixed-results-save-restart; broken-active-keeps-requested-id`; E2E `mixed startup: diagnostic, healthy edit/save and full restart preserve faulty inventory` |
| Broken last active | Same unit validates active=null/requested ID retained; E2E `broken last active: explicit healthy selection without fake blank B` |
| Invalid/truncated JSON, missing manifest/doc, missing directories | Unit `fault-matrix/read-retry-inventory` variants; E2E mixed/broken/all-failed/missing-manuscript scenarios |
| Read failures and honest unknown | Unit deterministic EACCES/EPERM/EIO/CUSTOM; E2E deterministic main-process read-denial diagnostic |
| Fault bytes/hash/inventory + registry retained | Matrix unit and mixed/all-failed E2E compare full file SHA-256/directory inventory; registry comparisons and entry counts |
| Fault write protection | Unit `all-mutations-refuse-fault`; E2E direct save/create/session/settings IPC attempts; mock AI in-flight fault prevents proposal/config mutation |
| Path/symlink fail closed | Existing ID/document/meta symlink units; new parent/path/candidate-open/create/index/root tests; existing child-frame and isolation E2E |
| Failed switch / unsaved input | E2E failed body/title/prompt switch, locked delayed transition/overlapping synthetic change, flush conflict; unit target validation/persistence-failure identity |
| All failed and explicit repair/retry | Unit all-unavailable and repair/retry; E2E all-failed repairs synthetic file, retries, explicitly selects, edits/saves/restarts |
| Dirty retry / repaired external edit | E2E suspended input/no-leave, healthy retry baseline conflict, repaired reopen baseline conflict |
| Existing create/open amid faults | E2E explicit create/open beside unrelated broken workspace |
| Global index is not local fault | Existing corrupt-index and new semantic/duplicate/path/read-denied/read-disappearance/dangling-symlink unit checks; startup retains safe dialog/quit |
| Real UI / compatibility | Full Electron suite including original AI/security/workspace/visual/smoke paths; TypeScript and browser-preview contract build; 180/120 lint |

Global startup dialog on actual native OS, native ACL behavior, manual keyboard/IME/accessibility, production model providers
and native Windows/macOS candidate are **not verified here**. Global handling is unit-covered; a dialog automation claim is
not inferred. Windows symlink tests explicitly skip when privilege is not guaranteed; Linux actual guards are tested.
Synthetic fs injection is deterministic and does not imply platform-specific chmod/ACL compatibility.

## Performance and limits

A 64-document temporary fixture measures full readiness read and guarded save without a timing threshold or cache.
One local measured run: readiness 12.0ms, guarded save 16.9ms; results vary with runner/cache/concurrency.
This is a small synthetic baseline, not a long-manuscript performance promise. No speculative optimization/dependency added.
File guard checks cannot make external edits or symlink replacement races atomic. Existing hash checks are retained;
cross-file crash consistency, journaling, backups/retention/recovery, migration/watchers and absolute power-loss safety
remain outside #40 and outstanding in #4.

## Validation and handoff

Use current scripts and lockfile, isolated Node22.23.3, Electron44.7.0. Run:

```sh
npx --yes --package=node@22 -c 'npm ci'
npx --yes --package=node@22 -c 'npm run check'
npx --yes --package=node@22 -c 'xvfb-run -a npm run test:smoke'
npx --yes --package=node@22 -c 'xvfb-run -a npm run test:e2e'
```

Latest local candidate passed complete check/**89 units with zero skips**, smoke **1**, and full **35 Electron E2E**,
including 12 new isolation UI scenarios. The broken-active diagnostic screenshot was visually inspected.
Final counts, exact implementation head, command outcomes, CodeRabbit/human findings and live CI jobs/artifact counts belong
to the PR verification comment for that head; do not infer them from intermediate totals or the design-only green runs.
Known test-generated screenshots are restored before commit; no private fixtures, report/trace or new artifact is uploaded.
Eight moderate existing development advisories remain; no audit fix, forced peers or toolchain upgrade.

Self-review is not independent approval. Submit for normal review after final green checks; stop at review/merge, no auto-merge.
Only a maintainer may merge; close #40 only after actual main acceptance, and keep #4 open with remaining work.
Rollback: revert implementation changes through a reviewed PR; no persisted format change/migration. Reversion restores the
old mixed-workspace startup failure, so it is not recovery. Next agent reads exact-head review/CI and addresses valid findings.
