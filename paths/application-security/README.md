# Application security: synthetic offline practice

Requirements: Python 3.11+ standard library, including SQLite. Keep security_lab.py and test_security_lab.py together in the extracted folder.

```
python -B -m unittest -v test_security_lab.py
```

The reference implements downstream object authorization, narrow field validation, HTML text escaping, real in-memory SQLite parameter binding, local opaque sessions, a synchronizer-token comparison, structured audit construction and a single-process fixed-window limiter. Its strings and records are synthetic. It opens no listener, contacts no target, stores no password, provisions no account and accepts no real credentials. The SQL connection is in-memory and explicitly closed by tests. Tests use injected time instead of sleeps.

`Principal` means already verified by a trusted authentication adapter. Never construct it from caller JSON. There is no JWT signing/verification/decoding implementation and no simulated claim that token cryptography passed. `Sessions.login` creates state for an already-authenticated fixture principal; it is not credential verification. Time values are trusted monotonic numeric fixture inputs. The module is sequential local training code, not a hardened HTTP server or distributed session/limiter implementation.

Read each stage kit, then complete threat-model.md and verification-matrix.md. Source pointers use ASVS 5.0.0 and applicable IETF/OIDC guidance. Selected controls and a passing test suite are not ASVS certification. Browser cookies, route integration, real issuer/key validation, password/MFA and production operations remain separately verified work.

identity-provider-lab.md is an optional learner exercise. Its prerequisite is an explicitly chosen authorized training tenant and maintained library, with exact documented setup and sanitized evidence. The baseline runs without this extension. No real tenant/account changes or requests are performed by these files.
