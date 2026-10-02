# System Design workbook

Visual companions in the notebook: [Transaction boundary](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#topic/system-design/transactions) · [Durable outbox delivery](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#topic/system-design/outbox). The original text traces below remain available for offline use.


Use synthetic data and paper diagrams. No infrastructure provisioning is required. These are reference arguments, not a deployed service or a reliability certification.

## 1. Write the problem before drawing boxes

Design signed-in progress sync for a learning notebook. The illustrative workload is 10,000 daily active learners, 40 API requests each per day, an assumed 8× peak-to-average factor and 2,000 response bytes per request. Twenty-seat workshops and asynchronous exports arrive in the intermediate project.

Fill in: actor; action; invariant; excluded behavior; latency objective; availability objective; eligible events; measurement window; owner. Mark each number as a requirement, assumption or measurement.

Reference invariants: only the owner edits progress; one progress record per user/lesson; confirmed workshop bookings never exceed capacity. A concrete exclusion is concurrent offline collaboration. That exclusion requires a clear stale-edit conflict message rather than silently promising conflict-free merging.

## 2. Calculate, then challenge the assumptions

| Quantity | Reference arithmetic | Limitation |
|---|---|---|
| API requests/day |10,000 ×40 =400,000 | Active users, not registered users |
| Average requests/s |400,000 /86,400 ≈4.63 | Daily mean hides bursts |
| Assumed peak requests/s |4.63 ×8 ≈37.04 | Peak factor must be measured later |
| Peak response payload bytes/s |37.04 ×2,000 ≈74,074 | Excludes network overhead and other traffic |
| Raw event storage |200,000/day ×500 bytes ×30 days =3.0GB | Decimal GB; uncompressed assumption |
| Modeled storage |3.0GB ×1.5 overhead ×3 copies =13.5GB | Excludes backups, logs and spare space |

Run the calculator. Double users, then double both users and requests per user. Explain why a uniform scaling model can miss a synchronized class starting at 09:00. Write one experiment to measure actual bursts.

At a stable 200 requests/s and a mean 0.25-second residence time, Little's Law gives 50 average in-flight requests. Do not mix this scenario with 37.04 peak requests/s or substitute p99 for the mean. This is not a thread-count recommendation.

## 3. Explain every arrow

```text
Learner browser
    | HTTPS, identity, bounded body
    v
Reverse proxy / load balancer
    | authenticated request
    v
Modular API ------------------> public versioned lesson cache
    | owner check, version check       | cache miss
    v                                  v
Relational authority <---------- content source
    | transaction: booking + outbox record
    v
Outbox relay --> queue --> bounded export/notification workers
                    |              |
                    |              v
                    |        private output storage
                    v
             retry exhaustion review
```

Add trust boundaries and label which data is authoritative. For every arrow, state timeout, authorization, expected failure and retry owner. A drawn queue does not prove reliable enqueue; an outbox relay must publish committed records and handle duplicates.

## 4. Concurrency and response-loss exercise

Workshop W has one seat. Learners A and B send booking requests concurrently. A's response is lost after commit. A retries with the same operation key. Write a timeline and expected final state before reading the reference.

Reference: the authoritative conditional capacity change plus booking insert are in one transaction. Exactly one distinct intent can reserve the final seat. The other receives the documented rejection. The winning caller's retry obtains the existing booking through durable, caller-scoped idempotency coordination. A failed booking insert rolls back the capacity change. A key reused for different input conflicts. Test with concurrent database connections when implementing; a sequential unit test cannot demonstrate race safety.

## 5. Failure matrix

| Failure | User behavior to define | Evidence to collect |
|---|---|---|
| Cache disappears | Read degradation or bounded rejection | Origin load, tail latency, errors |
| Replica lags | Read own update through defined version policy | Version observations before/after failover |
| Response lost after commit | Same intent can safely retry | One booking, replayed result |
| Worker crashes before acknowledgment | Stable job is replayed safely | One logical result, retry history |
| Notification provider times out | Unknown external outcome is reconciled | Provider operation ID and duplicate policy |
| Network partition | Public stale reads may work; unsupported booking writes reject | Invariant and per-operation availability |
| Unauthorized guessed download | Deny private output | Negative resource-authorization tests |
| Bad schema rollout | Compatible old/new readers and rollback plan | Mixed-version test and backfill checkpoints |

Choose one row and describe a test that could falsify your design. State what evidence would cause a change. Do not claim an external effect is exactly-once merely because a queue has a delivery guarantee.

## 6. Overload and recovery

A 60-second burst arrives at 120 jobs/s with 100 jobs/s service capacity. It adds 1,200 jobs. When arrivals drop to 80 jobs per second, the spare capacity of 20 jobs per second drains that backlog in 60 seconds. Constant rates and uniform processing are simplified assumptions. At 100/s arrivals the backlog never drains in this model; an unbounded queue postpones failure rather than solving capacity.

Specify a maximum queued workload, per-tenant fairness, admission behavior and oldest-job-age alert. Compare a rate cap with a concurrent-work cap. Count retries at all layers: three total attempts at two nested layers can create nine deepest attempts.

In the recovery drill, the last recoverable point is 10:00, failure occurs at 10:12, and the restored service is validated at 10:47. The potential data-loss interval is 12 minutes and the observed recovery time is 35 minutes. Against targets RPO 15 minutes and RTO 30 minutes, the first interval fits and the second misses by 5 minutes. Backups must be restored and checked, not merely listed. Run drills in isolated environments with synthetic or appropriately controlled data.

## 7. Review packet and self-assessment

Deliver one requirements sheet, a calculation table, API/data contracts, annotated architecture, two failure timelines, a threat model, an ADR and a recovery/migration plan. For each important claim write: mechanism; test; result if tested; remaining unknown. Unexecuted tests stay labeled planned.

Foundation exit: another developer can explain your request path and recompute the estimates.

Intermediate exit: you can defend booking safety and state what happens after duplicate delivery, stale reads and partition.

Advanced-practice exit: you can show how overload is bounded, which external effects remain uncertain, how recovery is validated and which evidence would change your architecture. This is a self-check, not an automated pass or professional certification.
