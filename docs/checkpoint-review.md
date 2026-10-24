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

Code: `assets/js/notebook-review.js`, with rendering in `assets/js/catalog.js`. Tests: `tests/notebook-review.cjs`, `tests/checkpoint-questions.cjs`, the checkpoint cases in `tests/notebook-backup.cjs`, and the lesson-page check in `tests/programming-paths.cjs`.
