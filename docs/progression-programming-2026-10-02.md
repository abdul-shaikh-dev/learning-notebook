# Programming progression review, 2 October 2026

Reviewed 185 lessons/challenges across eight paths, their worked answers and checks, prerequisites, 24 stage projects and resource manifests. The review followed the displayed order and compared each exercise with the concepts available at that point. It did not run every deployment, database, browser or accessibility exercise. Existing historical audits remain unchanged.

## Python, 23 lessons

The values, decisions, collections, loops and functions sequence already supports the study-log task. Its earlier grouping example and independent summary challenge supply useful transfer beyond copying a sample. The intermediate dataclass, protocol, generator and cleanup sequence also has executable checks.

Fixed `files-and-json`: its first file example used imports, `with`, a temporary directory and Path `/` before explaining those constructs. Added the minimum reading needed before the example, with cleanup mechanics deferred to `context-managers`.

Fixed `logging-and-test-design`: `robust-storage` required injected replacement failure, but the only earlier instruction was to patch where a dependency was looked up. Added a complete, disk-free example showing temporary replacement, `side_effect`, exception propagation and call verification. Replaced generic checks in `security-and-input-boundaries`, `robust-storage` and `robust-import-capstone` with their exact acceptance/rejection and preserved-state contracts. The text now separates checking the learner's function from running the supplied reference suite.

## Python Problem Solving, 30 challenges

Reviewed every statement, constraint, hint, approach, reference solution, complexity statement and variation. The progression from sums and ordered collection work through windows/search/stacks to mixed practical tasks is already sound. The reference case/oracle suite remains unchanged because this pass changes teaching, not accepted input/output contracts.

Fixed `column-totals` hint 2 with a nested-loop trace showing that each row restarts its column index. Fixed `ready-order` hint 3 to explain set subset syntax before using it.

Added independently checkable variation examples to `sum-approved`, `reading-changes`, `keep-first-labels`, `most-requested`, `affordable-stretch`, `fulfill-orders` and `book-most-sessions`. The negative-credit and weighted-session cases provide actual counterexamples to reusing the original algorithm under changed assumptions. These variations are optional and require separate tests; the original judge still checks the original contract.

Only `challenges.json` was edited. The primary integration pass regenerates its reader, cases and downloads.

## Data Structures & Algorithms, 21 lessons

The graph, topological, Dijkstra, greedy and knapsack sequence already states objectives, preconditions and failure cases. Existing independent graph/knapsack oracles provide stronger evidence than timing alone.

Fixed `sorting` with a named-function versus lambda comparison and tuple-key trace. Fixed `binary-search-tree` with node/reference construction and a search trace before successor deletion. The declared Python prerequisites did not include classes. Fixed `sliding-window` with the complete `abba` state trace and an explanation of the `itertools.product` test generator.

Replaced the foundation project's ambiguous undo/duplicate behavior with an explicit command contract. A duplicate ID is ignored permanently, undo reverses only the most recent active accepted add, and topic keys survive a zero total. The supplied two-event fixture distinguishes ignoring a duplicate from pushing it onto history. The download is explicitly not an implementation of this new learner project.

The intermediate resources previously required the one-discount Dijkstra extension before teaching Dijkstra. Deferred that extension to the advanced lessons while retaining BFS and coin work at the intermediate stage.

## Design Patterns, 24 lessons

The pattern lessons consistently compare intent, contract and cost. The existing advanced refactoring labs test failure timing and input preservation; no new hierarchy or additional pattern is needed.

Corrected prerequisites to name Python `classes-and-dataclasses`, because Python foundations alone do not teach classes. Added the construction-versus-invocation trace to `decorator`, including captured collaborators. Added `yield`/exception control flow to `unit-of-work` so readers can explain why a failed body skips publication.

The foundation resources previously assigned versioned batch commit/refactoring before the relevant lessons. Kept that lab in advanced resources and explicitly deferred it in foundation. The intermediate collaboration task now distinguishes its chain/observer work from later Command/Mediator material. Corrected the advanced prerequisite's stale Command lesson number.

## C# & .NET, 24 lessons

The stages already have separate console, persistent HTTP and operational projects with concrete acceptance conditions. Database/provider and real-token limits are appropriately distinguished from local test doubles.

Fixed `types-null` to explain `if`, `out`, short-circuit `&&` and interpolation before the first validator. Added a request/response/route trace to `api-di`; the course does not require prior HTTP knowledge.

Fixed `capstone` to distinguish its intentionally smaller unconditional 204 endpoint from the stage project's expected-version/409 contract. Readers now get an explicit create/fetch, completion, then versioned-write sequence, without accidentally replacing the versioned project with the toy fragment.

Marked the HTTP adapter paragraphs in `methods` and `async` as previews. Removed the HTTP adapter command/task from foundation resources; it remains in intermediate/advanced resources after API and integration teaching. Repaired compressed number/status wording in the affected prose.

## JavaScript, TypeScript & React, 22 lessons

The later reducer, identity, race-safe loading and persistence lessons already include appropriate transitions and failure cases. The supplied baseline and extensions are distinguished, including the limitations of mocked/component tests.

Fixed `values` with enough `function`, `return`, `if`, `&&` and conditional-expression syntax to attempt its validator. Fixed `collections` with callback, reduction and spread explanations before those constructs are required in exercises. Added a versioned-importer build order and explicit valid/empty/duplicate cases in `typescript`.

The foundation resource task incorrectly required an importer UI before components. Changed it to a pure importer function and deferred UI work to the appropriate stage. Added `npm ci` before foundation npm test/build commands, since only the direct Node check runs without installed test tools.

## UI & Accessibility, 21 lessons

The sequence already moves from task/semantic structure through forms/dialogs to complex interactions and scoped evaluation. Existing keyboard, form and dialog lessons provide changed-requirement practice with explicit focus/recovery policies.

Fixed `information-architecture` by supplying the twelve items it asked readers to reorganize. The exercise permits a text/sketch attempt before HTML is taught. Fixed `tables-charts` with actual course counts and a worked comparison that separates percentage from remaining workload. Fixed `manual-evaluation` so readers do not have to invent a defect if the demo passes. It offers a clearly labeled, reversible missing-label fault in a copy as practice.

No new conformance or assistive-technology claims were made.

## Full-Stack Journey, 20 lessons

The path intentionally depends on React, .NET and SQL rather than reteaching their languages. The existing stale-write and isolated-restore scenarios already extend the baseline beyond happy-path execution.

Added an independent `first-slice` feature: derive Open minutes from incomplete sessions. Explicit cases require 25 initially, 0 after successful completion and unchanged 25 after conflict. This adds implementation work beyond merely running the supplied UI. Added it to the stage project, resources and practice milestone guide.

Clarified `retries` implementation order: design receipt tests now; use a synthetic owner only in a local fixture; complete verified identity before multi-user receipt implementation. The practice milestone guide repeats that dependency. Converted the mandatory workbook sentence and evidence worksheet into optional guidance without weakening required behavioral checks.

## Verification

- All four newly added executable examples passed: Python dependency failure, DSA key function, DSA node references and JavaScript validator syntax.
- Python project, async and I/O suites: 26 tests passed.
- DSA tree/graph, advanced oracle and method-selection suites: 10 tests passed, plus advanced reference assertions.
- Design-pattern workshop, collaboration and refactoring suites: 25 tests passed.
- Python challenge independent reference suite: 9 tests passed. Reference implementations and cases are unchanged by this pass.
- UI contrast arithmetic and semantic guardrails passed. Those checks are not browser or screen-reader evidence.
- JSON parsing, quiz answer indexes and existence of every referenced public file passed for all eight paths.
- `git diff --check` passed. Git emitted line-ending warnings for unrelated concurrent changes, without whitespace errors.

This is a complete ordered-content review of these eight paths, not a measured learner study, renewed citation-by-citation fact check or execution of every advanced extension. The primary integration pass owns catalogue generation, bundles and notebook-wide checks.
