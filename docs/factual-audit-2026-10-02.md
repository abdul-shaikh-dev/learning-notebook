# Notebook factual review, 2 October 2026

All 752 lessons across 34 paths received a factual review against baseline `4efaedb`. The review covered lesson explanations, worked examples, exercise prompts and solutions, checks, quiz answers and reference scope. Generated copies were counted once. The coverage check matches the canonical lesson IDs to the six ledgers below, with no missing or duplicate rows and no pending lesson reviews.

This establishes full lesson-reading coverage with the evidence and limits recorded below. It does not establish every claim by an independent experiment or certify every optional integration. Original scenarios were checked against their supplied facts; recommendations were not treated as measured outcomes.

## Coverage

| Review record | Paths | Lessons |
|---|---:|---:|
| [Programming](factual-audit-programming-2026-10-02.md) | 11 | 250 |
| [Systems](factual-audit-systems-2026-10-02.md) | 8 | 183 |
| [Operations](factual-audit-operations-2026-10-02.md) | 4 | 91 |
| [Personal learning](factual-audit-personal-2026-10-02.md) | 6 | 117 |
| [Mathematics, data, ML and finance](factual-audit-data-finance-2026-10-02.md) | 4 | 87 |
| [SQL Server](factual-audit-sql-2026-10-02.md) | 1 | 24 |
| Total | 34 | 752 |

## Corrections

Teaching content changed in 21 lessons, excluding reference-only edits. A separate practice-code fix and worksheet mirrors were updated as described below.

- Data analysis: `isna()` produces a Boolean mask. SHA-256 equality is practical evidence, not a collision-free mathematical identity test. The practice validator now rejects date strings that parse to missing timestamps, with regression cases for empty strings and `NaT`.
- Mathematics and ML: qualified the unweighted-rate rule, corrected the categorical-encoding example to distinguish binary indicators from arbitrary spacing across three categories, and aligned final-evaluation instructions with the actual report fields.
- Programming and UI: corrected thread timeout semantics, Vite build-time configuration, WCAG contrast measurement and the single-pointer alternative required for dragging. Replaced unrelated React references.
- Systems and operations: corrected the customer-lookup claim, DNS TTL-zero and JSON encoding scope, nonexistent quarantine-table descriptions, CloudEvents identity scope, processing-time versus throughput wording, Azure template resource count and trace-span lifetime assumptions.
- Personal learning: removed unsupported assumptions about optional tasks, an invented timetable change and delayed practice evidence that had not yet been observed.
- SQL: restored the normalized amount column omitted from the embedded capstone report. The downloadable solution already included it.
- References: added direct primary references where generic pages did not support the particular concept. Refreshed finance source-access records while retaining dated legal scope and retrieval restrictions.

## Verification

- `python scripts/verify-python.py`: passed 53 unittest runs containing 364 tests, plus standalone drills and algorithm checks. This includes the installed-package test. Ran on Python 3.14; the separate Python 3.11 CI matrix was not rerun locally.
- `python scripts/verify-data-science.py` using the pinned scientific environment: six analysis and five ML tests passed.
- `node tests/browser-python.cjs`: the vendored WebAssembly runtime passed all 30 reference solutions against 192 cases and rejected the supplied invalid-result cases. This is worker-runtime evidence, not a browser accessibility walkthrough.
- Independent execution: 121 programming example/solution blocks, all 21 mathematics example blocks, SQL examples from 23 lessons, scientific arithmetic and finance calculations. The SQL retry/deadlock pseudocode was reviewed rather than represented as executable SQL.
- React domain checks and 11 Vitest tests passed, alongside the full-stack decoder and UI static/contrast checks recorded in the programming ledger.
- `node scripts/sync-catalog.cjs` and `node scripts/build-pages.cjs`: passed; built 605 public files.
- `node verify.cjs`: passed the integrated content, arithmetic, UI-state, backup, lazy-loading and PWA checks.
- `python scripts/build-bundles.py --check` and `python tests/resource-bundles.py`: all 34 bundles verified; 18 resource tests passed.
- Canonical-to-ledger ID comparison: 752 expected, 752 unique recorded, zero missing/duplicate/pending rows. `git diff --check` passed.

## Remaining evidence limits

The .NET 10 target runtime was unavailable locally. Live cloud resources, Terraform provider execution, Kubernetes scheduling/network/storage behaviour, broker guarantees, distributed failover, general-purpose Linux kernel/service exercises, optional LangGraph/provider calls and Fleet were not validated through deployment. Source checks and local models do not substitute for those environments.

Some original research was available only as abstracts, and the full GoF book was unavailable. These restrictions remain in the corresponding rows. Finance used accessible IFRS-aligned AASB text and dated official provisions; restricted EUR-Lex/EBA pages were checked through official indexed text where stated. The review does not certify current applicability to a particular bank or reporting date.

No learner study or comprehensive browser/assistive-technology evaluation was performed. Historical review snapshots remain unchanged. This report records local corrections; publication is a separate step.
