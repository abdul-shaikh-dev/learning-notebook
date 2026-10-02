# Design Patterns workshop

Visual companions in the notebook: [Export-preview collaboration](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#topic/design-patterns/facade) · [Working-copy success and failure](https://abdul-shaikh-dev.github.io/learning-notebook/index.html#topic/design-patterns/unit-of-work). The original text traces below remain available for offline use.


Read the 24-lesson path first or use this workshop beside its three stage projects.
Basic functions, collections, exceptions and classes are prerequisites. Python
3.11+ is sufficient; no packages, accounts or services are required.

Save `workshop.py` and `test_workshop.py` into the same folder. Run:

```text
python workshop.py
python -m unittest -v test_workshop.py
```

The demo prints a JSON list, one successful output size, and `State: done`.
The 14 tests exercise observable contracts and failure paths. They are not
production database, concurrency, network, security or performance tests.

## Vocabulary and collaboration

A **collaborator** is an object or function called to perform part of a job.
A **contract** describes inputs, outputs, failures and side effects.
An **invariant** is a rule that must remain true at a defined boundary.
A **variation point** is a part expected to change independently.
A **lifecycle** is the sequence of legal states and ownership of resources.

```text
Application entry point
   | chooses a formatter (simple factory)
   v
export_preview ----> validate_titles
   |
   v
measured wrapper --> selected formatter --> string result
   |
   +---------------> success-size recorder

complete_lesson --> unit_of_work --> working repository
                         |
                 body succeeds?
                  /          \
                yes          no
                 |            |
          publish copy   preserve original
```

Each arrow represents a dependency or call, not a service deployment. All of
this workshop runs synchronously in one process. There is no durable storage.

## Decision guide

| Pressure | Candidate | Simpler alternative | Cost or warning |
|---|---|---|---|
| Interchangeable ranking/formatting policy | Strategy | Pass a function | Keep return/error contracts compatible |
| Choose one implementation | Simple factory | Explicit branch at entry point | Do not call every factory Factory Method |
| Stable creator delegates construction to subclasses | Factory Method | Constructor parameter | Inheritance couples creator and subclasses |
| Related products must vary together | Abstract Factory | Construct products explicitly | Family abstraction is unnecessary for one product |
| Complex staged valid construction | Builder | Validated constructor | Mutable builders can leak settings between uses |
| Existing interface has different units or shape | Adapter | Small conversion function | Unit/error translation needs tests |
| Several subsystem calls form one use case | Facade | A focused function | Does not imply atomicity or hide meaningful failures |
| Add behavior around the same role | Decorator | Direct call with explicit surrounding code | Order changes behavior; avoid blind retries |
| Uniform operation on leaves and groups | Composite | Direct tree traversal | Shared nodes, cycles and depth need a policy |
| Delay or control access | Proxy | Explicit loader/service call | Caching and remote failures remain visible concerns |
| Notify several local consumers | Observer | Explicit calls | Subscriber lifetime, ordering and failures need policy |
| Store or defer an action | Command | Function plus arguments | Undo and durable execution need additional guarantees |
| Behavior follows legal lifecycle transitions | State | Transition table | Does not solve concurrent updates |
| Stable algorithm with subclass hooks | Template Method | Inject functions | Fragile hooks and inheritance coupling |
| Hide traversal representation | Iterator | Return a small list | Laziness delays errors and may hold resources |
| Replace infrastructure at a policy boundary | Dependency injection | Explicit function parameters | Ownership and lifetime still matter |
| Domain-facing persistence collection | Repository | Direct ORM use | Generic CRUD wrappers can add no value |
| Coordinate a business operation's changes | Unit of Work | Use the provider transaction directly | Real atomicity comes from the provider |

## Stage projects

1. **Two-format study exporter:** validate titles, select lines/JSON, preserve
   order, reject unknown formats. Explain why functions are sufficient.
2. **Measured export preview:** adapt seconds to whole minutes, layer a success
   measurement wrapper, and prove failure never counts as success. Explain
   facade versus adapter versus decorator versus proxy.
3. **Local completion workflow:** commit only legal active-to-done transitions,
   reject missing IDs and repeated completion, prove rollback after a working
   mutation, then write a production migration and integration-test plan.

The complete rubrics and worked design solutions are in the online path and
printable study pack. Attempt each brief before reading the reference code.

## Contracts and limits

- Titles are trimmed and nonblank; previews preserve order and do not mutate
  input lists. JSON and line output represent the same validated titles.
- Measurements count successful output characters, not bytes or elapsed time.
  There is no retry behavior and exceptions propagate.
- The minutes adapter floors nonnegative integer seconds and rejects booleans,
  strings, negative numbers and fractions. This is an explicit study-time
  display rule, not a general financial rounding rule.
- Lesson values are immutable strings in a frozen dataclass. The shallow copy
  used by the local unit of work is sufficient for these values only; adding
  nested mutable fields requires rethinking the ownership model.
- The store is single-process and sequential. Replacing a dictionary with
  clear/update is not atomic to concurrent observers, not durable and not
  crash-safe. No database guarantees are implied.
- Repeated completion is rejected. Another application might choose an
  idempotent success response; that is a contract decision requiring tests.
- The failing-repository test proves that this local working-copy failure is
  not published. It cannot prove SQL constraints, isolation or provider
  translation. Use actual-provider integration tests for those properties.
- Do not send email inside this local unit of work and call it atomic. External
  effects need a separate delivery/retry/duplicate-handling design.

## Discuss your design

Explain which change is difficult and how your proposed design helps. Compare it
with a simpler option, then name a test that would catch a broken assumption.
Discuss failure handling or resource ownership when your design changes them.
You can explain this aloud or keep a short note; no worksheet is required.
Name one future requirement that would make you reconsider the design.

## Selected catalog and collaboration lab

This Python-oriented catalog selects GoF patterns and adds DI/Repository/Unit of Work; it does not cover all 23 classic patterns. Canonical source: Gamma, Helm, Johnson, Vlissides, Design Patterns (1994), ISBN 9780201633610. Read the new Chain of Responsibility and Mediator lessons and collaboration.py. Run `python -m unittest -v test_collaboration.py`. First-handler short circuit differs from Observer broadcast; Mediator owns coordination rules; Command represents an action. Exercise: reverse overlapping handlers, add a new prerequisite and verify no notification is produced by failed validation. Local notification records provide no external delivery guarantee.

## Refactoring lab

Use `legacy_export.py`, `test_refactoring.py` and `refactoring-lab.md` to practice the actual structural migration; `refactored_export.py` shows one behavior-preserving endpoint. Run `python -m unittest -v test_refactoring.py`.
