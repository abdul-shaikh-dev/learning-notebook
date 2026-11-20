# Review fixes — 27 September 2026

Follow-up to the review of baseline `5fb6422`. Historical verification snapshots remain unchanged.

## Corrected behavior

- SQLite backups and readiness use escaped absolute file URIs in both Delivery and Kubernetes. Regressions cover special characters and missing-source noncreation.
- Networking and load observations reject incomplete or oversized HTTP bodies. Networking cleanup closes retained client connections with finite handler waits; UTF-8 decoding is explicit.
- Git learner commands retain uniquely owned workspaces and evidence transcripts for independent inspection. The default automated verifier still uses temporary cleanup.
- All 48 Testing/Networking self-check rubrics describe observable criteria without stating quiz answers. Rollback and related unrelated feedback fragments are corrected.
- DSA and Design Patterns follow foundation/intermediate/advanced order, ending with their review lesson. Stable lesson IDs and progress storage keys are preserved; lesson counts are current.
- Map, list and result counts normalize surrounding search whitespace consistently.
- SQL raw amount comparisons include byte length and bytes, so trailing-space and collation-equivalent differences cannot silently become duplicates. Both embedded answer keys match the classifier.

## Verification on this machine

- `node verify.cjs`: passed, including new rubric, sequence and padded-search regressions.
- `python -B scripts/verify-python.py`: all suites passed (182 tests), plus both algorithm script self-checks; fixtures ran in temporary copies.
- `python -B tests/resource-bundles.py`: 18 tests passed. All 16 bundles rebuilt and consistency checked.
- `python -B tests/sql-conflicts.py --server .\SQLEXPRESS`: passed on SQL Server 2025 Express 17.0.1000.7, Windows authentication. Baseline import, replay, trailing/leading spaces, equivalent numeric formatting, same-length differing bytes, changed order and exact duplicate behavior were checked using connection-local temporary tables in tempdb. No permanent database or table changes.
- Local built-site browser check: padded Kubernetes search returns one matching course in both Map and List; Networking's visible self-check no longer reveals its quiz answer.
- Static public build and diff whitespace checks passed.

Real Kubernetes/Docker operations, live providers and real identity services remain outside this validation. Unit tests and reference labs do not establish production readiness.
