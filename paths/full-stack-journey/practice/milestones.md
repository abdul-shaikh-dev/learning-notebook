# Journey checkpoints and evidence

## Foundation: one complete vertical slice
Create and list sessions; validate 0, 1440, -1, 1441, blank title and boolean minutes.
Keep a draft when the API is stopped; show a useful error instead of an empty list.
Add the Open minutes summary from first-slice without duplicating task state.
Check 25 before completion, 0 after success, and unchanged 25 after a rejected update.
A text filter is another optional extension. Check both HTTP status and visible behavior.

## Intermediate: reliable persistence and conflict handling
Use the dedicated SQL database; prove restart persistence. Run the two-writer check.
Open the UI in two tabs: complete the same version in both; the second must show a
conflict until Reload. Add editable titles with a retained draft and explicit compare.
Design the idempotency tests here. Implement multi-user keys after the identity milestone
below; a fixed synthetic owner is sufficient only for the local receipt fixture.
Add an idempotency key for POST: same key+same payload replays one result; key+different
payload returns conflict. Persist the key and created task atomically, and test retries
after a committed response is lost. The baseline does not implement idempotent create.

## Advanced: identity, release and recovery
Follow Application Security to integrate a real OIDC provider. Derive owner from verified
claims, enforce owner on list/update and test a foreign ID with two accounts. A query string
or client header is not a trusted identity. Add CSRF defense if using cookies. Do not expose
the anonymous reference to a public host while making these changes.

Build frontend/API once in CI; record artifact identity; promote the same bytes. Run
acceptance against an isolated test database. Separate liveness from SQL-backed readiness.
Propagate trace context, record bounded request metadata, and measure a defined workload.
Practice backup/restore into a NEW database and verify task counts/versions after recovery.
Document elapsed recovery time, tolerated data loss, deployment rollback compatibility and
unexecuted checks. Infrastructure creation is optional and needs a separate owned sandbox.

## Optional notes
Keep the command output or a short note when it helps reproduce a result. There is no
required worksheet. Passing baseline checks proves supplied local behaviors only;
use the independent cases above to check your own extensions. Name untested boundaries
when discussing a release or recovery claim.
