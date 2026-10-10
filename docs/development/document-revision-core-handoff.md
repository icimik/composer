# Document revision core: partial implementation

This is independently reviewable preparation for [#42](https://github.com/icimik/composer/issues/42), not completed
transaction recovery. [PR #43](https://github.com/icimik/composer/pull/43) continues the approved ADR 0006.
No active Store, IPC or renderer behavior changes, no journal is written and no recovery is executed.

## Context packet

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

These functions operate on already supplied buffers. An adapter must bound reads before allocation, guard every path,
flush/exclusively stage files, recheck baselines, install/verify/clean up safely and implement explicit recovery consent.
The model cannot prove directory durability, handle incomplete staging on disk or provide concurrency guarantees.
Buffer contents are not frozen; post-construction tampering is detected when validating before use.

## Test mapping and remaining acceptance

| Scope                               | Executable evidence / remaining work                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Save/restore/accept image coherence | `revision-core.test.cjs`; continuation/title-only/content-size cases in `revision-validation.test.cjs`                               |
| Intent/hash/identity and baselines  | `revision-core.test.cjs`, `revision-identity.test.cjs`, `revision-validation.test.cjs`; unknown schema/fields/traversal IDs rejected |
| Resource boundaries                 | Explicit policy, exact stage and free-space edges in core tests; no approved production budget or disk-free adapter yet              |
| Recovery decisions and repeat model | `revision-recovery-model.test.cjs`: before/after/third-value decisions, marker faults, repeated after-state; no disk operations      |
| Legacy audit/duplicate requests     | Identity and validation tests: exact old bytes, partial JSONL/duplicate IDs refused, clock-independent digest                        |
| Process exits and recovery faults   | Old `probe-revision-interruption.cjs` still characterizes the unfixed Store; new adapter interruption tests remain missing           |
| Paths/symlinks/global registry      | Existing default guards must remain passing; new journal component/scratch/cleanup path tests remain missing                         |
| Real recovery UI and author input   | Existing smoke/full E2E only protect baseline behavior; preview/confirmation/dirty-input/recovery/reopen E2E remain missing          |
| Native and durability               | No branch Windows/macOS recovery, ACL/directory flush, actual power cut, manual IME/accessibility or real-provider verification      |

Initial 11 regressions failed against missing core, then passed. Two identity regressions failed against missing lookup,
then passed. These red observations preceded their implementations; later validation cases supplement coverage.
Read the exact current commit and full installation/check/smoke/E2E/CI results in the PR verification comment.
Do not reuse the prior design head's 93-test evidence as evidence for this changed tree.

## Integration and rollback boundary

Resolve `maxStagedBytes` and `minFreeBytes` explicitly. Define behavior when audit growth exceeds the bounded scanner;
no automatic pruning or idempotence lookup bypass is permitted. Available-space validation in this model only uses
the supplied observation; the adapter must reserve/recheck and handle a real subsequent ENOSPC without claiming success.
Intent/marker JSON byte sizes and the largest after-image scratch allowance are included in required bytes.
Incomplete staging, ambiguous operations and cleanup failures require separately tested non-destructive handling.

Next integration must preserve sender validation, workspace queue, path/symlink isolation, title/body baseline checks,
author-only proposal adoption and input-preserving transition locks. #42 remains open until full acceptance and merged-main
readback. Backup/retention, other mutation families and migration remain #4 work. No absolute power-loss guarantee.
Current rollback removes unused modules/tests/docs/probes without touching user files. Once runtime journaling exists,
revert/downgrade must first complete or validate pending operations as required by ADR 0006.
