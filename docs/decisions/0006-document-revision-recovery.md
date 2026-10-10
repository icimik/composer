# ADR 0006: One interrupted document revision

- Status: **proposed; not approved or implemented**.
- Parent [#4](https://github.com/icimik/composer/issues/4), bounded [#42](https://github.com/icimik/composer/issues/42).
- Base main: `c4e5405697ed27730ed9888816b3fe732f4470f1`, following merged [#41](https://github.com/icimik/composer/pull/41).
- Prior ADR 0005 approval covers isolation only. New journal, recovery, IPC and UI contracts require reviewed approval.

## Problem and evidence

The current `saveDocument` sequence installs history, manuscript and manifest, then appends audit. Author acceptance
calls that sequence and only afterwards marks the proposal accepted. Per-file atomic replacement is not a multi-file
operation. Five synthetic abrupt child exits show partial states still loading as ready after restart; see
[measured reproduction](../research/document-revision-reproduction.md), not an implemented recovery claim.

Outcome: one existing-document revision becomes a complete before-state or complete intended after-state on recovery,
with no duplicate history/audit event and no accepted-status/body disagreement. Other healthy workspaces remain usable.
Markdown remains the single canonical manuscript; a journal is temporary operation evidence, not a second editable draft.

## Scope and exclusions

One revision spans canonical Markdown, document display title in manifest, its history snapshot and one audit event.
Author acceptance adds that proposal's status to the same manifest after-image, not a later independent write.
Manual/autosave/restore/acceptance use the core; prompt-only session updates remain a separate serialized operation.
No create/delete/workspace-registry transaction, generic corrupt-file repair, backup/retention, schema/DB migration,
external watcher, sync, accounts, multiplayer, new AI or IF/VN. Discard without a revision remains a single manifest write.
No power-loss, arbitrary filesystem, network-volume or external-symlink-race guarantee.

## Alternatives and proposed choice

| Option                                                    | Assessment for this bounded outcome                                                                                                                                                                               |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Catch exceptions / reconcile from current files           | Small change but cannot handle process termination or distinguish a valid intended partial operation from an external edit; five observed cases prove missing operation identity. Not selected.                   |
| Move canonical state into SQLite and export Markdown      | SQLite documents its own commit/recovery protocol and filesystem assumptions, not a transaction with arbitrary exported Markdown. This introduces authority/export/migration decisions outside #42; not selected. |
| Scoped sidecar file journal, hashes and explicit recovery | Retains current canonical files and limits authority to one captured revision. Additional format/recovery complexity is real; proposed smallest complete option, pending approval.                                |

SQLite's documented rollback journal ordering is an example, **not this proposed protocol or proof it works**;
its guarantees rely on filesystem/device assumptions ([SQLite atomic commit](https://www.sqlite.org/atomiccommit.html)).
We propose after-image roll-forward after an explicit commit decision, not copying SQLite's rollback algorithm.

## Proposed format and state machine

Use `.composer/transactions/<operation-id>/`, versioned journal schema `1`, entirely beneath guarded workspace paths.
Intent binds workspace/document/session/proposal identity, operation kind, time, before/after SHA-256, fixed target kinds
and exact staged bytes. Target paths are derived from validated identities/current layout, never trusted journal strings.
Validate before/after manifests and their references. Reject unknown schema, duplicate operation IDs, traversal, symlinks,
missing payload, digest mismatch, malformed decision marker or ambiguous multiple pending operations; retain all evidence.
The renderer supplies one validated operation ID for a captured request and retains it until a terminal outcome; retries
reuse it. Save/restore/accept IPC must carry that ID and the captured before-title as well as the current manuscript hash.
Validate title/body baselines before capture, so title-only external changes also conflict rather than being overwritten.
The audit event records operation ID plus normalized request digest. Same ID/digest already committed means no new writes;
same ID with different request rejects. A later revision may make the old result stale, but never re-executes it.
Journal cleanup therefore does not erase operation identity; existing audit records without IDs remain legacy records.

1. **Validate/capture**: existing readiness, sender, expected manuscript hash and author acceptance/stale-proposal checks.
   Capture all resources under the existing Store serial queue; no canonical write until the complete plan is validated.
2. **Prepare**: stage complete before/after images with exclusive names and file flushes, immutable intent and payload hashes.
   Re-read all target before hashes before proceeding; a mismatch rejects without installing targets.
3. **Commit decision**: persist a validated decision marker after payload/intent flush, before the first canonical replacement.
   This records approved intent to finish, not a claim that target files already contain the result.
4. **Install**: for each fixed target, accept only exact before or exact after hashes, including explicit absent-file sentinel.
   Before -> atomically install staged after; after -> skip. Never overwrite an unknown third value or remove unknown bytes.
   The audit after-image contains the operation ID exactly once; no retry-time append. One history ID/time is captured once.
5. **Verify/complete**: all target hashes must match after-images before complete marker and successful acknowledgment.
   Flush targets and attempt supported directory synchronization; unsupported platform semantics are reported, not ignored
   as an absolute durability proof. Removing a validated completed journal is housekeeping, not backup retention.

An incomplete prepare has **no allowed canonical installation**. Explicit cleanup may remove only owned incomplete staging;
it must prove targets stayed before, or retain evidence and refuse. A committed intent requires roll-forward, not an
opportunistic rollback that could erase an acknowledged result. Missing required marker/payload is not inferred as success.
Cleanup interruption or repeated recovery uses the same hashes/operation IDs; missing targets are acceptable only when
the intent recorded absence before and the after payload is intact. Permission/space/unknown errors keep evidence.

## Recovery, IPC and UI contract requiring approval

Propose **explicit recovery**, not automatic startup repair. Load/diagnosis/retry stay pure as in ADR 0005: a pending journal
returns unavailable with fixed Chinese identity/reason/safe next step, while healthy entries remain usable.
Proposed diagnostic code `revision-recovery-required`; no raw paths, text, intent contents or exceptions in messages.
An explicit preview command validates journal and target hashes without writes and returns only operation identity,
document title, kind, phase and recoverable/conflict status. Proposed apply command takes workspace + operation ID after
the author confirms “完成已提交的修订”; main revalidates everything under serialization, never trusts a renderer plan.
Prepared-only staging offers explicit validated cleanup instead of “recovery complete”; conflicts offer no destructive action.

No-current/all-failed views can show this recovery action without an editable fake manuscript. A current dirty editor
remains preserved/read-only. Preview/recovery share the transition lock; recovery does not hydrate, save or clear input.
After completion the author explicitly reopens, retaining the original editor baseline/hash; recovery is not permission to
overwrite either disk or dirty input. AI acceptance remains unavailable until the workspace is ready.
IPC sender/frame checks and fault write admission apply to all other commands. Recovery is a narrow exception only for
validated operation targets, not a bypass around corrupt global registry, path guards or arbitrary damaged manifests.

## Compatibility, resource limits and unresolved decisions

Keep current manifest/Markdown/history/JSONL shapes; append operation identity to new audit records.
Older Composer ignores journals and is **not safe to use on a workspace with a pending transaction**. Downgrade requires
completion/verified cleanup first; no promise of cross-version or multi-process concurrent writing. Unknown journals fail closed.
The app-level single-instance lock does not protect a shared external directory opened by another profile/process.

Full history/manifest/audit images may be large. A staged-byte budget and disk-headroom checks must fail before canonical
changes, preserving author input, without silently pruning history. **No budget/default is approved**; measure synthetic
growth and obtain a separate numeric policy decision before production implementation. Journal copies are not backups;
credentials/provider configuration are never included. Committed payload survives failure, not routine retention pruning.
Recovery consent, sidecar/downgrade behavior and resource-budget policy are explicit maintainer decisions, not delegated defaults.
The staged-byte limit is also a prerequisite to a precise bounded journal parser/allocation limit; unknown or over-limit
input must be rejected before payload allocation or any recovery write. Audit identity scanning must validate/bound input,
not rely on substring matching or trust a partial final JSONL line.

## Acceptance mapping for the approved implementation

| Criterion                                      | Planned executable check, not current results                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Every prepare/commit/install/complete boundary | Child-process exits before/after each stage for save/restore/accept; restart: before-state before commit or diagnostic + exact after-state after explicit recovery |
| Idempotent history/audit/status                | Repeat recovery/cleanup and interrupt recovery itself; same operation/history IDs, one audit line, accepted body/status pair consistent                            |
| External conflict / unknown intent             | Third-value target, invalid/missing/unknown journal, path/root/component symlinks: no overwrite, inventory hashes unchanged                                        |
| Disk/permission errors                         | Deterministic fs fault injection for stage/decision/install/flush/cleanup; no premature success, evidence retained, healthy B usable                               |
| Journal budget                                 | Measured synthetic history/audit growth, approved budget boundary, insufficient-space failure before canonical writes; no history pruning                          |
| Input and author/UI path                       | Real Linux Electron save/accept -> killed process -> diagnostic preview/confirm/recovery -> reopen/save/restart; dirty input and hash-conflict path retained       |
| Compatibility / guards                         | Legacy journal-free fixtures, global corrupt registry, stale proposal/hash and sender tests, strict 180/120, full baseline check/smoke/E2E                         |

Native filesystem/directory-flush/ACL behavior remains explicitly tested only where observed; manual IME/accessibility,
actual power cut and real providers are not established by simulated process exit or mock AI.

## Approval, rollback and next gate

No production storage/IPC/UI change in the design PR. Maintainer must approve the exact ADR revision and unresolved resource
policy before implementation. Add failure regressions first after approval; reuse #42 and the approved design, no merge authority.
Design rollback removes documents/probes only. Future runtime revert must first complete/validate pending journals or refuse
downgrade; a blind revert is not safe recovery. Keep #4 open for broader transactions, backup/recovery policy and migration.
