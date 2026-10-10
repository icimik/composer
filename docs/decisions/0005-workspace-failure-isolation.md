# ADR 0005: Independent workspace load results and non-destructive diagnostics

Status: **accepted for bounded implementation; implementation still requires independent PR review**.
Primary issue: [#40](https://github.com/icimik/composer/issues/40). Parent: [#4](https://github.com/icimik/composer/issues/4).
Base: `efcd507670b4a7d68c78a6f1b314c667ac5134ba`. This is the first bounded #4 candidate, not completion of #4.
Approving maintainer: kenpusney, through the verified follow-up email approving ADR 0005 and continuation in PR #41.
Reviewed design revision: `70d4f8925a2fd8995e455fdf9cc6fa82adcdc9d1`.
Repository approval record: [PR #41 comment](https://github.com/icimik/composer/pull/41#issuecomment-6092557163).
Design approval is not a GitHub approving review of later implementation, nor authorization to merge.

## Problem and evidence

The existing aggregate load rejects when any registered workspace fails. The renderer then has no state or healthy selector.
The last-active workspace may also remain broken after a failed switch, because selection is persisted before target loading.
Some read guards create directories, and a manifest-only mutation can modify an unloadable workspace before its return fails.
These are code observations and synthetic measurements, not claims about real manuscripts or absolute crash safety.
See the [reproduction record](../research/workspace-isolation-reproduction.md) and
[base Store](https://github.com/icimik/composer/blob/efcd507670b4a7d68c78a6f1b314c667ac5134ba/electron/store/files.cjs).

No matching child issue, reviewed ADR or existing PR was found in the live issue/PR inventory and #4 timeline on 2026-10-09.
[PR #39](https://github.com/icimik/composer/pull/39) is merged; its toolchain approval does not approve this contract.
Existing reliability research explicitly identifies isolation and cross-file recovery as missing:
[architecture evidence](https://github.com/icimik/composer/blob/efcd507670b4a7d68c78a6f1b314c667ac5134ba/docs/research/05-架构与安全决策.md).
Pinned framework/skills are retained unchanged; no upstream script or update is needed.

## Outcome and exclusions

A healthy registered workspace remains usable beside any failed workspace. A failed item has identity and a safe diagnostic,
never fictional blank documents/sessions. Diagnosis/retry preserve failed directory inventory and bytes, including history.
Failed workspace writes and AI proposal acceptance are rejected before the first mutation.
Switch failure preserves current workspace, document, title, prompt and draft; no fallback redirects a save.

No database replacement, cross-file transaction journal, backup policy, automatic repair, schema migration, external watcher,
sync, account/collaboration or new AI/IF/VN feature. No claim of absolute power-loss protection or complete #4 delivery.

## Alternatives and recommendation

| Option                                                                      | Benefit                                                                               | Missing safety / cost                                                                                            | Verdict   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------- |
| Catch exceptions / filter failed promises                                   | Small aggregate change                                                                | Hides registered faults; cannot model all-failed, safe retry or selection; mutation and read side effects remain | Reject    |
| Explicit independent load results plus read/write and transition boundaries | Fault identity stays visible; readiness is typed; each acceptance path has a contract | Bounded IPC/type/UI changes and guards need review                                                               | Recommend |
| Journal/database/repair subsystem                                           | Could address broader #4 recovery                                                     | New format/product policy, migration and substantially larger scope                                              | Defer     |

The maintainer accepted the explicit-results option and its startup selection/guard contracts at the reviewed revision above.

## Accepted data and IPC contracts

Persisted v1 workspace/registry formats remain unchanged. No migration or new on-disk health flags/cache.
Keep registration identity/name from a validated registry, not a partially parsed failed manifest.
Each load result is discriminated, so fault data cannot be passed to editor/session APIs:

```ts
type WorkspaceResult =
  | { status: 'ready'; id: string; name: string; workspace: Workspace }
  | { status: 'unavailable'; id: string; name: string; diagnostic: WorkspaceDiagnostic };
type WorkspaceDiagnostic = {
  code:
    | 'invalid-json'
    | 'invalid-manifest'
    | 'missing-manifest'
    | 'missing-document'
    | 'read-denied'
    | 'unsafe-path'
    | 'read-failed'
    | 'unknown';
  message: string;
  nextStep: string;
};
type LoadState = {
  workspaces: WorkspaceResult[];
  requestedActiveWorkspaceId: string;
  activeWorkspaceId: string | null;
  theme: string;
};
type SwitchResult =
  | { status: 'selected'; workspace: Workspace }
  | Extract<WorkspaceResult, { status: 'unavailable' }>;
```

`AppState` becomes the load contract; `Workspace` remains the full, healthy value.
`load`, `createWorkspace`, `openWorkspace`, `switchWorkspace` and preview bridge/types need coordinated updates.
Create/open only select a fully validated target, even when an unrelated existing item fails.
`load` reuses the existing IPC for explicit retry; serialize its snapshot with Store mutations, without making it a write.
`switchWorkspace(id)` returns a selected value only after complete load and successful registry persistence.
A local target fault is a structured unavailable result. Untrusted ID/global registry/persistence errors remain rejected,
with safe fixed messages at the boundary; never serialize raw exceptions. Existing sender/frame checks stay intact.
Settings/generation/save/session/stage/history actions never accept a diagnostic object as a workspace.

## Diagnostics, privacy and global errors

Only controlled main-process stages assign codes: JSON parsing, schema/referential checks, guarded manifest/document read.
Map EACCES/EPERM to read-denied and other known I/O to read-failed. Unknown classification says “原因暂无法确定”.
Do not classify by substring matching of arbitrary exception messages. Security guard failures get an explicit safe code.
Examples: “作品 B（ID …）无法打开：工作区信息文件缺失。”;
“原文件未修复或替换。请保留原目录，检查文件或权限，外部修复后点击重试。”
Use registry display name plus ID to disambiguate duplicates; text-render only. No document text, JSON excerpts, keys,
provider bodies, stack traces or absolute paths in diagnostics/logs. Missing document messages need not reveal its content/title.
Do not claim the product restored/recovered anything; successful retry means loaded, not repaired.

Malformed/untrustworthy `registry.json` is a global failure, not N local failures.
Retain the startup error-dialog/quit behavior for corrupt registry; sanitize it and never reset an existing corrupt index.
Validate registry entries/IDs/names/absolute paths, theme and active ID before mapping workspaces; reject duplicate identities
or malformed entries globally rather than silently dropping them. Existing absent-index first-run behavior is not recovery.
Registry access/path/symlink failures also fail closed. Semantic validation is required for these IPC results but no schema migration.
Workspace validation must check manifest ID matches registration, document/session IDs are unique, active session exists,
and each session/document/proposal reference belongs to that workspace. Invalid active references are faults, not hydration crashes.
Do not silently select a different session/document or create empty content to conceal invalid references.

## Pure read boundaries and writes

Split guarded path resolution from explicit write-directory preparation. Reads never call mkdir/atomic/appendFile/writeMeta.
Apply this to manifest, all referenced documents and history reads; missing history alone can still be an empty list.
Load validates the canonical manuscript and manifest, not every optional history/log/credential file; errors reading those
remain operation-specific. This is not an integrity scan or assurance against corrupt optional history.
Resolve an existing root and each existing internal path component without creation; reject internal symlinks, containment
escape and invalid IDs. Explicit creation validates the nearest existing ancestors before making directories, then rechecks.
Preserve/reinforce fail-closed guards; accepting a fault for display never makes the path eligible for writes.
`openWorkspace` must use the same guarded candidate-root reader before registering anything; its current raw manifest read
must not bypass guards. A failed new open leaves the registry and current state unchanged.

At each public workspace mutation, perform complete guarded readiness validation before first write, inside the existing
serial queue. A successful explicit retry revalidates; no permanent “unavailable” cache and no renderer-only guard.
Cover save/createDocument/updateWorkspace/createSession/switchSession/updateSession/addProposal/resolveProposal/restore.
AI configuration must also require readiness before credential writes; generation must load before any outbound request,
then revalidate again in serialized addProposal after the response. Cancel remains allowed.
Internal creation is a separate explicit writer; low-level path/meta writers must not recursively invoke the readiness gate.
UI disables editor/autosave/proposal controls without a ready workspace; direct IPC attempts must still reject.
Hash conflict and stale AI checks remain mandatory after readiness validation; they are not replaced by it.

Limits: preflight cannot make external edits between check and write atomic. Preserve current conflict checks, and do not
promise watcher/race/crash repair. Registry atomic persistence still lacks directory fsync/power-loss guarantees.
An all-document preflight adds I/O; measure a synthetic multi-document fixture before implementation handoff, not add caching
or a speculative performance promise. If unacceptable, ask for a separate reviewed optimization.

## Active selection and UI transitions

Startup: if the persisted active ID is ready, hydrate it. Otherwise return active=null with the requested ID unchanged;
show diagnostics and healthy “打开” choices. Do not automatically choose/persist A just because B failed.
All-failed: render the same safe diagnostic surface with explicit retry, no editor/AI panel/blank draft replacement.
Ready UI: retain healthy navigation and show a persistent fault list with name/ID, reason and retry.
Fault selection is diagnostic-only, never an active editor identity. Known faults do not trigger a fake selection.
No silent unregister, auto-create or automatic repair. Explicit normal create/open actions remain separate user commands.

Switch to a previously ready target can fail after external damage:

1. Acquire one transition lock and capture current workspace/document/title/draft/prompt; clear pending debounce.
2. Disable selection and draft/title/prompt editing for the bounded transition; reject concurrent switch/open/create/session
   transitions and AI actions. No late typing may be overwritten by hydration.
3. Await serialized flush to the captured current IDs. A failed flush aborts before touching target/active selection.
4. Fully read/validate target under Store serial queue. If unavailable, merge that diagnostic only; keep the editor snapshot
   and controlled select on current ID. Registry active ID and current identity remain unchanged.
5. On success, persist a copied registry with target active ID; update in-memory registry only after atomic succeeds.
   Commit renderer selection and hydrate exactly once after matching successful result. Never persist target before validation.
6. Release lock on every path; show safe errors without clearing input. Preserve edits made during already-in-flight saves.

Flushing A on a failed switch is acceptable: text may become saved to A, but exact input stays visible and never goes to B.
Also verify a fault appearing while A has a save conflict does not lose either input or external text.
All transitions share the lock rather than merely discarding stale promises after they already persist selection.
On target success followed by unexpected renderer hydration failure, fail safely without redirecting drafts; validated
referential invariants and identity-scoped saves prevent this case from being hidden as an empty workspace.

Retry: pure `load()` refreshes independent diagnostics, without flush or hydrate of an existing current editor.
Keep current A identity and dirty input even if refreshed A is now unavailable; suspend its writes and show the preserved draft
as unavailable/read-only, not replace it with disk content. External repair re-enables through explicit validated reopening;
dirty draft remains preserved and must pass existing hash conflict protection before save.
With no current editor, retry can show repaired A as a ready choice but does not auto-select it.
This separates diagnostic refresh, draft preservation and selection; a successful retry is not permission to overwrite disk.

## Acceptance mapping after approval

Names below define the approved acceptance mapping. Nine red regressions were added before runtime changes.
Concrete implemented tests and measured outcomes are recorded in [implementation verification](../research/workspace-isolation-verification.md).

| Criterion              | Required unit/contract tests                                                                                                         | Required real UI / manual evidence                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A healthy, B broken    | `mixed-results-save-restart` validates independent results and A UTF-8 save/restart                                                  | Linux `mixed-startup-save-restart`: diagnostic, choose A, edit/save, close/relaunch                                                                                       |
| B last active          | `broken-active-keeps-requested-id` with active=null and registry hash unchanged                                                      | Linux `broken-last-active`: usable chooser, no fake blank B, select A                                                                                                     |
| Local faults           | `fault-matrix`: invalid/truncated JSON, schema/references, missing manifest/doc, EACCES/EPERM/EIO injection                          | Linux missing-file and malformed-manifest UI paths; native permissions explicitly manual                                                                                  |
| Preservation/guards    | `read-retry-inventory`: file hashes + directory/symlink inventory unchanged; registry entries retained; `all-mutations-refuse-fault` | Linux direct bridge attempts save/session/stage/proposal; assert faulty files/log/history/credentials unchanged                                                           |
| Security               | Existing ID/document/meta symlink regressions plus parent-component escape, candidate-open symlink, ID mismatch                      | Existing child-frame IPC and isolation E2E; Windows symlink privilege gap explicit                                                                                        |
| Failed switching       | `switch-validates-before-commit`, registry persistence failure keeps memory/disk identity; no pending result mutation                | Linux `failed-switch-preserves-input`: body/title/prompt/current document/select unchanged, A only save; delayed transition and rapid double switch; flush-conflict abort |
| All failed/retry       | `all-unavailable`, repaired load is ready, no creation/unregister/blank writes                                                       | Linux `all-failed-explicit-retry`: external fixture repair, click retry, choose A, save/restart                                                                           |
| Retry while dirty      | Refresh merges results only; editor live IDs unchanged, writes suspended for new fault                                               | Linux repair/fault toggles during dirty A; input retained; stale hash rejects external changes                                                                            |
| Global registry        | Existing corrupt-registry test + malformed entries, duplicate IDs, read-denied, symlink                                              | Existing safe startup dialog retained; synthetic dialog observation, never reset                                                                                          |
| Baseline/compatibility | Full `npm ci`, `npm run check`, size guards, preview contract/typechecks                                                             | `test:smoke` + full Linux E2E; no production keys; native CI only after maintainer merge                                                                                  |

Cross-platform permission behavior cannot be inferred from chmod under privileged test users. Inject deterministic fs errors
only in test processes; do not add a production fault environment variable. Native OS denial messages/manual accessibility
and IME acceptance remain unverified here. Synthetic tests do not establish complete transaction/backup/migration safety.

## Rollback and review gate

The maintainer specifically requested implementation in existing PR #41, superseding the earlier separate-PR delivery plan.
PR #41 links the exact approved ADR revision and #40, uses `Refs #4`, and keeps #40 open until merged acceptance.
Revert implementation without disk migration; original behavior
would again block mixed-workspace startup, so rollback is not repair.
Respect current lockfile, strict source sizes, MIT/CC0 notices and Linux-only ordinary CI with no installers/uploads.
No auto-merge, direct merge, protection change, force-push, release, loop or delegation is authorized.

Accepted design decision: typed results, explicit no-auto-fallback selection, pure reads, pre-write readiness and
input-preserving transition/retry contracts. Independent implementation review/merge remain outstanding.
No new storage-format, recovery-strategy, database or backup product decision is implied or requested.
