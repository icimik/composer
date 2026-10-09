# Review checklist

Freeze the PR head SHA before recording a verdict. Record whether this is self-review or independent review.

- Does the diff satisfy the issue/design without unrelated changes?
- Are normal, error, conflict, cancelled and restart paths covered?
- Can any change lose or duplicate canonical manuscript data?
- Are AI transmission, proposal acceptance, secure storage and stale-hash guards preserved?
- Are renderer/IPC/path boundaries intact and untrusted data never executed?
- Do tests use temporary data and mock services only?
- Are checks reported for the exact head, with native/manual gaps explicit?
- Do ordinary push/PR jobs use Linux only and avoid native runners, artifact upload and installer packaging?
- Do main-only native jobs depend on Linux success, and installer jobs on native success?
- Are dependencies/action references pinned or intentionally locked, and audits separated from runtime evidence?
- Are research, ADRs, changelog, skills/workstate and local references current?
- Are license/third-party rights and new public behavior explicitly approved?
- Are findings resolved and migration/rollback understandable?

For each finding record severity, file/line, criterion, evidence, impact and action. Verdict: pass / conditional / revision required / insufficient evidence. Approval and merge are separate maintainer actions.
