# Workspace isolation: pre-implementation evidence

Date: 2026-10-09 UTC. Issue [#40](https://github.com/icimik/composer/issues/40), parent [#4](https://github.com/icimik/composer/issues/4).
Production base: `efcd507670b4a7d68c78a6f1b314c667ac5134ba`.
Design: [proposed ADR 0005](../decisions/0005-workspace-failure-isolation.md), **not approved or implemented**.
Delivery: [draft PR #41](https://github.com/icimik/composer/pull/41). Evidence/helper commit
`d4c0c2add4d509860d4b2b94b71a3cc3a52c770d`; latest documentation head and CI are read from that PR.

## Fresh-context recovery

The workspace directory was empty, not an existing dirty checkout. Inspected repository metadata (default main, connected
account ADMIN permission), cloned, checked clean status/remotes, and safely fetched/pruned remote tracking refs.
Created `design/workspace-failure-isolation-20261009` from the actual origin/main above, not a deleted branch or PR stack.
Missing author/committer identity was configured repository-locally to the connected account's verified no-reply identity.
No credentials, previous chat/memory or upstream script were read/executed.

Read AGENTS, README, workstate/date worklog, development loop/templates/review/CI, research index and data-reliability
references, all four existing ADRs, live #2/#4 bodies/comments, issue/PR inventory and #4 cross-reference timeline.
Read only context-recovery, increment, evidence-review and then agent-docs/document guide for continuity edits.
Pinned framework/skill provenance is unchanged; this increment does not need upstream updates.

Live correction: [#39](https://github.com/icimik/composer/pull/39) merged 2026-10-09 12:02:01 UTC; kimmywork approved its
reviewed head. Both CodeRabbit documentation findings were already fixed in that merged tree. The old workstate's upgrade
approval blocker is obsolete, not a reason to redo it. [Merged main run](https://github.com/icimik/composer/actions/runs/37927426466)
completed successfully: Linux, Windows/macOS native and both installer jobs; artifact API count=2.
#38 remains open in live GitHub; no out-of-scope issue closure was performed.
The only other open PR was [#31](https://github.com/icimik/composer/pull/31), TS7, with failing Linux checks at
`64be5aa5f1c25b6446b16cd27a709d4128d281d5`; unrelated and untouched.

No matching isolation child issue/design/PR was found. Created #40; existing ADRs do not approve this storage/API/UI change.

## Call-chain audit at base

| Boundary | Observed behavior | Consequence / design obligation |
| --- | --- | --- |
| Store groups | `electron/store.cjs` shares receiver and serial queue | Preserve serialization/descriptors; split new helpers by responsibility under 180/120 |
| Aggregate | `files.cjs:83–87` loads all entries via Promise.all | Any failed B rejects even if A loads |
| Manifest/document reads | `protectedFile:29–41`, `docPath:56–71` mkdir before guarded read | Missing internal directories are recreated during diagnosis |
| Single workspace | `workspace:73–81` loads all referenced manuscripts | Manifest-only mutation guards are insufficient for a missing manuscript |
| Init/global index | `workspaces.cjs:17–26` does not reset malformed JSON | Preserve global fail-closed handling; validate registry structure before local mapping |
| Selection | `switchWorkspace:80–84` persists active ID before loading | Failure can poison next startup despite current renderer staying on A |
| Open directory | `openWorkspace:67–78` reads raw manifest, registers/selects then aggregate loads | Must use guarded candidate reads and validate before selection; symlink bypass not acceptable |
| Mutations | `updateWorkspace:86–98` reads only meta, writes then workspace return | Unloadable B can be modified before an operation rejects |
| IPC | `main.cjs:80–128`, preload bridge | Sender/mainFrame/origin checks must remain; guarded results must not carry raw errors |
| Hydration | `useComposerState:49–64` assumes workspace/session/doc exist | Fault cannot masquerade as Workspace; handle explicit no-active state |
| Product shell | `App.tsx:12–19` returns loading/alert without navigation if state incomplete | A cannot be selected after aggregate failure |
| Workspace switch | `useWorkspaceActions:39–48` flushes, awaits target then hydrates | Failure retains current inputs, but pending successful transitions need lock/identity commit |
| Save | `useSave:19–63` uses live current IDs and serialized saves | Preserve in-flight edits; no-ready states must not use non-null assertions or fallback IDs |
| AI | renderer resolve + `ai.cjs` generate + Store proposal methods | Readiness must guard proposal writes/acceptance and post-response commit, not just UI controls |
| Selector | `Sidebar` controlled select and workspace tools | Explicit diagnostic list/selection, safe retry, transition disable state needed |
| Types/preview | `types.ts` AppState/Bridge, `preview.ts` | Update together after approval; discriminated results prevent fault hydration |

This is scoped inspection plus the measurements below, not proof of all path races or optional history integrity.
Code evidence: [files](https://github.com/icimik/composer/blob/efcd507670b4a7d68c78a6f1b314c667ac5134ba/electron/store/files.cjs),
[workspaces](https://github.com/icimik/composer/blob/efcd507670b4a7d68c78a6f1b314c667ac5134ba/electron/store/workspaces.cjs),
[renderer](https://github.com/icimik/composer/blob/efcd507670b4a7d68c78a6f1b314c667ac5134ba/src/composer/useComposerState.ts).

## Reproduction commands

Host default Node was 20.20.2, below the repository floor. Used isolated npm-exec Node **22.23.3** without changing
package.json, lockfile or .nvmrc. Local Electron remains the locked **44.7.0**.

```sh
npx --yes --package=node@22 -c 'node -v; npm ci'
npx --yes --package=node@22 -c 'node tests/helpers/workspace-isolation-probe.cjs'
npx --yes --package=node@22 -c 'npm run build'
npx --yes --package=node@22 -c 'xvfb-run -a node tests/helpers/workspace-isolation-ui-probe.cjs'
```

Electron's binary was not initially present after ci; ran `node node_modules/electron/install.js` using Node22 to obtain the
same locked binary. GTK was missing; installed host libgtk-3-0t64 (with NSS/audio/GBM/Xvfb prerequisites).
The initial host dependency command using libasound2 failed because this host requires the t64 package name; corrected it.
These are sandbox preparation, not application dependency upgrades or CI changes.

Helpers use only mkdtemp fixtures, synthetic Chinese text, no AI request or real secret, and clean up roots in finally.
`workspace-isolation-probe.cjs` asserts observed defects and passing existing protections.
`workspace-isolation-ui-probe.cjs` drives actual Electron via the existing launcher and Playwright, without browser preview.
They deliberately live outside unit/E2E default globs. Exit zero means the **current defect was characterized**, not fixed.
Once implementation changes behavior, replace/archive these pre-fix assertions with the ADR's acceptance regressions.

## Store measurements

| Synthetic fault | Actual result | Integrity observation |
| --- | --- | --- |
| Invalid JSON B | load and restart aggregate reject; direct A save/restart still works | B file hashes/inventory and registry bytes unchanged |
| Truncated JSON B | Same aggregate rejection | B inventory and registry bytes unchanged |
| Missing manifest B | Same aggregate rejection | File stays absent; other inventory/registry unchanged |
| Missing referenced document B | Same aggregate rejection | File stays absent; other inventory/registry unchanged |
| Missing .composer directory B | Same aggregate rejection | Read recreates .composer; fails strict directory preservation |
| Missing chapters directory B | Same aggregate rejection | Read recreates chapters directory; fails preservation |
| Injected EACCES on manifest | Aggregate rejects with EACCES | Deterministic test-process fs interception; not native ACL/chmod evidence |
| Switch A → malformed B | Request rejects, disk active ID becomes B | Failed B inventory unchanged, but registry selection changed |
| Missing B document + update target | workspace rejects; updateWorkspace also rejects on return | Manifest target has nevertheless changed; missing whole-workspace mutation guard |
| Both manifests invalid | Aggregate rejects | No independent fault objects |
| Global registry JSON invalid | init rejects with existing safe index error | Original registry bytes unchanged, no reset |

For local matrix cases, A's synthetic UTF-8 save hash survives a new Store even though aggregate reload still rejects.
No claim that the product UI can currently perform that healthy save beside a known fault.
The write-guard case intentionally mutates only the throwaway B fixture to prove the defect, not user data.

## Real Linux UI measurements

- **B last active, malformed manifest**: real window shows an alert; composer shell, healthy workspace selector and editor
  are absent. Fault B's full inventory/hashes remain unchanged in this case.
- **A open, then damage B and attempt switch**: body/title/prompt inputs remain exact after failure; A's synthetic text is
  flushed to A, B manifest remains malformed. Native selector reads A; disk registry nevertheless selects B.
  This verifies partial current protection and the separate persisted-selection defect; it does not prove concurrent/delayed
  transition safety, which needs new regressions.
- **Both damaged, restart**: alert only, no composer shell and no explicit retry button. The new safe diagnostic/retry UX
  is not implemented. Fixture repairs used to reach the second scenario are explicit test setup, not product repair.

Console output contains only scenario labels, not manuscripts, raw exception text, filesystem paths or credentials.
No screenshots or fixture copies were committed.

## Verification and gaps

Commands/results for the final preparation head are recorded in the PR's exact-head verification comment.
Local preparation content passed `npm run check` (lint/format/docs/type/build, 63 units with zero failures/skips and design
checks), explicit Store/UI characterization, `xvfb-run -a npm run test:smoke` (1 passed) and
`xvfb-run -a npm run test:e2e` (23 passed). These commands ran under Node22.23.3 via the wrapper above.
The install reported eight moderate development advisories; no audit fix/forced peers or toolchain change was attempted.
Test-generated tracked screenshots are restored before submission; no fixture, report or artifact is uploaded.
The default baseline checks/smoke/full E2E remain mandatory even though this PR changes no production code.
Existing full E2E success does **not** cover the proposed isolation capability; its missing regressions are mapped in ADR 0005.
Native Windows/macOS tests were read for base main only, not run for this preparation branch.
Native ACL behavior, manual IME/accessibility, external-edit races, power-loss/transaction/backup/migration and performance
remain unverified. Permission failure here uses deterministic injection rather than unstable privileged chmod behavior.

Self-review is not approval. Do not implement ADR 0005 before a maintainer reviews its exact revision.
At delivery, CodeRabbit explicitly skipped draft review and no human approval was present; bot status success is not a verdict.
The [evidence-head push run](https://github.com/icimik/composer/actions/runs/37930877775) succeeded. Later delivery head
requires fresh check/job/artifact readback; review findings and exact-head results belong in the linked PR comment.
