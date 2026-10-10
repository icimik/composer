# Interrupted journal cleanup: review candidate

Status: proposed storage detail of ADR 0006, implemented only in the unwired synthetic adapter.
Parent [#4](https://github.com/icimik/composer/issues/4), bounded [#42](https://github.com/icimik/composer/issues/42),
[draft #43](https://github.com/icimik/composer/pull/43). Base `4cbdb07151d69de216e1a288713c382e5462896f`.
Core approval and allocated resources remain valid; they are not approval of this new cleanup namespace.

## Problem and alternatives

Deleting before/after images directly from an active journal destroys the full-plan proof after the first unlink.
An interruption would then make the ordinary loader reject missing payloads, preventing the next explicit cleanup.
Keeping journals forever is safe preparation but prevents successive revisions and is not product completion.
Weakening the active loader to tolerate missing payloads could let an incomplete committed revision look healthy.
The candidate instead atomically retires a fully validated journal before removing any of its files.

## Candidate contract

- Active authority stays `.composer/transactions/<operation-id>/`, unchanged schema 1 and strict full-plan loader.
- Cleanup first validates the entire plan, markers, every target and a single unambiguous active operation.
  Prepared requires all before hashes; completed requires complete/commit markers and all after hashes.
  Committed-but-incomplete, incomplete preparation, third values, unknown files and malformed payloads refuse.
- Under the caller's serialization, revalidate immediately before renaming the whole directory to
  `.composer/transaction-cleanup/<operation-id>/`. Both parent directories are synchronized where supported.
  Retry must synchronize both parents again before deleting any file; a previous flush may have failed after visible rename.
  This namespace is a retirement record, not a new editable manuscript or recovery authority.
- Retired cleanup never installs, reads as ready or infers success for canonical data. It only removes verified remaining
  derived files. Validate intent/identity/schema, original staged budget, all present markers and all remaining files first.
  Payload deletion may already be partial. Recheck each file's hash, regular-file type, single link and identity at unlink.
- Delete payloads, then complete marker, then commit marker, then intent last. This keeps every interrupted marker set valid.
  The final empty retired directory may be removed; emptiness is not evidence that a revision committed.
  Repeated cleanup after removal returns `absent`, not `committed` or `recovered`.
- A new standalone execute refuses any nonempty retirement namespace. Production readiness must also reject it,
  expose explicit cleanup/retry and preserve dirty input. Those Store/IPC/UI changes are not implemented here.
- Unknown files, links, conflicting active/retired records, ambiguous operations and unverifiable ownership stay intact.
  Permission/space/I/O failures return fixed safe errors. No recursive removal, history pruning or automatic startup cleanup.
  A prepared journal missing intent stays unavailable; this change does not manufacture the missing proof.

## Related exclusive-write correction

CodeRabbit's [write failure finding](https://github.com/icimik/composer/pull/43#discussion_r4236893622)
was reproduced by injecting a partial write and a failed file sync. Close the exclusively created handle on exception,
remove its file only if guarded path, regular type, single link, device/inode/birth identity still agree, and retain the
original exception. Pre-existing files and external replacements are not removed. Failed cleanup retains evidence.
Abrupt process exit bypasses this exception path; an unknown mismatching scratch still refuses recovery, not blind deletion.
Matching residual scratch is fully verified and flushed again before reuse.

## Acceptance and rollback

| Criterion                                        | Evidence                                                                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Red-first cleanup and exclusive-write defects    | `revision-cleanup.test.cjs` success cases failed before module; two exclusive failure cases failed before fix          |
| Cleanup does not change canonical bytes          | Prepared/complete unit cases and each process case compare all four target hashes                                      |
| Every retirement/deletion/final-removal boundary | `revision-cleanup-process.test.cjs`: save/restore/accept, prepared/complete, 138 actual child exits                    |
| Pure diagnosis and blocked next write            | Every retired process case inventories before/after `retired.inspect` and refused execute                              |
| Unknown/third/multiple/path/link failures        | `revision-cleanup-faults.test.cjs`; fail-closed inventory comparisons and per-file rechecks                            |
| Deterministic unlink and directory-sync failures | EACCES/ENOSPC/EIO; red-first `revision-cleanup-sync.test.cjs` retirement-parent reflush and deletion-sync retry        |
| Exception cleanup and retained evidence          | `revision-exclusive.test.cjs`: partial write/sync, external replacement, existing file, denied unlink, staging failure |
| Real product recovery                            | Not yet implemented: Store/IPC/UI, dirty-input behavior, Linux recovery E2E and large-plan responsiveness              |

Only guarded single-process, local filesystem assumptions are covered; no external symlink-race, concurrent writer,
native ACL/flush or absolute power-loss guarantee. Windows directory-sync failure injection is inapplicable and explicitly
skipped there; Linux must pass it. No new resource numbers, database, manifest migration or backup-retention decision.
Rollback currently removes unused cleanup modules/tests/docs without user-file changes.
Once production creates either namespace, blind downgrade is unsafe and must first complete or verify cleanup.

Required next gate: an independent maintainer reviews this candidate's exact head and the new retirement namespace
before any production readiness, writer, IPC or UI integration. Writing this note or self-review does not satisfy that gate.
