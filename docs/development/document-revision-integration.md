# Document revision production integration

Status: implementation candidate in [#43](https://github.com/icimik/composer/pull/43), Refs
[#42](https://github.com/icimik/composer/issues/42) and [#4](https://github.com/icimik/composer/issues/4).
Entry head `94f5162728d33e16062c89d8ca9e9026b867e23e`; actual base main `4cbdb07151d69de216e1a288713c382e5462896f`.
Clean checkout and safe fetch verified; reuse the existing own branch, preserve requested-rebase backups.
The [sender approved production wiring](https://github.com/icimik/composer/pull/43#issuecomment-6095766007)
of the reviewed cleanup detail. Core ADR and 256 MiB staged/256 MiB reserve remain approved/delegated.
This is not independent implementation approval, merge permission or closure of #42/#4.

## Runtime and public contracts

- `pending.cjs` reads both namespaces without mkdir/cleanup. Any nonempty pending inventory returns unavailable
  `revision-recovery-required`; unknown, multiple, malformed and linked operations never become a normal empty manuscript.
  `reader.cjs` admits neither regular writes nor normal manuscript loading through pending evidence.
- `revision-methods.cjs` preserves registry-derived roots and full workspace admission. `mutation.cjs` independently checks
  workspace readability, captures raw target bytes, validates body/title baselines, builds one strict bounded plan, executes
  and verifies it, then retires/cleans its completed journal before acknowledgment. The original exception leaves diagnostics.
- Save/autosave and restore share this path. Author acceptance puts canonical body/title, history, audit and proposal accepted
  status in the same operation. Discard and prompt-only updates remain separate serialized manifest operations.
  Create/delete/registry/migration/backup transaction families remain outside #42.
- `worker-runner.cjs` sends only trusted registry root and validated command data to local `worker-entry.cjs`; no renderer
  intent, arbitrary target, policy override, environment fault hook, credentials or provider configuration.
  Parsing/planning/staging/replay/cleanup run off the Electron main thread while the main Store queue stays held.
  Worker exit/error produces a fixed safe failure, not a successful save acknowledgment.
- `revision-ipc.cjs` is registered through the unchanged sender/frame gate. Save receives reason plus strict
  `{ operationId, expectedTitle }`; restore and author acceptance carry the same identity. Main rejects omitted/extra/path
  identities rather than inventing them for renderer calls. Internal legacy Store callers retain a fresh-ID compatibility
  default; the public IPC cannot use that fallback. No manifest/database/schema migration is introduced.
- New `revisionPreview(workspaceId)` returns only operation ID/title/kind/phase/action.
  New `applyRevision(workspaceId, operationId)` re-reads and verifies the selected operation under the queue; no renderer plan.
  Preview/retry/startup are pure. Apply can finish a committed revision or explicitly clean verified preparation/retirement,
  never overwrite a third value. Repeated absent operation returns `absent` only after normal workspace readability checks,
  not a claim that arbitrary corruption was recovered.
- Audit identity/request digest survives journal cleanup. Duplicate request returns only its verified current result,
  creates no second history/audit record, rejects a changed request and refuses stale-result overwrite.
  AI retry also checks accepted status. History/export reads and AI context capture are serialized with the writer.

## Author input and UI

Chinese recovery controls appear in workspace diagnostics, including no-current/all-failed views.
Preview and apply share the existing transition lock and do not flush current inputs. Apply requires an explicit checkbox
and action; conflicts offer no destructive action. Successful processing refreshes diagnostics, not editor content or active
selection. A no-current view still requires the author to choose a healthy workspace.

Request trackers retain captured IDs through failed requests. A document result is committed into the renderer baseline
before a separate prompt write; prompt failure cannot cause a duplicate body revision on retry. Failed revision commands
refresh diagnostic availability without clearing input. Recovery leaves a current dirty editor suspended; explicit reopen
preserves its old title/hash baseline, so an externally completed revision still conflicts rather than being overwritten.
An unchanged editor hydrates the canonical after-state only when the author explicitly reopens it.

## Acceptance map

| Criterion                                          | Test/evidence                                                                                                                                  |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Red readiness/fault write gate                     | `revision-store-gate.test.cjs`: two namespaces failed as ready first, then fixed; A inventory unchanged, B saves                               |
| Save/restore/accept real Store interruptions       | `revision-runtime-process.test.cjs`: 36 actual child exits; restart unavailable/pure, explicit recovery, stable IDs and exact canonical state  |
| Adapter prepare/install/replay/cleanup boundaries  | Existing 63 execute + 30 replay + 138 cleanup exits; strict before/after/unknown decision and all remaining inventory checks                   |
| Duplicate/changed/stale request and title baseline | `revision-runtime-identity.test.cjs`; audit/header/history duplicates checked in every terminal runtime process case                           |
| Sender and capture contract                        | `revision-ipc.test.cjs` identity/queue admission; existing child-frame/context isolation E2E applies unchanged sender registration             |
| Real author UI interruption                        | `revision-recovery.spec.cjs`: save/restore/accept UI kills real Electron at manuscript installation, restart/preview/confirm/open/save/restart |
| Dirty current/unrelated healthy B                  | `revision-input.spec.cjs`: retain body/title/prompt and identity, no recovery flush/hydrate, old baseline rejects overwrite                    |
| Prepared/retired/conflict handling                 | `revision-input.spec.cjs`: explicit distinct cleanup, no fake recovered body, unknown third bytes untouched                                    |
| Unchanged current explicit reopen                  | Red-first E2E initially showed old canonical text; only unchanged explicit reopen now hydrates actual after-state                              |
| All workspaces pending                             | `revision-input.spec.cjs`: two diagnostics/no editor, explicit A processing/open, B inventory unchanged                                        |
| Prompt failure after document commit               | `revision-prompt.spec.cjs`: input/result retained and no duplicate history/audit on subsequent prompt save                                     |
| Main-thread planning observation                   | `revision-worker.test.cjs`: actual worker with 500 synthetic 5000-character snapshots; timer activity/latency diagnostic, not a hard SLA       |
| Limits/privacy/compatibility                       | Current locked scripts, 180/120, legacy journal-free cases, path/symlink/global index/hash/AI guards, synthetic data only                      |

Runtime fault child and Electron fault interception require a canonical temporary root plus fixture nonce before any write.
The trusted callbacks are test-side interception, not packaged hooks or an IPC/environment fault interface.
Three actual Electron exits cover the real UI path; the ordinary writer uses a real worker in baseline UI/Store tests.
These simulate process termination, not a physical power cut or storage-controller write cache.

## Remaining gates and rollback

Production code head `55adc9730b043d0ab23bd3990b81fa48d0e9cd22` passed clean install/check 440 units/0 fail/skip,
probe 36, smoke 1/full 50 Linux Electron E2E and both Linux-only CI runs/artifacts 0;
[commands/results/review gate](https://github.com/icimik/composer/pull/43#issuecomment-6095958804).
Read exact current-head installation/check/smoke/full E2E and CI on #43; follow-up heads need their own evidence.
Independent implementation review and maintainer merge remain required; #42 closure requires merged-main readback/acceptance.
Windows/macOS recovery/ACL/flush and packaged/asar worker execution, maximum-budget RAM, full 5M/35M UI loads, manual
IME/accessibility, actual power loss and real providers remain unverified. Directory sync on Windows is explicitly unsupported.
The moderate worker observation is not a bound for all machines or an unlimited-history/RAM promise.
Incomplete preparation without intent and unknown mismatching scratch retain evidence and require manual investigation,
not automatic repair. A corrupt global registry retains the existing global failure behavior, never a recovery bypass.
Runtime rollback must resolve both active and retired journals before downgrade; do not remove the pending gate blindly.
Other transactions, backups/retention, version migration and arbitrary corrupt-file recovery remain open #4 work.
