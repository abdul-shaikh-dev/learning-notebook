# Three messaging projects

Try each requirement before reading the reference. Mark outcomes as local executed, paper-designed, optional live executed, or not yet verified.

## Foundation: contract map

1. Classify GenerateExport, ExportRequested, ExportCompleted and GetExportStatus.
2. Draw an export work queue with two workers, independent audit/notification subscriptions and Accepted/Running/Completed/Failed UI states.
3. Trace acceptance-with-lost-confirm and commit-with-lost-ack; identify stable IDs.
4. Decide which messages require persistence and define a retention/usefulness window.

Reference: the command requests work; requested/completed report different facts; the query reads state. Workers compete for jobs. Subscribers independently process completion facts. A lost confirm leaves uncertainty, so retry the same event ID; a lost ack after commit replays into a durable inbox. Broker acceptance is never sufficient for a completed UI state.

## Intermediate: crash-safe local effect

Run the supplied 12 tests, then add a learner test that reopens the database between consumption and outbox mark. Confirm one projection effect. Explain how transaction rollback protects a crash between inbox insert and projection update. Compare two consumers receiving one event. Design finite retry, invalid-schema quarantine and controlled replay.

Reference: create_job writes job/outbox together; consume writes inbox/projection together. Publishing/marking remain separate and can duplicate. Consumers use separate names. A rejected collision reuses an ID with different content and must be investigated. Permanent malformed input quarantines immediately; transient retries have a finite deadline. The supplied retry policy does not persist a retry schedule or DLQ.

## Advanced: launch and recovery portfolio

Choose queue/log architecture through an ADR. Estimate the 120/s vs 100/s burst (60 seconds: 1,200 backlog), then 80/s steady arrivals (60-second idealized drain). Plan schema compatibility, per-aggregate ordering, subscriber authorization and sanitized correlation. Define queue-age stop triggers and dead-letter repair ownership. Design a restored-old-inbox experiment and a projection rebuild that cannot send real historic email.

Reference: local SQLite results cover local atomicity and repeated sequential delivery. Real broker failover, concurrent lease behavior, TLS/ACLs and production throughput require separate experiments. Restoring stores to different times can replay prior effects; reconcile outbox/inbox histories and external receipts before activating relay. Compensation is a fallible action, never a global rollback.

## Evidence ledger

| Claim | Experiment | Observed output | Boundary still untested |
|---|---|---|---|
| One local projection effect per consumer/event | Duplicate + reopen tests | Fill actual output | External API and parallel broker behavior |
| Atomic job/outbox | Inject failure between writes | Fill actual output | Real producer/broker delivery |
| Finite retry classification | retry_budget test | Fill actual output | Durable timed scheduler/DLQ |
| Denied broker access | Optional live negative test | Not executed initially | Actual broker identity enforcement |

Assess: is every guarantee scoped, every uncertainty visible, and every replay effect controlled? Completion is practice; it is not certification.
