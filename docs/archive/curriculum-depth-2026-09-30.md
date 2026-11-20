# Curriculum depth improvements — 30 September 2026

Implemented the findings from the 16-course review against baseline `a17149e`. Existing lesson IDs, completion records, historical verification snapshots and offline entry routes remain intact.

## Changes and how to find them

| Path | Addition or correction | Entry point |
|---|---|---|
| Financial Foundations | Worked receive-floating/pay-fixed swap with forecast/discount bridge, attribution order and known fixing variant | Swaps/options foundation explainer → worked extension; finance resource task `swap-repricing` |
| Python | Actual helpers/main import example and local I/O failure bridge | Modules/environments and API-boundary lessons; complete practice kit |
| .NET | Real duplicate audit-write failure after saved task, fresh-context rollback checks; clearer persistence progression and relational prerequisite | EF evolution lesson and persistence checks |
| React | Graduated JavaScript practice, separate 10,000-row fixture, validated storage migration and HTTP-loader bridges | Related lessons and practice README; existing tracker retains 1,000-row limit |
| SQL Server | Guarded permanent schema, FK, nullable expand/backfill and least-privilege user experiment | Optional schema/permissions lab and cleanup files |
| Data Structures & Algorithms | Worked invariants/DP reasoning and small-case shortest-path/knapsack oracles | Advanced task files |
| Design Patterns | Tangled starter, refactored endpoint and tests configurable for learner code; stale catalog metadata corrected | Refactoring lesson and advanced kit |
| System Design | SQLite last-seat race, atomic booking/outbox, replay and consumer deduplication exercise | Advanced booking lab |
| AI Agents | Bounded provider evaluation with offline dry run and fake-transport tests | Provider evaluation guide; live requests require explicit CLI opt-in |
| Agent Harnesses | Persisted checkpoint plus SQLite effect/receipt recovery, including effect commit before checkpoint save | Persisted-run lab |
| Networking & Web | Browser CORS controls for success, missing origin and wrong origin; optional TLS/proxy investigation | Browser-boundary guide and browser_drill.py |
| Testing & Debugging | Pdb walkthrough, cancellation cleanup, statement-versus-branch contrast and bounded timing experiment | `guided-diagnosis` task linked from relevant lessons |
| Git & Team Workflows | Reviewer feedback, revised candidate and local checks | Advanced review role-play |
| Application Security | HTTP mutations with object/session/CSRF denial and persisted-state assertions; optional identity rubric clarified | Advanced security kit and HTTP test |
| Delivery & Operations | Different v1/v2 source artifacts, readiness gate, compatible rollback and measured eligible reads; bounded startup negative test | Distinct-artifact drill |
| Kubernetes | Optional enforcing-CNI, metrics and storage track, restricted policy clients and unique-token PVC check | Optional enforcement guide |

Every new teaching file is registered in the corresponding public manifest and resource kit. Complete ZIP bundles, generated catalog and search entries are rebuilt together. New Python and React exercises are included in the shared CI verification routes.

## Verification performed

- Shared Python verification passed locally on Python 3.14, including the new diagnosis, finance, I/O, oracle, refactoring, booking, provider-adapter, persisted-run and security HTTP checks. Latest booking regression and delivery startup-timeout tests were also run separately after review corrections.
- .NET SDK 10.0.401 was installed in an isolated task directory, without replacing machine-wide SDKs. `scripts/verify-dotnet.py` passed: 4 foundation assertions, 15 SQLite/test-host assertions, and 11 HTTP acceptance assertions. The logged duplicate-key audit exception is an expected negative case.
- Shared React verification passed TypeScript checking, domain assertions, graduated JavaScript, the 10,000-row fixture, 7 Vitest tests and the production Vite build. Test coverage includes malformed/mismatched response, abort forwarding/rejection, invalid saved state and failed storage writes.
- SQL schema/permissions script executed twice against the installed SQL Server 2025 Express 17.0.1000.7 in a uniquely named disposable database. Both runs demonstrated one seeded order, FK rejection 547, completed backfill and limited-user INSERT denial 229. Guarded cleanup and database removal succeeded.
- The actual pdb command sequence showed `[4]` for the incorrect slice and returned 4 instead of the independently expected 12.
- Optional coverage 7.16.2 was verified in an isolated environment: one-sided test executed every statement but missed one branch (86% combined coverage); both directions reached 100% for the tiny subject. This is not a claim about overall repository coverage or correctness.
- Actual in-app browser CORS checks: allowed request readable with HTTP 200; missing-origin and wrong-origin requests blocked from script access with TypeError.
- Notebook verification passed 347 generic lessons plus the finance course, 49 resource task routes, 641 search entries and 19,084 rendered/search/static links. Bundle regression tests passed; static build produced 236 public files. These counts describe this revision's structure, not mastery.

## Boundaries retained

No paid provider request, real identity-provider setup, live Kubernetes enforcement, TLS trust/proxy deployment, or production load experiment was performed. Those are explicit opt-in extensions with prerequisites, expected observations and evidence limits.

SQLite booking/recovery tests demonstrate bounded single-host behavior. The outbox example explicitly permits duplicate delivery; the consumer must deduplicate. Harness receipt atomicity applies to the local SQLite note/receipt transaction, not an arbitrary external effect. React bridge tests use injected browser-storage/HTTP seams; learners still need to wire and verify their own full UI and server integration.

The notebook remains a personal learning reference with guided practice and extensions. These additions improve depth and feedback without claiming professional or production mastery.
