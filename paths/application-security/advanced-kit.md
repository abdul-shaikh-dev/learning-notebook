# Security verification and identity integration review

Deliver an evidence matrix and runbook, plus an optional real-provider integration plan with clear opt-in and test boundaries.

## Run from the extracted folder

```
python -B -m unittest -v test_security_lab.py
```

Expected: Nine methods pass. This does not execute HTTP/browser/provider or cryptographic validation.

## Implement and submit

1. Run the entire local regression suite and OperationsTests.
2. Document log fields and single-process rate-limit limitations.
3. Map selected ASVS 5.0.0 controls to executed/unexecuted evidence.
4. Complete identity-provider-lab.md without placing secrets in the report.
5. Specify real issuer/audience/expiry/signature/correlation negative tests through maintained libraries.
6. Write an incident/rotation plan with authorized containment and recovery.

## Reference approach

Run all nine unittest methods. Use safe_audit and the limiter as narrowly scoped local examples, and complete verification-matrix.md with exact commands/outcomes. The IdP worksheet requires explicit learner opt-in to a training tenant and a maintained OIDC/token library; execute its matrix only after configuring that environment. Record sanitized provider/library versions and denial outcomes, not token text. Add an incident response and rotation plan targeting the actual compromised mechanism.

## Evidence rubric

- No raw token, cookie, credential or private body enters evidence.
- Local test claims match their actual boundary.
- Provider and browser results are labeled unexecuted until observed.
- No fake JWT cryptography is implemented.
- The report rejects blanket ASVS certification and covers practical recovery.
