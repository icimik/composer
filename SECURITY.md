# Security policy

## Scope and support

Icimik Composer 0.1 is a development version, not a formally supported stable release. Security fixes are assessed against the current reviewed development branch; no response-time SLA is promised.

High-risk areas include manuscript loss, workspace path escapes, untrusted IPC, renderer access to Node, model-key disclosure, unsafe external URLs, and executing imported scripts. Never use real author data or keys to demonstrate a bug.

## Private reporting

Use GitHub's private vulnerability reporting under the repository's Security tab when it is enabled. Include the affected commit/version, platform, minimal fixture-only reproduction, impact and any proposed fix. Do not open a public issue or attach secrets, real manuscripts or exploit instructions there.

If private reporting is unavailable, ask maintainers to provide a confidential reporting route without including vulnerability details. A durable external security contact and escalation owner still require maintainer confirmation.

Maintainers should acknowledge receipt, assess the reproduction and impact, agree on a disclosure plan, fix and verify, then publish an advisory only with explicit approval. Reporting is not permission to access someone else's data or run destructive tests.

## Credential and data boundaries

Model keys stay in OS-encrypted storage, not in workspaces or renderer payloads. Mock HTTP is confined to explicit test mode. CI uses temporary projects and cannot authenticate to a real model service. Dependency advisories and application threat-model findings must be tracked separately; a clean production-dependency audit does not prove the whole application safe.
