# Harness operations runbook and incident exercise

This is a design exercise for a future service. The downloadable workshop runs locally with synthetic state; it does not deploy monitoring, authentication or durable storage.

## State triage

| State | Meaning | First action |
|---|---|---|
| ready | May request the next proposal | Check task scope and remaining limits |
| waiting | Exact action awaits a host decision | Show the reviewed operation; never auto-approve to clear a backlog |
| uncertain | A write may have committed without a usable response | Preserve identity and reconcile the original operation |
| limited | Normal dispatch stopped by a budget | Report confirmed partial outcomes and the reason |
| denied/rejected | Policy or contract prevented dispatch | Explain the applicable boundary; do not broaden it automatically |
| cancelled | Host stopped further work | Preserve receipts and any unresolved effect evidence |
| done | Script reached a final step | Display confirmed receipts separately from model text |
| failed | A known runtime/read failure stopped the run | Inspect safe category and retry ownership |

An uncertain effect does not become a known failure because a deadline expires or the user cancels. The reference keeps it uncertain until a matching receipt resolves it, then applies the requested stop to future execution. A real service may model execution-stop and effect-status as separate fields.

## Uncertain save procedure

1. Prevent new effects for the run. Do not submit a fresh save with a new operation ID.
2. Collect run ID, subject, call ID, tool/schema/policy versions and intent fingerprint. Avoid displaying note text unless needed and authorized.
3. Query the authoritative receipt source through a separately authorized and bounded recovery path.
4. If a matching receipt exists, attach it and report the actual effect. A consumed deadline or cancellation still prevents further ordinary dispatch.
5. If the receipt is absent, conflicting or inaccessible, keep the uncertainty visible. Absence may reflect replication lag or incomplete evidence in a real system.
6. Assign an owner and escalation deadline. Only the documented recovery policy can authorize retry, compensation or manual reconciliation.
7. Record the decision and evidence reference, then add a regression case if behavior differed from expectations.

## Approval review

Display subject, run, tool, resource, destination and meaningful arguments. Match the reviewed intent at execution time. Recheck current entitlement. Define reviewer authentication, expiry, revocation and replay protection in the real approval service; the toy digest supplies none of these by itself.

If arguments change, ask for a decision on the new intent through the product's authorized flow. If the action is denied by resource policy, approval does not override it. If a checkpoint is restored, the toy intentionally requires fresh approval.

## Operational signals

Track completed tasks, user-visible success, denied actions, validation failures, uncertain effects, approval age, step exhaustion and elapsed-budget stops separately. A rising rejection rate can mean attempted misuse or a broken prompt/schema, so inspect context before changing policy.

Use bounded labels such as tool and outcome categories for aggregate metrics. Keep run/call IDs in restricted traces or event records, not unbounded metric labels. Avoid raw note text, access tokens and full exception payloads in general telemetry. Specify retention and access roles for events, checkpoints and business state independently.

## Incident exercise: two notes after one user intention

Timeline to investigate:

```text
10:00 user approves note intent I1
10:01 adapter sends operation C2
10:01 external service commits note N1; reply is lost
10:02 harness incorrectly marks failed
10:03 retry generates new call ID C3
10:03 service commits note N2
```

Questions: Which component changed the operation identity? Which retry layers ran? Was approval bound to the same intent? Did the external service support idempotency or receipt lookup? Were policy and adapter versions recorded? Was the UI claiming failure without evidence?

Reference reasoning: preserve C2 and its intent, enter uncertainty and reconcile before allowing another effect. New call ID C3 is not proof of a new user intention. Handle an actual duplicate through an authorized business process; deleting logs or checkpoints cannot repair it. Add tests for lost response, duplicate delivery, changed payload and stale approval.

## Release and rollback exercise

Record a bundle identifier covering runtime, tool contracts, policy, prompt and model configuration. Run deterministic policy tests, then a separate representative real-model evaluation when one exists. Mark unexecuted tests as planned.

Use a limited controlled rollout with thresholds agreed by the product/operations owners. Monitor outcome quality as well as error rates. A rollback must preserve in-flight checkpoint compatibility and revoked permissions. It does not undo committed notes. Write a plan for already-executed effects and pending uncertainty before enabling a new adapter.

## Evidence ledger

For each claim record: mechanism, test input, expected result, observed result, version and limitation. A mock adapter test is not evidence of real network behavior; a single-worker unit test is not evidence of fencing; a metadata allowlist is not a completed privacy review.
