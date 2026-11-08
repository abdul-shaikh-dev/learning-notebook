# Application security: synthetic offline practice

Requirements: Python 3.14+ standard library, including SQLite. Keep security_lab.py, security_http.py and both test files together in the extracted folder.

```
python -B -m unittest -v test_security_lab.py test_security_http.py
```

The reference implements downstream object authorization, narrow field validation, HTML text escaping, SQLite parameter binding, local opaque sessions, a synchronizer-token comparison, structured audit construction and a single-process fixed-window limiter. `security_http.py` adds a loopback PATCH route and file-backed SQLite fixture so denied requests can be checked against independently reopened persisted state. All records are synthetic; no credential is verified or account provisioned.

`Principal` means already verified by a trusted authentication adapter. Never construct it from caller JSON. There is no JWT signing/verification/decoding implementation and no simulated claim that token cryptography passed. `Sessions.login` creates state for an already-authenticated fixture principal; it is not credential verification. Time values are trusted monotonic numeric fixture inputs. The module is sequential local training code, not a hardened HTTP server or distributed session/limiter implementation.

Run `python -B -m unittest -v test_security_lab.py test_security_http.py`. Read each stage kit, then complete threat-model.md and verification-matrix.md. Source pointers use ASVS 5.0.0 and applicable IETF/OIDC guidance. Selected controls and a passing test suite are not ASVS certification. Browser cookie attributes, real issuer/key validation, password/MFA and production operations remain separately verified work.

identity-provider-lab.md is an optional learner exercise. Its prerequisite is an explicitly chosen authorized training tenant and maintained library, with exact documented setup and sanitized evidence. The baseline runs without this extension. No real tenant/account changes or requests are performed by these files.


## Reference scope and verification limits

The course covers selected web-application controls from ASVS 5.0.0, released in 2025. Its original exercises use fictional data and require Python 3.14 or later. They are neither an ASVS certification nor a complete HTTP server or identity-provider implementation.

## OWASP Top 10:2025 mapping

The lessons follow ASVS controls rather than the Top 10, but each Top 10:2025 category maps to lessons as follows. Lesson numbers match the course list.

| Category | Lessons |
| --- | --- |
| A01 Broken Access Control | 4 authorization, 5 mass assignment, 9 CSRF, 13 SSRF |
| A02 Security Misconfiguration | 7 cookies and transport, 11 browser security headers |
| A03 Software Supply Chain Failures | 21 dependencies and advisories |
| A04 Cryptographic Failures | 7 HTTPS, 8 password hashing, 19 secrets |
| A05 Injection | 10 output encoding (XSS), 12 SQL parameter binding |
| A06 Insecure Design | 1 threat modelling, 22 abuse limits |
| A07 Authentication Failures | 3 authentication boundary, 6 sessions, 8 passwords and MFA, 15-18 OAuth, OIDC, PKCE and token validation |
| A08 Software or Data Integrity Failures | 14 unsafe deserialization and uploads, 18 token integrity |
| A09 Security Logging and Alerting Failures | 20 security events, 24 incident response |
| A10 Mishandling of Exceptional Conditions | Partly: deny-by-default checks in 4 and negative tests in 23. Error handling as a whole is not covered. |

Source: https://owasp.org/Top10/2025/ (reviewed 2026-11-08). The Top 10 is an awareness document, not a testing standard; use ASVS for verification.
