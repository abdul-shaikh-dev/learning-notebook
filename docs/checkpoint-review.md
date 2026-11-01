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

### Plan for the remaining courses

Work one course per change, in this order, so that each answer can be checked against something that runs or a cited source:

1. **Courses whose answers run in another tool:** Data analysis with Python and Machine learning foundations (CPython with the course's packages), SQL Server & T-SQL (a local SQL Server or the course's scripts), C# & .NET (`dotnet run`), JavaScript → TypeScript → React (Node) and Linux & Operating Systems (a shell). Record each check in this document, as for the Python course, because only the bundled Python runtime is part of `tests/browser-python.cjs`.
2. **Courses checked against their cited sources:** Networking & the Web, Messaging & Event-Driven Systems and Data Engineering first, where answers can also run against the course labs; then Testing & Debugging, AI Agents, Agent Harnesses, Application Security, Kubernetes, Cloud & Infrastructure as Code, Observability & Performance, Delivery & Operations, System Design, UI Design & Accessibility, Full-Stack Project Journey and Requirements & software maintenance. Each answer should trace to a lesson source or a primary reference such as a specification or WCAG success criterion.
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
