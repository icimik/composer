# Revision journal resource allocation

Sender delegated allocation based on 5M-character works, seven-volume 35M-character collections and modern capacity.
[Decision and observations](https://github.com/icimik/composer/pull/43#issuecomment-6094957137).
Choose fixed **256 MiB staged payload / 256 MiB extra free-space reserve** under that delegation.
This is a refusal threshold, not unlimited history, whole-project capacity or a memory/durability promise.

## Exact synthetic serialization

`node tools/probe-revision-scale.cjs` counts compact JSON bytes and three-byte UTF-8 Chinese characters.
Assume 5000 characters per chapter: 1000 references for 5M, 7000 for 35M in one workspace.
Each revision mirrors only the selected chapter, its complete history, whole manifest and whole audit.
Other chapter bodies are not mirrored. Audit assumption: one event per chapter plus selected-chapter snapshot count.
These are explicit scenarios, not observed author behavior or a natural-language word-count conversion.

| Corpus characters | Prior selected-chapter snapshots | Raw corpus UTF-8 bytes | Staged image bytes | Fits 128 MiB | Fits 256 MiB |
| ----------------- | -------------------------------- | ---------------------- | ------------------ | ------------ | ------------ |
| 5,000,000         | 1000                             | 15,000,000             | 31,911,529         | Yes          | Yes          |
| 35,000,000        | 1000                             | 105,000,000            | 37,179,529         | Yes          | Yes          |
| 5,000,000         | 5000                             | 15,000,000             | 155,895,529        | No           | Yes          |
| 35,000,000        | 5000                             | 105,000,000            | 161,167,529        | No           | Yes          |
| 5,000,000         | 10000                            | 15,000,000             | 310,877,530        | No           | No           |
| 35,000,000        | 10000                            | 105,000,000            | 316,157,530        | No           | No           |

35M/5000 conservatively needs 505,408,603 free bytes including largest scratch, three 64 KiB metadata allowances and reserve.
Corpus size does not bound history/proposal-bearing manifests/global audit. Chapter lengths, astral characters, escaping,
formatting and revision counts change costs. Existing input limit is 2M characters per document; corpus is not one document.
No static cap guarantees unlimited full snapshots. Over-cap operations refuse without pruning or skipping replay protection.

## Hardware evidence and inference

Apple MacBook Air lists base 16 GB unified memory/512 GB SSD, plus larger configurations
([Apple specifications](https://www.apple.com/macbook-air/specs/)).
Surface Laptop lists 16/32/64 GB consumer RAM and 256/512 GB/1 TB SSD options, not a universal default
([Microsoft specifications](https://learn.microsoft.com/en-us/surface/tech-specs/surface-laptop-snapdragon-tech-specs)).
These are manufacturer examples, not market-share evidence or claims about the author's machine.

Inference: 256 MiB adds measured history margin over 128 MiB without permitting multi-gigabyte mirrors.
Worst-case reservation stays below 769 MiB, small relative to these drives; nominal capacity is not free space.
Actual available blocks are checked before staging/commit/scratch. Later ENOSPC still retains evidence.
No dynamic RAM/drive scaling changes parser compatibility between machines.

## Actual planner observation and limits

`node --max-old-space-size=2048 tools/probe-revision-memory.cjs` runs a real plan with 7000 chapter references,
5000 selected-chapter characters, 5000 snapshots and 12000 legacy events. Other corpus bodies are not allocated.
Linux/Node22 observation: staged=158,633,767 bytes; required free=502,709,976; planning=3264 ms; peak RSS=804,020 KiB
including fixture construction. Different titles/reasons/audit serialization explain its difference from the count scenario.
This proves the planner ran for that sample, not GUI performance, full-budget RAM safety or whole-project load performance.
Detached buffers/decoding/parsing/comparison exceed payload RAM. Naive main-thread integration can block for seconds;
evaluate responsiveness and avoid automatic retry loops before wiring. No fast-autosave claim.
Windows/macOS, 8 GB machines, full-budget peak RSS, real collections and recovery UI remain unverified.
