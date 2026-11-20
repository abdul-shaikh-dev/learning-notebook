# Six engineering paths — 2026-09-27

This is a historical implementation and local-verification record. Later edits
require fresh evidence; the existence of this record is not a current pass.

## Delivered scope

| Path | Lessons | Stages/projects | Extracted-kit test methods |
|---|---:|---:|---:|
| Git & Team Workflows | 20 | 3 | 4 |
| Application Security | 21 | 3 | 9 |
| Testing & Debugging | 24 | 3 | 10 |
| Networking & the Web | 24 | 3 | 12 |
| Delivery & Operations | 24 | 3 | 12 |
| Kubernetes | 24 | 3 | 11 |

All 137 lessons include explanations, worked examples, exercises, self-checks
and scoped primary-source references. Eight narrated diagrams accompany the
new paths. Every lesson links its stage task kit; ZIPs include complete baseline
dependencies and reference solutions. The shared map, search, reading progress,
backup and printable reader include all six subjects.

## Executed evidence

- `node verify.cjs`: passed; 347 generic lessons plus the existing financial
  curriculum, 47 task routes, 594 search entries and 17,833 links checked.
- `python scripts/build-bundles.py --check`: all 16 bundles passed.
- `python tests/resource-bundles.py`: 18 tests passed, including LF/CRLF
  consistency for YAML, Dockerfile and .dockerignore.
- `python scripts/verify-python.py`: full local runner passed. The final extra
  load-helper regression was subsequently included in the extracted-kit run.
- Fresh ZIPs extracted to temporary folders: all six new suites passed,
  58 test methods in total on Python 3.14. Git used installed Git 2.55.
- `pwsh -NoProfile -File paths/kubernetes/practice/test_lab_guard.ps1`:
  seven behavioral cases passed using a function stub; no real kubectl call.
- `node scripts/build-pages.cjs`: built 189 explicitly allowlisted files.
- Browser: all sixteen courses visible on the map; course entry, quiz feedback,
  task instructions and narrated-step controls checked. Networking lesson at
  390px viewport had no horizontal page overflow.

The release workflow separately reruns Python on 3.11 and 3.14, React checks,
.NET checks, site/bundle checks and the offline PowerShell guard before publishing.
Consult its run result for cross-platform evidence rather than inferring it from
the local Windows run.

## Corrections made during verification

Corrected a quiz index, moved byte encoding before HTTP message lessons, made
HTTP field handling case-insensitive, retained explicit port zero, rejected
malformed Unicode CSRF tokens, and clarified per-command output/file purpose.
SQLite connection disposal was corrected after extracted tests exposed locked
temporary files on Windows. Rebuilt ZIPs passed afterward. The load helper now
refuses redirects, ignores environment proxies and bounds response bytes; its
local redirect test checks that the destination was never visited.

Kubernetes namespace bootstrap precedes server-side dry-run because dry-run
does not persist a Namespace. Context/endpoint/cleanup checks were exercised
with fake kubectl. Version-label restart tests are described as simulations,
not evidence of replacing different application binaries.

## Limits

No running Docker daemon or Kubernetes cluster was available for this work.
Container builds, Kubernetes admission/scheduling/probes/CNI/storage/scaling,
Helm/GitOps operation and the React/.NET/SQL integration runbook were not executed.
Offline manifest checks do not establish those behaviors. TLS tests inspect
configuration, not a handshake; DNS/cache/retry utilities are bounded models.
Real browser CORS/cookie enforcement and identity-provider/cryptographic
integration remain separately documented exercises. No production capacity,
security certification or mastery claim follows from the local test results.
