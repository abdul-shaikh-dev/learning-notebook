# Checkpoint review

Each lesson's "Check your understanding" question saves the learner's first answer on that page view. Later clicks still show the explanation but do not change the record. After a save, an "Undo: I chose by mistake" button restores the previous record (or removes a first answer), and the next choice is saved instead. Outcomes are stored per course in `learning-notebook:path:<id>:checkpoints:v1` as `{questionKey: {correct, streak, at}}`, where `at` is a millisecond timestamp.

Question keys:

| Key | Question |
| --- | --- |
| `<lessonId>` | The lesson's main checkpoint (`quiz`) |
| `<lessonId>/<n>`, n 2–9 | An extra lesson question, `extraQuiz[n - 2]` |
| `stage/<stageId>/<n>`, n 1–9 | An end-of-stage question, `stageCheck[n - 1]` |

Keys are checked against the catalog's lesson and stage IDs, so they can be validated before a course's content loads. Each question is scheduled on its own.

The schedule is deliberately small:

- A missed answer is due at once and stays due until it is answered correctly.
- Correct answers return after 1, 3 and then 7 days. A correct answer given after the 7-day gap retires the question.
- A correct answer before the due date, or after retirement, keeps the current schedule. Any miss restarts it.

The home page shows a Review card once any checkpoint has been answered: a count of due questions, or a one-line note of how many are scheduled and when the next returns, linking to the schedule. `#review` lists up to ten due questions, missed first, then oldest due. It loads only the course chunks those questions need. Below them, "Coming up" lists up to 20 scheduled questions, soonest first, from catalog titles alone (a stage question is labelled "Stage 2 check · Question 1"). Answers given there follow the same rules and link back to the lesson, or to the course page for stage questions.

Backups include a course's `checkpoints` only when it has saved answers, so older backups and older notebook versions keep working. On import the more recent answer for each question wins, with this browser winning a tie. Invalid entries, including unknown keys, reject the whole file before anything is written.

## Adding questions

Extra lesson questions and stage checks live in `paths/<id>/checkpoints.json`, beside `path.json`:

```json
{
  "lessons": {"loops": [{"question": "…", "options": ["…", "…", "…"], "correct": 1, "explanation": "…"}]},
  "stages": {"foundation": [{"question": "…", "options": ["…", "…", "…"], "correct": 0, "explanation": "…"}]}
}
```

- A lesson needs a main `quiz` before it can have extra questions; it can have up to 8. A stage can have up to 9.
- Every question needs at least two distinct, non-blank options, a valid `correct` index and an explanation. `scripts/manifest.cjs` rejects anything else, so `node scripts/sync-catalog.cjs` fails on a bad file.
- The authored order of options does not matter: the page places the correct answer at a position derived from the question key, and keeps that order on every visit and in review.
- Keep questions in order once published. A saved answer is keyed by position, so inserting a question in the middle would attach existing answers to a different question. Add new questions at the end.
- Run `node scripts/sync-catalog.cjs` to regenerate the course chunk.

Extra questions appear under the lesson's main checkpoint. Stage checks appear as "Check this stage" in each stage section of the course page, before the stage project. The print pack includes both, with answers.

### Python course

The Python course has one extra question per lesson and three questions per stage. Every answer that depends on code behavior (for example `7 // 2`, aliasing after `second = first`, mutable defaults, JSON key conversion, generator exhaustion, `argparse` accepting `-5`, unenforced dataclass annotations, `ThreadPoolExecutor.map` order and a blocking `time.sleep` inside a coroutine) was checked by running it on Python 3.14.

### Data Structures & Algorithms, Design Patterns, Practical maths & statistics

These courses also have one extra question per lesson and three per stage: 66 lesson questions and 27 stage questions. 72 of the 93 answers depend on code or arithmetic, for example `bisect_left` on repeated values, stable sorting with a key, a memoised Fibonacci call count, decorator order, `zip` over one shared iterator, late-binding lambdas in a list of commands, `functools.wraps`, the median of an even-length list, a 90%-accurate test at 1% prevalence and a zero Pearson correlation for `y = x²`.

Each of those answers has a fact check in `tests/checkpoint_facts.py`: a short program, keyed by course and question key, that computes the answer and sets `answer` to the text of the correct option. `tests/browser-python.cjs` runs every fact in the bundled browser Python runtime and fails if the marked option differs, so a later edit that changes an answer or its options is caught. The remaining 21 questions are about design judgement or study design, such as when a pattern earns its indirection, and have no program to run. The bundled runtime has no `sqlite3`, so the Unit of Work question is phrased without a database.

When adding a code-based question to a Python course, add its fact in the same change.

### Git & Team Workflows

2026-11-01: one extra question per lesson and three per stage (20 lesson questions, 9 stage questions). 28 of the 29 answers depend on Git behaviour, for example what plain `git diff` shows after a staged and a later unstaged edit, `UU` for a merge conflict, fast-forward by default, `git diff main...feature` showing only the feature's changes, `HEAD@{1}` after a hard reset, the `-x` line from cherry-pick, `git describe` after a tag, exit code 125 skipping a revision in `git bisect run`, and an empty cherry-pick stopping.

`tests/git_checkpoint_facts.py` checks each of those 28 with real Git. Each fact builds a fresh repository with the course's own `Sandbox` from `paths/git-team-workflows/sandbox.py`, so it isolates configuration and hooks and never pushes. It fails if Git's result supports a different option than the one marked correct, and lists any question without a fact. The remaining answer, the order of recovery steps after a failed release, is cited from lesson 20. The check runs in the `python` CI job on Python 3.11 and 3.14 and needs Git 2.28 or later; run it locally with `python tests/git_checkpoint_facts.py`.

Writing the facts corrected one draft answer: with 16 commits to bisect, Git reports "7 revisions left to test after this (roughly 3 steps)" once it checks out the first midpoint, not 4, so the question asks for the number Git prints.

### Networking & the Web

2026-11-01: one extra question per lesson and three per stage (24 lesson questions, 9 stage questions). 30 of the 33 answers depend on how the course labs or the standard library behave, for example a 200 from `/bad-json` that the decoder rejects, a TTL of 0 leaving no cached answer, `b'incomplete'` raising "EOF inside a frame", HEAD reporting the GET length with an empty body, a non-matching `If-None-Match` returning 200 with the current ETag, Python refusing `CERT_NONE` while hostname checking is on, the `/stall` request reaching the server before the client times out, and a `true` version failing the lesson contract.

`tests/network_checkpoint_facts.py` checks each of those 30 by running the labs in `paths/networking-web/practice`: the offline DNS, cache and retry models, the loopback HTTP server and the loopback TCP framing exchange. Nothing leaves 127.0.0.1. It fails if a lab's result supports a different option than the one marked correct, and lists any question without a fact. The other three answers are cited from the lessons: forwarded fields from lesson 18, HTTP semantics across versions from lesson 23 and the unexecuted extensions from lesson 24. The check runs in the `python` CI job on Python 3.11 and 3.14; run it locally with `python tests/network_checkpoint_facts.py`.

### Messaging & Event-Driven Systems

2026-11-02: one extra question per lesson and three per stage (22 lesson questions, 9 stage questions). 22 of the 31 answers depend on how the course's SQLite outbox and inbox lab behaves, or on its arithmetic, for example a republished event changing the projection once, a crash inside `consume` rolling back the inbox row so the redelivery applies, a reused event ID with a different value raising "event identity collision", a crashed `create_job` leaving neither the job nor the outbox row, an unsent outbox row surviving a restart, and retry delays of 1, 2 and 4 seconds overrunning a 5-second expiry.

`tests/messaging_checkpoint_facts.py` checks each of those 22 by running `paths/messaging-events/practice/event_lab.py` against in-memory or temporary SQLite databases. It fails if the lab's result supports a different option than the one marked correct, and lists any question without a fact. The other nine are about design judgement (event naming, competing workers, external effects, ordering, offsets, sagas, tenancy, broker choice and recovery) and are cited from lessons 1, 2, 5, 13, 16, 17, 18, 21 and 22. The optional RabbitMQ drill needs a local broker, so no answer depends on it. The check runs in the `python` CI job on Python 3.11 and 3.14; run it locally with `python tests/messaging_checkpoint_facts.py`.

### Data Engineering

2026-11-02: one extra question per lesson and three per stage (22 lesson questions, 9 stage questions). 26 of the 31 answers depend on how the course labs, SQLite or Python behave, for example a byte-order mark breaking the exact header check, a failed batch rolling back its new order and run marker, the same orders with CRLF line endings conflicting under the same batch ID, a late row falling behind an `occurred_at` watermark, a customer listed three times tripling a joined total, `BETWEEN` matching both versions on a boundary day, a revised order replacing its old contribution instead of adding to it, and `0.10 + 0.20 == 0.30` being false.

`tests/data_engineering_checkpoint_facts.py` checks each of those 26 by running `pipeline_lab.py` and `revision_lab.py` from `paths/data-engineering/practice` against temporary files and SQLite databases. It fails if a result supports a different option than the one marked correct, and lists any question without a fact. The other five are cited from lessons 2, 14, 19, 20 and 22: the raw zone, what publishing depends on, where deletions must reach, what `DATETIME2` records and what the local baseline does not establish. The optional T-SQL script is not executed. The check runs in the `python` CI job on Python 3.11 and 3.14; run it locally with `python tests/data_engineering_checkpoint_facts.py`.

### SQL Server & T-SQL

2026-11-03: one extra question per lesson and three per stage (24 lesson questions, 9 stage questions). 30 of the 33 answers depend on how SQL Server behaves on the course fixture, for example `5/2` being 2, `NOT IN (101, NULL)` returning no rows, an inner join of orders to payments totalling 370 instead of 390, `PRINT` resetting `@@ROWCOUNT` to 0, `XACT_STATE()` being -1 after an error under `XACT_ABORT`, a parameter value `' OR 1=1 --` matching nothing, `QUOTENAME(N'a]b')` doubling the bracket, a stale-revision update changing 0 rows, `TRY_CONVERT(int, N'')` returning 0 and one `ROLLBACK` ending both nested transactions.

`tests/sql_checkpoint_facts.py` checks each of those 30 on a real SQL Server. It runs the course's `setup.sql` fixture, and for the capstone question `advanced-lab.sql` and `advanced-solutions.sql`, then one batch per fact, using only connection-local temporary tables in tempdb. It fails if the engine's result supports a different option than the one marked correct, and lists any question without a fact. The other three are cited from lessons 11, 16 and 19: what an `INCLUDE` column adds, which date predicate stays sargable and what an empty Query Store result establishes. The check runs in the `sql-server` CI job against a disposable SQL Server 2022 container; run it locally with `python tests/sql_checkpoint_facts.py --server .\SQLEXPRESS`. It was first run against SQL Server 2025 Express.

Writing the facts corrected one draft answer: the join of orders to payments totals 370, not 470, because order 101 is counted twice and order 104, with no payment, is dropped.

### Plan for the remaining courses

Work one course per change, in this order, so that each answer can be checked against something that runs or a cited source:

1. **Courses whose answers run in another tool:** Data analysis with Python and Machine learning foundations (CPython with the course's packages), C# & .NET (`dotnet run`), JavaScript → TypeScript → React (Node) and Linux & Operating Systems (a shell). Record each check in this document, as for the Python course, because only the bundled Python runtime is part of `tests/browser-python.cjs`.
2. **Courses checked against their cited sources:** Networking & the Web, Messaging & Event-Driven Systems and Data Engineering are done; next come Testing & Debugging, AI Agents, Agent Harnesses, Application Security, Kubernetes, Cloud & Infrastructure as Code, Observability & Performance, Delivery & Operations, System Design, UI Design & Accessibility, Full-Stack Project Journey and Requirements & software maintenance. Each answer should trace to a lesson source or a primary reference such as a specification or WCAG success criterion.
3. **Personal effectiveness and development courses:** Learning How to Learn, Habits & Behaviour Change, Self-Awareness & Communication, Task & Project Management, Time, Attention & Energy and Plan and Review Your Week. Questions should test the course's own model and avoid claims stronger than its sources.

Python Problem Solving is left out because its lessons are challenges with tests, and Financial foundations because it has its own course page and question format.

Code: `assets/js/notebook-review.js`, with rendering in `assets/js/catalog.js`. Tests: `tests/notebook-review.cjs`, `tests/checkpoint-questions.cjs`, the checkpoint cases in `tests/notebook-backup.cjs`, and the lesson-page check in `tests/programming-paths.cjs`.

## Exercise attempts

Each lesson's "Practice this idea" exercise has an answer box. The answer is saved in this browser as it is typed (at most 5,000 characters) under `learning-notebook:path:<id>:exercises:v1`, keyed by lesson ID. The worked solution opens when the learner compares a written attempt with it; "Show the solution without answering" opens it at any time. Coding challenges in Python Problem Solving keep their own editor and are unchanged. Printed packs still show the prompt, checklist and solution.

After comparing, the learner rates the attempt against the checklist: matched it, partly or missed it.

- A first attempt that matches is saved but not scheduled.
- Partly or missed puts the exercise into Review at once, on the checkpoint schedule: it stays due until an attempt matches, then returns after 1, 3 and 7 days and retires after a match following the 7-day gap.
- Changing the rating on the same visit replaces the earlier choice instead of adding to the streak.

Review lists due exercises beside due questions. An exercise in review starts with an empty box; the earlier answer appears beside the worked solution, and an empty box never erases it. Progress counts exercises attempted per course. Backups include a course's `exercises` only when it has some, and on import the more recent change to each exercise (answer or rating) wins, with this browser winning a tie. `tests/exercise-attempts.cjs` covers saving, rating, scheduling, the review page, backups and progress.

### AI Agents

2026-11-06: one extra question per lesson and three per stage (24 lesson questions, 9 stage questions). 26 of the 33 answers depend on how the course's offline labs behave, for example a tool name outside the registry being denied before it starts, a search with no hits still counting as `tool_succeeded`, a finish with `max_steps=1` never being asked for, an unobserved or duplicated citation making the run invalid, four hits from an adapter failing the three-hit observation bound, a paraphrased query finding nothing in the lexical search, and the injection case's heuristic failing an answer that repeats the forbidden marker.

`tests/ai_agents_checkpoint_facts.py` checks each of those 26 by running `workshop.py` with scripted proposals and test adapters, `provider_eval.py` and `provider_scaffold.py` offline, and the model-free search and citation check in `local_framework_lab.py`. No model, network or credentials are used. It fails if a result supports a different option than the one marked correct, and lists any question without a fact. The other seven are about design judgement and are cited from lessons 2, 12, 13, 14, 15, 22 and 23: fixed workflows, scoped memory, revising a plan, material ambiguity, approval binding, aggregate budgets and the release bundle. The check runs in the `python` CI job on Python 3.11 and 3.14; run it locally with `python tests/ai_agents_checkpoint_facts.py`.

### Agent Harnesses

2026-11-06: one extra question per lesson and three per stage (24 lesson questions, 9 stage questions). 29 of the 33 answers depend on how the course's offline labs behave, for example a save waiting for a host decision before any effect, an approval for a different fingerprint raising and leaving the run waiting, a lost reply making the save uncertain and `reconcile()` confirming it from the receipt without a second effect, a restored checkpoint dropping the approval, an edited script or another subject failing restore, a stale checkpoint save raising `Conflict`, and a process that dies after the SQLite commit being restored as uncertain.

`tests/agent_harnesses_checkpoint_facts.py` checks each of those 29 by running `harness_workshop.py` with scripted proposals and `FakeStore`, and `durable_state.py` and `persisted_run_lab.py` against SQLite files in a temporary folder. No model, network or credentials are used. It fails if a result supports a different option than the one marked correct, and lists any question without a fact. The other four are about design judgement and are cited from lessons 17, 19, 21 and 22: where credentials live beside isolated compute, replay without reissued effects, separate evaluation checks and policy rollback. The check runs in the `python` CI job on Python 3.11 and 3.14; run it locally with `python tests/agent_harnesses_checkpoint_facts.py`.

### Application Security

2026-11-06: one extra question per lesson and three per stage (21 lesson questions, 9 stage questions; the stages split lessons 8/7/6). 22 of the 30 answers depend on how the course's offline labs behave, for example a missing and a denied document raising the same error, a rotated session ID no longer resolving, a session expiring exactly at 300 seconds, a bound SQL parameter matching nothing, a fourth request in one window being refused, the HTTP seam refusing a mutation without its CSRF token and reporting another owner's or another tenant's document as unavailable, and duplicate or replayed login states failing.

`tests/application_security_checkpoint_facts.py` checks each of those 22 by running `security_lab.py`, `login_flow_lab.py` and the `security_http.py` seam on 127.0.0.1 with a synthetic session and a SQLite file in a temporary folder. No credentials or outside network are used. It fails if a result supports a different option than the one marked correct, and lists any question without a fact. The other eight are about design judgement and are cited from lessons 7, 8, 12, 13, 15, 16, 18 and 21: the `__Host-` cookie prefix, password storage, token scope versus ownership, issuer-qualified subjects, audience checks, secrets in environment variables, the shipped artifact and incident scope. The check runs in the `python` CI job on Python 3.11 and 3.14; run it locally with `python tests/application_security_checkpoint_facts.py`.

### Testing & Debugging

2026-11-06: one extra question per lesson and three per stage (24 lesson questions, 9 stage questions). 27 of the 33 answers depend on how the course's offline labs behave, for example both ends of 0..1440 being accepted, a rejected batch leaving no destination file, a failing `replace` double leaving no temporary file, `buggy_minutes(True)` returning True, the tie test failing on `cursor_candidate` and passing on `cursor_reference`, a positive-only test executing every line of `label`, a barrier race giving one success and one `Conflict`, cancellation still releasing the synthetic resource, and `benchmark()` refusing to time a wrong implementation.

`tests/testing_debugging_checkpoint_facts.py` checks each of those 27 by importing the labs in `paths/testing-debugging/practice`, running the cursor and branch tests programmatically, tracing the lines `label` executes and running `testing_integration.py` as a subprocess. Files go only to temporary folders. It fails if a result supports a different option than the one marked correct, and lists any question without a fact. The other six are about testing judgement and are cited from lessons 5, 9, 16, 18, 22 and 23: when to register cleanup, which scope reaches the command boundary, historical fixtures, join timeouts, what a passing runner leaves unproven and what a multi-worker fix needs. The check runs in the `python` CI job on Python 3.11 and 3.14; run it locally with `python tests/testing_debugging_checkpoint_facts.py`.
