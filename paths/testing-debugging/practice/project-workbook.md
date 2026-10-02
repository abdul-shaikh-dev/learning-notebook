# Testing & Debugging stage projects

Attempt each project before reading its reference. Record expected/observed results and a limitation for each important claim.


## Validated study-log parser

Build a pure parser and independently demonstrate allowed values, type boundaries and malformed records.


Requirements:
- Require exact id/minutes fields, nonblank bounded IDs and integer duration 0 through 1440.
- Reject duplicate JSON keys, booleans, invalid JSON and oversized text.
- Compute known totals and demonstrate a test distinguishing the supplied boolean mutant.
- Produce a minimal reproduction note with expected and observed results.


Rubric:
- Boundary tests include zero, 1440, 1441 and true.
- Expected values are independent of the implementation.
- Error assertions distinguish ValueError from unrelated failures.
- A regression case demonstrably catches the deliberate mutant.


Reference solution:
testing_foundation.py implements the full parser and total. FoundationTests covers boundaries, invalid shape and a deliberate mutant comparison. Run the module for total 5. Add a learner-built CLI only after this contract passes.


## Failure-safe report importer

Combine the parser with real temporary files and one deliberate replacement; preserve the old report on any rejected batch.


Requirements:
- Validate at most 1000 rows and unique IDs before writing.
- Serialize schema_version, records and total; read stored JSON back.
- Use an injected replacement failure and assert old bytes remain.
- Assert rejected input does not invoke replacement and temporary files are removed.


Rubric:
- The integration crosses a real filesystem boundary.
- Validation failure and replacement failure have separate fixtures.
- Old output and absence of temporary leftovers are asserted.
- Single-writer/trusted-directory and power-loss limits are explicit.


Reference solution:
testing_integration.py validates first, writes in the destination directory, flushes and fsyncs the temporary file, then replaces once. IntegrationTests checks readback, empty batches, duplicate/oversized rejection and injected replacement failure. This is not a multi-writer transaction.


## Reproducible stale-writer diagnosis

Prove the local version invariant under two competing stale edits and produce a bounded diagnostic report.


Requirements:
- Use a Barrier so both threads read the same version before updating.
- Allow exactly one compare-and-update commit; reject the stale proposal.
- Join workers with bounds and assert final version and allowed winner.
- Add seeded metamorphic totals and an allowlisted diagnostic event.
- Write a release evidence table that separates thread/file tests from missing async, browser and distributed scopes.


Rubric:
- Ordering is established by synchronization rather than sleeps.
- Assertions tolerate either valid winning thread.
- Invalid input causes no update and traces exclude payloads/secrets.
- A diagnosis links reproduction, cause, fix, evidence and limits.


Reference solution:
testing_concurrency.py locks comparison and write together. ConcurrencyTests proves one success plus one conflict after a shared barrier and checks no effect on invalid update. FoundationTests adds seeded finite metamorphic checks. State is volatile and limited to threads in one process; no distributed claim follows.


## Optional diagnosis note

Revision/runtime: …
Command/fixture: …
Expected behavior: …
Observed result: …
Cause/fix or hypothesis: …
What remains untested, and the next check to try: …
