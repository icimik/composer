# Document revision core: partial implementation

This is the historical independently reviewable preparation for [#42](https://github.com/icimik/composer/issues/42), not completed
transaction recovery. [PR #43](https://github.com/icimik/composer/pull/43) continues the approved ADR 0006.
The newer [production integration map](document-revision-integration.md) supersedes the unwired status below.
Historical adapter stage had no active Store, IPC or renderer behavior changes.
Completed journals remain retained unless the new standalone explicit cleanup is invoked on synthetic fixtures.
The [retirement namespace candidate](revision-cleanup-design.md) awaits independent review before production wiring.

## Current disk-adapter follow-up

Sender requested review fixes, rebase onto merged tooling main and scale/hardware-based allocation.
Base now `4cbdb07151d69de216e1a288713c382e5462896f` (#45/#47 merged); backups preserve 81ef59f/cfb03b4.
Second rebase was needed when #47 merged during validation; adapter/test/probe bytes unchanged, main fixture repair preserved.
Only workstate conflicts required resolution; tooling/Promise fixes and dated evidence remain intact.
Chosen policy: 256 MiB staged bytes / 256 MiB extra reserve under explicit delegation,
with [measurement and limits](../research/revision-resource-allocation.md).
Earlier resource gates below are historical/superseded, not another request to the sender.

`disk-io.cjs`: guarded bounded reads, exclusive flushed staging and directory sync (Windows limitation explicit).
`disk-layout.cjs`: derived targets, strict inventory/payload/markers and allocation bounds.
`disk.cjs`: prepare/commit/install/complete validation; pure preview/explicit replay and third-value refusal.
A second execute refuses retained active or retired operations. Standalone explicit cleanup is now a review candidate.
Store must serialize calls after full workspace readiness; there is still no production integration.
Trusted step callbacks are test injection only, never renderer IPC inputs or environment hooks.

Initial eight disk cases failed before implementation. Adapter execution tests include 63 real child exits
for save/restore/accept across eight payload callbacks, prepare/before-commit/commit, four scratch/four installation callbacks,
and before/after complete. Diagnostics preserve inventory; committed replay repeated twice produces exact after-images.
Missing intent remains unavailable; prepared-only recovery refuses. Third values, unknown files, symlinks, low-space refusal
and deterministic EACCES/ENOSPC/EIO are covered. Final check/smoke/E2E/CI counts belong to current-head PR evidence.
Follow-up adds 30 actual child exits during explicit replay itself and a red-first sync-failure regression: a validated
residual manuscript scratch must be flushed again before rename. A first draft counted unrelated file syncs; narrowing
the assertion exposed the failure before the fix. Repeated replay compares every resource's exact after-bytes.
Total actual execution/replay exits: 93. This is not GUI recovery, cleanup interruption or power-cut acceptance.
Large-history planning takes seconds/RSS overhead; assess responsiveness before production wiring.
Follow-up adds 138 actual prepared/complete cleanup exits across all three kinds, plus unknown/third/link/ambiguous inventory
and deterministic cleanup faults. Retired inspection is pure; all canonical target hashes remain unchanged.
Next: independently review cleanup storage detail, then Store/IPC/UI captured identity/baselines and true recovery E2E.
Do not close #42 or request merge of a completed product capability from this adapter-only increment.

## Historical pure-core context packet

- Base main: `c4e5405697ed27730ed9888816b3fe732f4470f1`; own existing draft branch, no stack.
- Approved design revision: `c9f8b275c4d6f2ecce07c0e5f7961d00448df885`.
  [Sender authorization and limits](https://github.com/icimik/composer/pull/43#issuecomment-6094433791).
- Verified dependency: merged #41, closed #40; #4 remains open. Safe fetch preserves this ongoing implementation.
- Known facts: five old interruption probes expose partial revisions; three image measurements show nontrivial growth.
  These characterize defects/resource use, not implemented recovery.
- Unknown decision: numeric maximum staged payload bytes and minimum extra free bytes, or incremental journal redesign.
  Tests inject their own synthetic policy; production has no default. No strategy/numeric choice is inferred from approval.
- Permissions: update existing issue/PR and own branch; no merge, auto-merge, force-push, release, delegation or closure.
- Next: obtain resource numbers, add red filesystem interruption/fault tests, implement a guarded serialized adapter.
  Review fresh checks and approvals before integrating Store/IPC/UI; do not mistake pure tests for product acceptance.

## Implemented pure contracts

- `format.cjs`: strict version/identity/resource descriptors, safe Chinese errors, bounded payload accounting and digests.
- `images.cjs`: body/title baselines, unrelated manifest-change rejection, canonical proposal/restore consistency.
- `records.cjs`: exact legacy audit prefix, one operation event and history snapshot, duplicate/partial record refusal.
- `journal.cjs`: detached images, immutable metadata, exact hashes, policy-based stage/metadata/scratch/headroom accounting.
- `identity.cjs`: bounded audit identity lookup, same-request replay result, conflicting ID refusal, stale-result reporting.
- `recovery.cjs`: pure prepared/committed/complete decisions; third values conflict, only before-values need installation.

The original pure functions operate on supplied buffers. The standalone adapter now bounds reads and guards paths;
remaining production integration must preserve these checks,
flush/exclusively stage files, recheck baselines, install/verify/clean up safely and implement explicit recovery consent.
The model cannot prove directory durability, handle incomplete staging on disk or provide concurrency guarantees.
Buffer contents are not frozen; post-construction tampering is detected when validating before use.

## Test mapping and remaining acceptance

| Scope                               | Executable evidence / remaining work                                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Save/restore/accept image coherence | `revision-core.test.cjs`; continuation/title-only/content-size cases in `revision-validation.test.cjs`                                    |
| Intent/hash/identity and baselines  | `revision-core.test.cjs`, `revision-identity.test.cjs`, `revision-validation.test.cjs`; unknown schema/fields/traversal IDs rejected      |
| Resource boundaries                 | Allocated 256 MiB staged / 256 MiB extra reserve; core edges, real statfs adapter and deterministic low-space admission tests             |
| Recovery decisions and repeat model | `revision-recovery-model.test.cjs`: before/after/third-value decisions, marker faults, repeated after-state; no disk operations           |
| Legacy audit/duplicate requests     | Identity and validation tests: exact old bytes, partial JSONL/duplicate IDs refused, clock-independent digest                             |
| Process exits and recovery faults   | 63 execution + 30 replay + 138 cleanup child exits; deterministic adapter faults. Old Store probe remains historical characterization     |
| Paths/symlinks/global registry      | Existing guards plus journal/payload and cleanup traversal/link/unknown inventory regressions; production cleanup readiness still missing |
| Real recovery UI and author input   | Existing smoke/full E2E only protect baseline behavior; preview/confirmation/dirty-input/recovery/reopen E2E remain missing               |
| Native and durability               | No branch Windows/macOS recovery, ACL/directory flush, actual power cut, manual IME/accessibility or real-provider verification           |

Initial 11 regressions failed against missing core, then passed. Two identity regressions failed against missing lookup,
then passed. These red observations preceded their implementations; later validation cases supplement coverage.
Read the exact current commit and full installation/check/smoke/E2E/CI results in the PR verification comment.
Do not reuse the prior design head's 93-test evidence as evidence for this changed tree.

## Integration and rollback boundary

Allocation is now in `resource-policy.cjs`. Audit growth exceeding the bounded scanner must refuse;
no automatic pruning or idempotence lookup bypass is permitted. Available-space validation in this model only uses
the supplied observation; the adapter must reserve/recheck and handle a real subsequent ENOSPC without claiming success.
Intent/marker JSON byte sizes and the largest after-image scratch allowance are included in required bytes.
Incomplete staging, ambiguous operations and cleanup failures require separately tested non-destructive handling.

Next integration must preserve sender validation, workspace queue, path/symlink isolation, title/body baseline checks,
author-only proposal adoption and input-preserving transition locks. #42 remains open until full acceptance and merged-main
readback. Backup/retention, other mutation families and migration remain #4 work. No absolute power-loss guarantee.
Current rollback removes unused modules/tests/docs/probes without touching user files. Once runtime journaling exists,
revert/downgrade must first complete or validate pending operations as required by ADR 0006.
