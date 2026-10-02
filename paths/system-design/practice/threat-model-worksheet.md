# Repeatable threat model worksheet

Use synthetic data. Record design revision, reviewers, date, assumptions, diagram and revisit trigger. Repeat after an API, identity, storage or dependency boundary changes. Follow the OWASP threat-modeling questions: what are we building, what can go wrong, what will we do, and how do we verify the result?

| Asset and invariant | Trust boundary / entry point | Actor and abuse sequence | Mitigation and enforcement owner | Verification and expected result | Residual risk / revisit trigger |
|---|---|---|---|---|---|
| Private booking belongs to one account | Browser → booking API → data store | Signed-in B submits A's booking ID | API binds query to authenticated account; store policy also scopes records | Two synthetic accounts: B's read/update returns denial and no change; A succeeds | Admin access and backup copies need separate controls |
| One final seat cannot be sold twice | API workers → shared inventory | Concurrent requests each observe one seat | Atomic conditional decrement and booking transaction | Two clients race final seat: exactly one booking, inventory zero | Regional failover needs a separate drill |
| Booking operation occurs once | Client retry → API transaction | Lost response followed by same key or altered payload | Durable account-scoped key and intent digest | Same intent returns receipt; changed intent conflicts; no duplicate booking | Retention expiry must be documented |
| TODO | TODO | TODO | TODO | TODO | TODO |

For each row record severity, likelihood, owner, status and evidence artifact. Draw identities, data flows and privilege changes; include logs, backups and support tooling. Test both allowed and denied cases. Check the resulting data and side effects as well as the HTTP status. Include abuse of ordinary business rules, resource exhaustion and dependency failures. Label each test as planned or executed. Attach observed results to executed tests and record unresolved risks. This worksheet does not certify security or replace a production penetration test.

Source: [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html), methodology and validation, reviewed 2026-09-27.
