# Language and algorithm visual audit

Reviewed the sections, examples and teaching/practice guides for all 114 lessons across the five owned courses. Diagrams restate existing lesson content; runnable source, literal syntax, endpoint contracts and prose remain unchanged. Existing visual explorers were compared before selecting conversions. This audit adds no technical contracts and claims no execution of practice projects.

| Course | Reviewed lessons | New diagrams | Existing visual/diagram lessons | Retained code/prose |
|---|---:|---:|---:|---:|
| python | 23 | 7 | 2 | 14 |
| dotnet | 24 | 5 | 4 | 15 |
| react | 22 | 4 | 4 | 14 |
| data-structures-algorithms | 21 | 7 | 6 | 8 |
| design-patterns | 24 | 12 | 4 | 8 |

## python

| Reviewed lesson ID | Decision | Candidate / reason |
|---|---|---|
| `run-a-program` | Retain code/prose | Two-line source execution is clearer as runnable code. |
| `values-and-names` | Already visual | Existing Mermaid-backed diagram retained. |
| `text-and-input` | Retain code/prose | Keep literal string conversions and normalization examples. |
| `conditions` | Converted | Work through an example: ordered if / elif / else |
| `collections` | Retain code/prose | Keep collection operations and aliasing cautions as code/prose. |
| `loops` | Retain code/prose | Keep accumulator and filtering code; the small trace is directly executable. |
| `functions` | Already visual | Existing Mermaid-backed diagram retained. |
| `errors` | Retain code/prose | Keep exact exception/validation code and boundary exercises. |
| `files-and-json` | Converted | Understand the idea / Work through an example |
| `modules-and-environments` | Retain code/prose | Keep import setup commands and interpreter selection guidance. |
| `testing-and-api-boundaries` | Retain code/prose | Keep deterministic tests and API failure guidance. |
| `study-log-capstone` | Retain code/prose | Keep the short core workflow and executable integration brief; later bounded importer has a distinct diagram. |
| `classes-and-dataclasses` | Retain code/prose | Keep dataclass construction/equality code and ownership rules. |
| `typing-and-protocols` | Retain code/prose | Keep type-contract contrasts; no runtime validation implied by annotations. |
| `iterators-and-generators` | Converted | Trace and run |
| `context-managers` | Converted | Trace and run |
| `packaging-and-cli` | Converted | Verify the installed artifact; practice/installed-package-exercise.md |
| `logging-and-test-design` | Retain code/prose | Keep assertions, logger configuration and failure-test guidance. |
| `concurrency-models` | Retain code/prose | Keep thread-map and TaskGroup code; their scheduling and failure fixtures are executable. |
| `profiling-and-complexity` | Retain code/prose | Keep measurement methodology and timing code. |
| `security-and-input-boundaries` | Retain code/prose | Keep detailed validation checks as code; bounded importer diagram covers batch ordering. |
| `robust-storage` | Converted | Reason about the design / Trace and run / exercise |
| `robust-import-capstone` | Converted | Reason about the design / Pitfalls and tradeoffs; practice/README.md |

## dotnet

| Reviewed lesson ID | Decision | Candidate / reason |
|---|---|---|
| `first-program` | Retain code/prose | Keep SDK commands and complete Program.cs. |
| `types-null` | Retain code/prose | Keep TryParse branches and nullable guidance as compact executable examples. |
| `control-collections` | Retain code/prose | Keep foreach, dictionary lookup and threshold checks. |
| `methods` | Retain code/prose | Keep method contracts and local-function examples. |
| `objects` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `exceptions` | Retain code/prose | Keep narrow catch and using examples; no need to duplicate ownership text. |
| `linq` | Converted | Query collections with LINQ: first example |
| `async` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `contracts-generics` | Retain code/prose | Keep type constraints and snapshot example code. |
| `resource-ownership` | Retain code/prose | Keep lifetime/borrowing distinctions and using fragments. |
| `delegates-patterns` | Retain code/prose | Keep captured-variable and switch examples executable. |
| `testing` | Retain code/prose | Keep project setup and assertions. |
| `api-di` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `api-contracts` | Retain code/prose | HTTP arrow lines are endpoint/result mappings, not sequential flow; retain request syntax and exact statuses. |
| `integration-checks` | Retain code/prose | Retain independently executable acceptance scenarios; their arrows map requests to responses. |
| `database` | Retain code/prose | Retain provider-specific setup and parameterization code. |
| `ef-evolution` | Converted | Transactions section / guided PersistenceChecks paragraph |
| `capstone` | Retain code/prose | Keep route/result contract including 204; do not conflate with later versioned API 200. |
| `cancellation-budgets` | Converted | Cancellation, time budgets and async streams: first section |
| `concurrency` | Retain code/prose | Keep bounded parallelism and semaphore/lock examples executable. |
| `auth-boundaries` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `observability` | Retain code/prose | Keep distinct instrumentation and health contracts. |
| `deploy-operations` | Converted | Release checklist as an executable workflow outline |
| `performance` | Converted | Measure performance and constrain work: keyset paging fragment |

## react

| Reviewed lesson ID | Decision | Candidate / reason |
|---|---|---|
| `web-basics` | Retain code/prose | Retain semantic HTML and accessibility checks. |
| `values` | Retain code/prose | Retain conversion/equality assertions and graduated practice. |
| `collections` | Retain code/prose | Retain filter/map code; two-stage transformation is already directly readable. |
| `functions` | Retain code/prose | Retain pure function and arrow syntax explanation. |
| `async` | Retain code/prose | Retain HTTP/schema validation code and rejection policy. |
| `typescript` | Retain code/prose | Retain narrowing code and distinction from runtime checks. |
| `components` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `state` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `forms` | Converted | Forms, validation and derived views: search fragment |
| `effects` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `capstone` | Retain code/prose | Retain numbered acceptance scenario and refresh limitation. |
| `modules-closures` | Converted | Modules, closures and the event loop: A/C/B example |
| `type-design` | Retain code/prose | Retain discriminated union declarations; types are not a lifecycle transition map. |
| `reducers` | Converted | Reducers, actions and domain invariants |
| `context-hooks` | Retain code/prose | Retain ownership explanation and independent Hook instances. |
| `identity` | Retain code/prose | Retain key-reset fragment and draft policy tradeoff. |
| `race-safe-loading` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `routing` | Retain code/prose | Retain URL parsing and history rules. |
| `testing` | Retain code/prose | Retain behavior assertions and evidence limitations. |
| `resilience-security` | Retain code/prose | Retain rendering/server authorization distinction. |
| `performance` | Retain code/prose | Retain measurement-first guidance and performance fixture. |
| `delivery` | Converted | Persistence envelope / Release checks arrow sequence |

## data-structures-algorithms

| Reviewed lesson ID | Decision | Candidate / reason |
|---|---|---|
| `cost` | Retain code/prose | Retain scan and complexity reasoning as executable code/prose. |
| `arrays` | Retain code/prose | Retain indexing/insertion examples and representation tradeoffs. |
| `maps` | Retain code/prose | Retain frequency table and hashing assumptions. |
| `stacks-queues` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `binary-search` | Converted | Binary search and invariants |
| `sorting` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `recursion` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `binary-search-tree` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `graphs` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `heaps` | Retain code/prose | Retain heap operations and tie-breaker example. |
| `dynamic-programming` | Retain code/prose | Retain recurrence, base cases and compact rolling-state code. |
| `linked-nodes` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `merge-sort` | Retain code/prose | Retain implementation and sorted-prefix/stability explanation. |
| `two-pointers` | Converted | Two pointers on ordered data |
| `sliding-window` | Retain code/prose | Retain maintained-state code and abba counterexample. |
| `topological` | Converted | Dependencies, DFS and topological ordering: Kahn algorithm |
| `dijkstra` | Converted | Dijkstra example; practice/advanced-reasoning.md: invariant and counterexample |
| `greedy` | Retain code/prose | Retain exchange argument and interval fixture; diagram alone would not establish the proof. |
| `backtracking` | Converted | Backtracking with reversible choices |
| `knapsack` | Converted | Iteration order example; practice/advanced-reasoning.md: recurrence and counterexample |
| `algorithm-review` | Converted | Review checklist arrow sequences |

## design-patterns

| Reviewed lesson ID | Decision | Candidate / reason |
|---|---|---|
| `intent` | Retain code/prose | Retain catalog taxonomy and concrete variation-point design note. |
| `contracts` | Retain code/prose | Retain accepted/invalid input contract assertions. |
| `composition` | Converted | Follow the collaboration: ASCII dependency/call sketch |
| `solid` | Retain code/prose | Retain interface code and design questions. |
| `strategy` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `factories` | Converted | Simple factories, Factory Method and Abstract Factory: example |
| `builder` | Converted | Builder: construct a valid configuration |
| `adapter` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `facade` | Converted | Facade: offer a coherent workflow; workshop export_preview ASCII |
| `decorator` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `composite` | Converted | Composite: uniform operations over trees |
| `proxy` | Converted | Proxy: control access to a collaborator |
| `observer` | Already visual | Existing lesson visual explorer covers its principal process/relationships; avoid parallel diagram duplication. |
| `chain-of-responsibility` | Converted | Chain of Responsibility: first-handler example and policy |
| `command` | Retain code/prose | Retain execute/undo code and explicit conflict limitations. |
| `state` | Converted | State: explicit TRANSITIONS table |
| `mediator` | Converted | Mediator: coordinate a completion workflow |
| `template-method` | Retain code/prose | Retain compact algorithm skeleton and composition alternative. |
| `iterator` | Retain code/prose | Retain one-shot generator example; Python diagram already explains exhaustion in its own course. |
| `dependency-injection` | Converted | Dependency injection and the composition root |
| `repository` | Retain code/prose | Retain small domain collection boundary and provider evidence limits. |
| `unit-of-work` | Converted | Unit of Work example; workshop README ASCII body-succeeds fork |
| `refactoring` | Converted | Refactoring lesson / refactoring-lab.md numbered workflow |
| `selection` | Retain code/prose | Retain decision guide/table and consequences; avoid turning alternatives into a mandatory sequence. |

## Strong text-sketch candidates and practice coverage

- Design Patterns composition: the ASCII call/dependency sketch in Follow the collaboration becomes a five-node call map, explicitly distinguishing inline formatting from a separate collaborator.
- Design Patterns README: the export-preview ASCII chain is covered by the facade diagram and the existing decorator explorer; the body-succeeds fork is covered by unit-of-work. Its literals are retained in the guide.
- .NET deploy-operations: the commented build/tests/publish/migration/readiness/traffic/recovery arrow outline becomes a branching release map.
- React delivery: both Release checks arrow lines become the five-stage release-and-browser-check diagram. The mixed persistence-envelope/release-checks example stays directly visible and selectable; the diagram supplements the release subsection.
- DSA algorithm-review: the three checklist arrow lines become an evidence map. Topological A→B remains a dependency definition and A→B→A remains an explicit cycle fixture.
- DSA advanced-reasoning.md: the A/B/C weighted-route trace and descending-capacity counterexample are represented in dijkstra and knapsack. Equations and oracle instructions remain literal text.
- Python installed-package-exercise.md and README: built-wheel isolation and validate-before-publish are represented in packaging-and-cli and robust-import-capstone. Setup commands, input bounds and failure assertions remain executable text.
- .NET practice README: memory-to-SQLite/authorization staging remains a numbered extension checklist. The transaction diagram represents its task/audit rollback fixture; existing auth-boundaries explorer covers authorization decisions.
- React practice README: remote cleanup is already visual in race-safe-loading. Persistence migration, storage errors and real API wiring remain specific code exercises; release/browser evidence is represented in delivery.
- Design Patterns refactoring-lab.md: repeated regression checks between validation, formatting and delivery extraction become the refactoring sequence.

## Verification and limits

All diagram keys match lesson IDs; node IDs are unique; every edge endpoint and active-step reference resolves. Each new graph uses 4–7 nodes and 3–4 explanatory steps. The shared renderer generates Mermaid from the nodes/edges contract, so no second hand-authored Mermaid source is stored. No shared renderer, generated catalog, path.json, workshop source, practice source or historical snapshot was edited. The existing NotebookMermaid.source renderer generated all 39 owned diagram sources (35 new plus 4 existing), preserving every edge count with resolved labels. Parent integration supplies catalog regeneration and browser verification. The diagrams preserve the local-only, non-durable and unsupported-input limits of their source lessons.
