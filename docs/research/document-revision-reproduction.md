# Document revision interruption: baseline reproduction

Date: 2026-10-10 UTC. Parent [#4](https://github.com/icimik/composer/issues/4), bounded design
[#42](https://github.com/icimik/composer/issues/42), [proposed ADR 0006](../decisions/0006-document-revision-recovery.md).
Production baseline: merged main `c4e5405697ed27730ed9888816b3fe732f4470f1`.
These probes measure defects in the existing writer; passing a probe means the expected **old defect was observed**,
not that transaction recovery is implemented or accepted.

## Reproducible experiment

```sh
npx --yes --package=node@22 -c 'node tools/probe-revision-interruption.cjs'
```

The parent creates five isolated temporary roots, one per case, using synthetic text/title and a seeded mock proposal.
Each has before content/title, one baseline history snapshot/audit event and pending proposal. A separate child loads the
Store and exits abruptly with code 77 after a selected write boundary, bypassing JS exception/finally handling.
The parent starts a fresh Store, records current state and removes its owned temporary root. No production fault flag,
upstream script, real manuscript, secret or model service. Output includes only labels/counts/status, not text/path.

Measured 2026-10-10 03:16 UTC, isolated Node22.23.3/Linux:

| Child interruption | Manuscript | Title | History count | Audit count | Proposal | Restart load |
| --- | --- | --- | --- | --- | --- | --- |
| After history replacement | before | before | 2 | 1 | pending | ready |
| After manuscript replacement | after | before | 2 | 1 | pending | ready |
| After manifest replacement | after | after | 2 | 1 | pending | ready |
| After audit append | after | after | 2 | 2 | pending | ready |
| During acceptance, before final proposal status | after | before | 2 | 2 | pending | ready |

Each child reached the requested boundary (exit 77); five assertions passed. Acceptance keeps the existing title,
so “before title” is expected in its intended after-state; the defect is the new manuscript with proposal still pending.
The audit-appended save is a complete disk revision but not an acknowledged response; it demonstrates an unknown outcome
without operation identity, not inconsistent bytes by itself. Other cases show cross-file partial state admitted as ready.

## What this proves and does not prove

Observed: active Store startup/read cannot distinguish these interruptions; it has no integrated journal/recovery.
History precedes manuscript, manifest and audit; acceptance status comes later. ADR 0005 intentionally did not fix that.
Inference: exception catching alone cannot run after abrupt process exit; a committed operation identity/hash plan is needed
to distinguish replay from an external change. ADR 0006 core sidecar/explicit-recovery contract is approved.
Resource allocation and production integration remain separate work; this characterization is not recovery acceptance.

The probe does not kill a GUI or prove Electron input recovery, tear sectors, reorder storage writes, emulate a real power
cut, test Windows/macOS interruption or establish filesystem durability. Existing full UI acceptance is separate.
After approved implementation, replace/archive this legacy-characterization probe with future success regressions rather
than leaving an old-defect assertion in the default test suite. New runtime gates require reviewed ADR approval first.

## Synthetic full-image resource estimates

Measured separately at 2026-10-10 03:30 UTC on the same unchanged production baseline:

```sh
npx --yes --package=node@22 -c 'node tools/probe-revision-budget.cjs'
```

The helper creates three temporary workspaces, writes fixed-length ASCII synthetic revisions through the current Store,
measures manuscript/manifest/history/audit before and after one more save, and deletes each owned root.
No journal is installed; “staged bytes” is the sum of exact existing before/after resource byte sizes for the proposed
full-image design, **excluding** journal metadata/markers, atomic-install scratch, allocation overhead and disk headroom.

| Prior revisions | Characters per ASCII revision | Proposed image bytes | Approx. MiB |
| --- | --- | --- | --- |
| 16 | 32,768 | 1,098,817 | 1.05 |
| 64 | 262,144 | 33,881,569 | 32.31 |
| 32 | 1,048,576 | 68,190,753 | 65.03 |

This shows whole-history duplication can dominate the journal even with one manuscript. A nominal 64 MiB image cap would
already reject the third fixture before scratch/headroom; it is **not chosen as a default**. ASCII size is not a Unicode
character/token equivalence for real novels. These samples do not define production workload limits or performance.
Maintainer must choose whether to accept explicitly bounded full-image staging/refusal or require an incremental
history/audit journal redesign before implementation; neither silent pruning nor an unbounded disk promise is approved.
