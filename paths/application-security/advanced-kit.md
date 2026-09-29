# Security verification and identity integration review

Deliver an evidence matrix and runbook, plus an optional real-provider integration plan with clear opt-in and test boundaries.

## Run from the extracted folder

```
python -B -m unittest -v test_security_lab.py test_security_http.py
```

Expected: Ten methods pass, including loopback HTTP mutation denial and persisted-state checks. This does not execute a browser/provider or cryptographic validation.

## Implement and submit

1. Run the entire local regression suite and OperationsTests.
2. Document log fields and single-process rate-limit limitations.
3. Map selected ASVS 5.0.0 controls to executed/unexecuted evidence.
4. Run the local loopback PATCH tests in test_security_http.py; record denied status plus unchanged persisted rows from a fresh connection, followed by an authorized update.
5. Specify real issuer/audience/expiry/signature/correlation negative tests through maintained libraries as an optional provider plan. Execute identity-provider-lab.md only if you opt into an authorized training tenant.
6. Write an incident/rotation plan with authorized containment and recovery.

## Reference approach

Run the local unittest suites. Use safe_audit and the limiter as narrowly scoped local examples, and complete verification-matrix.md with exact commands/outcomes. Required offline evidence includes PATCH denial and unchanged SQLite rows. The IdP worksheet requires learner opt-in to a training tenant and a maintained OIDC/token library; execute its matrix only after configuring that environment. Record sanitized provider/library versions and denial outcomes, not token text. Add an incident response and rotation plan targeting the actual compromised mechanism.

## Evidence rubric

- No raw token, cookie, credential or private body enters evidence.
- Local test claims match their actual boundary.
- Provider and browser results are labeled unexecuted until observed.
- No fake JWT cryptography is implemented.
- The report rejects blanket ASVS certification and covers practical recovery.
