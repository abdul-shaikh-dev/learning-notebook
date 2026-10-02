# Security verification record

Candidate/runtime/library versions:
Applicable ASVS version and chosen requirement scope: 5.0.0, selected course controls.

| Control/source section | Entry point | Synthetic or authorized attack case | Expected denial/effect | Executed command | Observed result | Remaining boundary |
|---|---|---|---|---|---|---|
| V8 authorization | read_document | Alice requests Bob b / other tenant c | unavailable, no private contents | fill | fill | real routes, concurrent ownership |
| V2 validation | parse_update | owner/role, wrong type, 81 chars, control text | ValueError, no mutation | fill | fill | persisted constraints/HTTP body parsing |
| V1 SQL binding | find_title | literal apostrophe OR expression | zero matches, two stored rows remain | fill | fill | actual driver/query/tenant scope |
| V7 sessions | identity/logout | old, expired or revoked session | PermissionError | fill | fill | browser transport/shared storage |
| V3 CSRF | csrf | missing/foreign/Unicode supplied token | safe denial | fill | fill | real route + browser origin behavior |
| Local HTTP mutation boundary | PATCH /documents/a | absent/expired session, missing CSRF, other owner or tenant, mass assignment | 403/404/400 and unchanged rows read from a new SQLite connection; owner succeeds | `python -B -m unittest -v test_security_http.py` | fill | real identity adapter, cookie attributes, browser behavior |
| V9/V10 tokens | real validator | wrong issuer/audience, expired/tampered/token-purpose confusion | rejected by maintained validator | optional extension | unexecuted until observed | provider keys/correlation/rotation |

Preserve expected and actual separately. Add legitimate-success cases so a deny-all implementation cannot pass. Record denied mutations as unchanged state, not only an error label. A local pass proves the local code's stated contract; do not claim complete ASVS compliance/certification or provider/browser verification from it.
