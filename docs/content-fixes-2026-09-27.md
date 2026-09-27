# Content review response — 27 September 2026

This implements the focused findings from the 26 September review. Historical
review snapshots are unchanged. The notebook remains a guided foundation through
selected advanced practice, not a certification or complete production reference.

## Changes

- All 210 standard technical lessons now expose scoped source sections, review
  dates and applicability notes in the reader and printable packs. Finance retains
  its existing detailed source register, with references in the new workbook.
- Quizzes use stable, balanced option positions while preserving original answer
  identities. Selected React and .NET questions now use practical failure scenarios.
- Finance: a two-date position/cash/FX/adjustment P&L bridge, cost-allocation
  comparison, curve repricing and sensitivity residual; downloadable inputs,
  worked explanation and executable checks beside the exercises.
- Python: deterministic TaskGroup child failure and parent cancellation; a complete
  package generator and installed-wheel verification outside the source checkout.
- .NET: consistent .NET 10 instructions and a package-pinned SQLite/TestServer
  exercise covering persistence, rollback, concurrency, cancellation and ownership
  policies. The native SQLite package is pinned to the patched version used in checks.
- React: a complete local Vite/Vitest/jsdom kit, with stale-response protection,
  URL navigation, direct-link remount, retry and accessible validation exercises.
- SQL Server: an opt-in disposable database and two-session isolation, lost-update,
  atomic-increment and deadlock schedules; Query Store and raw/normalized rounding
  labs, guarded setup/reset/cleanup and expected evidence.
- DSA: iterative integer-key BST and directed DFS/cycle implementation with
  independent small-input oracles; explicit Dijkstra/knapsack caller preconditions.
- Patterns: declared selected-catalog scope, original GoF provenance and tested
  Chain of Responsibility/Mediator/Observer contrasts.
- System design: a reusable threat-model worksheet and direct Little's Law reference.
- AI agents: original tool-use, retrieval and evaluation readings; an optional
  provider-integration exercise with strict request schema and usage evidence.
- Harnesses: generated malformed parser inputs and a durable SQLite checkpoint
  exercise with stale-writer compare-and-swap checks.

## Verification

- `node verify.cjs`: arithmetic, curriculum, printable packs, resources, search,
  navigation, progress/backup compatibility, lesson sources and quiz identity.
- `python scripts/verify-python.py`: 116 unittest methods plus both algorithm
  reference scripts; includes the wheel built and installed in a clean environment.
- React domain and five component tests, TypeScript checking and production build;
  clean standalone practice-kit install/test/build also verified.
- .NET SDK 10.0.401: four foundation, eleven baseline HTTP and thirteen SQLite/
  TestServer assertions passed locally.
- Ten complete ZIP packs, eighteen bundle checks and the portable static build
  are included in release verification. The release workflow repeats Python checks
  on 3.11 and 3.14 and runs the React/.NET checks before deployment.

## Explicit limits

SQL scripts were source-inspected, not engine-executed: no running SQL Server or
Docker daemon was available locally. Their expected outcomes are instructions to
verify, not invented measurements. No live paid model request or real identity
provider was used. jsdom does not certify real-browser accessibility. The SQLite
checkpoint exercise demonstrates durable version checks, not a complete distributed
worker runtime. Reference review dates do not establish permanent regulatory/API
currency. These boundaries are also stated in the learning material.
