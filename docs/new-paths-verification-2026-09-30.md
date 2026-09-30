# Seven connected learning additions — 2026-09-30

## Delivered scope

| Path | Lessons | Projects | Mermaid diagrams |
| --- | ---: | ---: | ---: |
| Linux & Operating Systems | 22 | 3 | 4 |
| Data Engineering | 22 | 3 | 4 |
| UI Design & Accessibility | 21 | 3 | 4 |
| Observability & Performance | 21 | 3 | 4 |
| Messaging & Event-Driven Systems | 22 | 3 | 5 |
| Cloud & Infrastructure as Code | 22 | 3 | 5 |
| Full-Stack Project Journey | 20 | 3 | 5 |

150 new lessons, 21 projects and 31 diagrams bring the notebook to 23 paths
and 521 lessons/introductions. Existing 16 course payloads were compared against
the prior commit and remained byte-equivalent after JSON serialization.

Every new lesson has an exercise, a worked solution, a knowledge check and dated
primary references. Matching task kits are available beside lessons and stage
projects. Manifests integrate search, printable packs, scoped progress, the map,
downloads and PWA storage without adding topic-specific reader switches.

## Executed evidence

- `node verify.cjs`: 497 standard lessons, 70 task routes, 151 generic diagrams,
  25,627 links and existing Finance/source/backup/lazy/PWA regressions passed.
- `python scripts/build-bundles.py --check`: 23 complete bundles verified.
- `node scripts/build-pages.cjs`: 349 allowlisted public files built.
- `python scripts/verify-python.py`: complete old/new suite passed on local
  Python 3.14. New suites contain 52 test methods across OS, data, event, cloud
  and observability checks; the latter includes real loopback HTTP.
- UI contrast and static semantic guardrail checks passed. Browser walkthrough
  verified blank-form error/focus, valid input, native modal, Escape dismissal
  and return focus. Actual screen-reader output was not tested.
- All 31 new diagrams rendered as SVG at desktop and 390px phone width without
  page overflow. Step controls and a journey quiz were exercised.
- All seven courses saved through the offline manager. With the preview server
  stopped, all seven first lessons and all 31 diagrams remained accessible.
  Practice assets and ZIPs were included in the integrity-verified course caches.
- Full-stack verifier built React and .NET, ran decoder checks and four actual
  React component regressions, then tested real HTTP input/create/read/list/update
  behavior and concurrent stale edits. Local compatibility run used the installed
  .NET 9 SDK; the release workflow separately targets .NET 10.
- Local SQL Express verification created a unique temporary test database,
  applied the schema and ran the real SqlClient adapter. Competing version-1
  updates produced one 200 and one 409; version 2 survived API restart. The
  temporary database was removed. No existing database was modified.
- Browser React/.NET walkthrough verified creation, completion, conflict feedback
  from a second tab, and retained drafts when the API was stopped.

Review corrected two frontend races through an initial-read gate and disabled
draft inputs during mutations, with delayed-read/POST component regressions.
Integration corrected unique resource IDs, duplicate metadata, mixed punctuation
encoding, prose-answer formatting and a portable frontend script reference.

## Practical limits

The Linux kit runs portable trusted-child observations; Linux-only WSL/kernel
commands remain explicit optional exercises. Data/event kits execute SQLite
transactions, not SQL Server ETL, Kafka or RabbitMQ integrations. The cloud kit
executes an inventory/policy model; Terraform provider validation and Azure
provisioning were not executed. No cloud resources were provisioned.

Observability exercises measure a bounded local HTTP workload and lookup-only
benchmark; SDK/collector backends and production load remain separate. Measured
timings vary and no universal performance threshold is asserted.

The full-stack reference implements a synthetic loopback study planner with
memory/SQL storage, validation and optimistic updates. Verified authentication,
record ownership, idempotent creation, public deployment and backup restore are
assessed extensions with explicit acceptance criteria. GitHub Pages hosts the
learning notebook, not the dynamic application. Physical phone installation and
assistive-technology checks remain unexecuted.

Publication is gated on the Pages build, Python 3.11/3.14, existing React/.NET
checks and the new .NET 10 full-stack build/HTTP/component job. This record covers
local evidence; the completed workflow run provides release-platform evidence.
